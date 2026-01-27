// src/service/course.service.ts
// Course service for managing courses and their curriculum
// This file contains all server-side functions for course operations

"use server"

import { sql } from "../lib/database"
import { CourseStatus } from "../enum/course-status.enum"
//Import thư viện postgres mới để tạo kết nối riêng
import postgres from "postgres"
// Tạo kết nối riêng CHỈ DÙNG cho file này để xử lý Transaction
// ⚠️ QUAN TRỌNG: Hãy đảm bảo bạn có file config export biến env
// Nếu bạn chưa có file src/lib/config.ts, hãy dùng process.env.DATABASE_URL nhưng cẩn thận
// Ở đây tôi dùng process.env trực tiếp nhưng thêm kiểm tra an toà
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL chưa được định nghĩa trong file .env")
}
// Khởi tạo kết nối riêng CHỈ DÙNG cho file này
const sqlTransaction = postgres(connectionString, {
  ssl: "require",
  // max: 1, // Giới hạn connection nếu cần thiết
})

// --- TYPES ---
export type Course = {
  id: number
  creator_id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  status: CourseStatus
  duration_hours: number | null
  enrollment_count: number
  approved_by: number | null
  approved_at: Date | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

// Type cho dữ liệu tạo mới (bao gồm cả Curriculum lồng nhau)
export type CreateCoursePayload = {
  creator_id: number
  title: string
  description?: string | null
  thumbnail_url?: string | null
  status?: CourseStatus | string
  duration_hours?: number
  // Cấu trúc Curriculum nhận từ Client
  curriculum?: {
    title: string
    items: {
      title: string
      type: "lesson" | "quiz"
      resource_id: number
    }[]
  }[]
}

type GetAllCoursesParams = {
  query?: string
  page?: number
  limit?: number
  sort?: "trending" | "popular" | "newest"
}

export async function getAllCoursesAction({
  query = "",
  page = 1,
  limit = 10,
  sort = "trending",
}: GetAllCoursesParams) {
  const offset = (page - 1) * limit
  let orderBy = ""
  switch (sort) {
    case "popular":
      orderBy = "enrollment_count DESC, created_at DESC"
      break
    case "newest":
      orderBy = "created_at DESC, enrollment_count DESC"
      break
    case "trending":
    default:
      // orderBy = "enrollment_count DESC, created_at DESC"// sắp xếp người học nhiều nhất
      orderBy = "created_at DESC" // sắp xếp theo ngày tạo (created_at) giảm dần (DESC)
      break
  }

  const rows = await sql`
    SELECT *
    FROM courses
    WHERE deleted_at IS NULL
      AND title ILIKE ${"%" + query + "%"}
    ORDER BY ${sql.unsafe(orderBy)}
    LIMIT ${limit}
    OFFSET ${offset}
  `
  const totalResult = await sql`
    SELECT COUNT(*) 
    FROM courses 
    WHERE deleted_at IS NULL
      AND title ILIKE ${"%" + query + "%"}
  `
  const totalCount = parseInt(totalResult[0].count as string, 10)
  return {
    courses: rows as Course[],
    totalCount,
  }
}

export async function getCourseByIdAction(id: number) {
  // 1. Lấy thông tin cơ bản của Course
  const courseResult = await sql`
    SELECT * FROM courses
    WHERE id = ${id} AND deleted_at IS NULL
  `
  if (courseResult.length === 0) return null
  const course = courseResult[0] as Course
  // 2. Lấy danh sách Sections của Course đó (Sắp xếp theo order)
  const sectionsResult = await sql`
    SELECT * FROM sections 
    WHERE course_id = ${id} 
    ORDER BY "order" ASC
  `
  // 3. Lấy danh sách Items của các Section đó
  // Cần JOIN với lessons và quizzes để lấy Title và Duration hiển thị lên UI
  const sectionIds = sectionsResult.map((s) => s.id)
  let itemsResult: any[] = []
  if (sectionIds.length > 0) {
    itemsResult = await sql`
      SELECT 
        ci.id,
        ci.section_id,
        ci.type,
        ci."order",
        ci.lesson_id,
        ci.quiz_id,
        -- Lấy thông tin từ Lesson
        l.title as lesson_title,
        l.duration_minutes as lesson_duration,
        -- Lấy thông tin từ Quiz
        q.title as quiz_title,

        0 as quiz_question_count

      FROM curriculum_items ci
      LEFT JOIN lessons l ON ci.lesson_id = l.id
      LEFT JOIN quizzes q ON ci.quiz_id = q.id
     
      WHERE ci.section_id = ANY(${sectionIds})
      ORDER BY ci."order" ASC
    `
  }
  // 4. Ghép dữ liệu (Mapping) để tạo cấu trúc lồng nhau (Nested Structure)
  const curriculum = sectionsResult.map((section) => {
    // Lọc các item thuộc section này
    const items = itemsResult
      .filter((item) => item.section_id === section.id)
      .map((item) => ({
        id: item.id, // ID của item trong bảng curriculum_items
        order: item.order,
        type: item.type,
        // Xác định Resource ID và Title dựa trên Type
        resource_id: item.type === "lesson" ? item.lesson_id : item.quiz_id,
        title: item.type === "lesson" ? item.lesson_title : item.quiz_title,
        // Các thông tin phụ
        duration_minutes: item.lesson_duration || 0,
        question_count: item.quiz_question_count || 0,
      }))

    return {
      id: section.id, // ID của Section (UUID hoặc số)
      title: section.title,
      order: section.order,
      items: items,
    }
  })
  // 5. Trả về object Course đầy đủ bao gồm cả curriculum
  return {
    ...course,
    curriculum: curriculum, // Đây chính là dữ liệu để hiển thị cột phải
  }
}

// --- HÀM CREATE (Dùng 'sqlTransaction' riêng) ---
// --- HÀM CREATE (SỬA LỖI & THÊM LOG) ---
export async function createCourseAction(courseData: CreateCoursePayload) {
  console.log("🚀 [Service] Bắt đầu tạo khóa học:", courseData.title)

  try {
    const result = await sqlTransaction.begin(async (tx: any) => {
      // 1. Insert Course
      const newCourseResult = await tx`
        INSERT INTO courses (
          creator_id, title, description, thumbnail_url, status, duration_hours, created_at, updated_at
        ) VALUES (
          ${courseData.creator_id},
          ${courseData.title},
          ${courseData.description || null},
          ${courseData.thumbnail_url || null},
          ${courseData.status || "draft"},
          ${courseData.duration_hours || 0},
          NOW(), NOW()
        )
        RETURNING id
      `
      const courseId = newCourseResult[0].id
      console.log("✅ [Service] Tạo Course thành công, ID:", courseId)

      // 2. Insert Sections & Items
      if (courseData.curriculum && courseData.curriculum.length > 0) {
        for (const [sIndex, section] of courseData.curriculum.entries()) {
          const newSectionResult = await tx`
            INSERT INTO sections (course_id, title, "order")
            VALUES (${courseId}, ${section.title}, ${sIndex})
            RETURNING id
          `
          const newSectionId = newSectionResult[0].id
          // console.log(`  -> Tạo Section "${section.title}" ID: ${newSectionId}`)

          if (section.items && section.items.length > 0) {
            for (const [iIndex, item] of section.items.entries()) {
              const lessonId = item.type === "lesson" ? item.resource_id : null
              const quizId = item.type === "quiz" ? item.resource_id : null

              // Kiểm tra xem ID có tồn tại không để tránh lỗi Foreign Key
              if (!lessonId && !quizId) {
                console.warn(
                  `⚠️ Item "${item.title}" không có resource_id hợp lệ, bỏ qua.`
                )
                continue
              }

              await tx`
                INSERT INTO curriculum_items (
                  section_id, type, "order", lesson_id, quiz_id
                ) VALUES (
                  ${newSectionId},
                  ${item.type},
                  ${iIndex},
                  ${lessonId},
                  ${quizId}
                )
              `
            }
          }
        }
      }

      return { success: true, courseId }
    })

    return result
  } catch (error) {
    console.error("❌ [Service Error] Lỗi Transaction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create course",
    }
  }
}

export async function updateFullCourseAction(id: number, data: any) {
  try {
    // Sử dụng sqlTransaction đã khởi tạo ở đầu file để thực hiện Transaction
    return await sqlTransaction.begin(async (tx: any) => {
      // 1. Cập nhật bảng 'courses'
      await tx`
        UPDATE courses
        SET
          title = ${data.title},
          description = ${data.description || null},
          thumbnail_url = ${data.thumbnail_url || null},
          status = ${data.status || "draft"},
          duration_hours = ${data.duration_hours || 0},
          updated_at = NOW()
        WHERE id = ${id}
      `

      // 2. Xóa sạch Curriculum cũ (Items xóa trước, Sections xóa sau)
      await tx`
        DELETE FROM curriculum_items 
        WHERE section_id IN (SELECT id FROM sections WHERE course_id = ${id})
      `
      await tx`DELETE FROM sections WHERE course_id = ${id}`

      // 3. Chèn lại Curriculum mới từ payload
      if (data.curriculum && data.curriculum.length > 0) {
        for (const [sIndex, section] of data.curriculum.entries()) {
          const [newSection] = await tx`
            INSERT INTO sections (course_id, title, "order")
            VALUES (${id}, ${section.title}, ${sIndex})
            RETURNING id
          `

          if (section.items && section.items.length > 0) {
            for (const [iIndex, item] of section.items.entries()) {
              const lessonId = item.type === "lesson" ? item.resource_id : null
              const quizId = item.type === "quiz" ? item.resource_id : null

              await tx`
                INSERT INTO curriculum_items (section_id, type, "order", lesson_id, quiz_id)
                VALUES (${newSection.id}, ${item.type}, ${iIndex}, ${lessonId}, ${quizId})
              `
            }
          }
        }
      }

      return { success: true }
    })
  } catch (error) {
    console.error("❌ [Service Error]:", error)
    return { success: false, error: "Database transaction failed" }
  }
}

export async function deleteCourseAction(id: number) {
  try {
    const result = await sql`
      UPDATE courses
      SET deleted_at = NOW()
      WHERE id = ${id}
        AND deleted_at IS NULL  -- ✅ THÊM: Chỉ xóa nếu chưa bị xóa
      RETURNING id
    `

    if (result.length === 0) {
      // Message chính xác hơn: Không tìm thấy hoặc đã bị xóa trước đó
      return { success: false, error: "Course not found or already deleted" }
    }

    return { success: true, message: "Course moved to trash successfully" }
  } catch (error) {
    console.error("Error in deleteCourseAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    }
  }
}

export async function approveCourseAction(id: number, approvedBy: number) {
  console.log("approveCourseAction called with:", { id, approvedBy })
  try {
    const result = await sql`
      UPDATE courses
      SET
        status = 'published',
        approved_by = ${approvedBy},
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id} 
        AND (status = 'pending_approval' OR status = 'draft')
        AND deleted_at IS NULL -- ✅ QUAN TRỌNG: Không được approve khóa học đang trong thùng rác
      RETURNING *
    `
    console.log("Update result:", result)
    return result.length > 0 ? (result[0] as Course) : null
  } catch (error) {
    console.error("Error in approveCourseAction:", error)
    throw error
  }
}