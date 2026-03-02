// src/service/course.service.ts
// Course service for managing courses and their curriculum
// This file contains all server-side functions for course operations

"use server"

import { sql } from "../lib/database"
import { CourseStatus } from "../enum/course-status.enum"
import postgres from "postgres"

// --- DATABASE CONNECTION FOR TRANSACTIONS ---
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL chưa được định nghĩa trong file .env")
}

// Khởi tạo kết nối riêng CHỈ DÙNG cho file này để xử lý Transaction
const sqlTransaction = postgres(connectionString, {
  ssl: "require",
})

// --- TYPES ---
export type Course = {
  id: number
  creator_id: number
  category_id: number | null // ✅ Added category_id
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
  category_id?: number | null // ✅ Added category_id
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
  category?: string // ✅ Added filter param
}

// --- CATEGORY ACTIONS ---

// 1. Lấy danh sách Category (Mới)
export async function getAllCategoriesAction() {
  try {
    const categories = await sql`
      SELECT id, name FROM categories 
      WHERE is_deleted = false 
      ORDER BY name ASC
    `
    // Map về dạng đơn giản để dùng ở Frontend (chuyển BigInt sang Number)
    return categories.map((c: any) => ({ id: Number(c.id), name: c.name }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

// --- COURSE FETCH ACTIONS ---

export async function getAllCoursesAction({
  query = "",
  page = 1,
  limit = 10,
  sort = "trending",
  category = "all", // ✅ Default param
}: GetAllCoursesParams) {
  const offset = (page - 1) * limit

  // Xử lý Sort
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
      orderBy = "created_at DESC"
      break
  }

  // ✅ Xử lý Filter Category (An toàn hơn)
  // Chỉ lọc khi category khác "all", khác rỗng và tồn tại
  const categoryCondition =
    category && category !== "all" && category !== ""
      ? sql`AND category_id = ${category}`
      : sql``

  // Query Courses
  const rows = await sql`
    SELECT *
    FROM courses
    WHERE deleted_at IS NULL
      AND title ILIKE ${"%" + query + "%"}
      ${categoryCondition} 
    ORDER BY ${sql.unsafe(orderBy)}
    LIMIT ${limit}
    OFFSET ${offset}
  `

  // Count Total
  const totalResult = await sql`
    SELECT COUNT(*) 
    FROM courses 
    WHERE deleted_at IS NULL
      AND title ILIKE ${"%" + query + "%"}
      ${categoryCondition}
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

  // 2. Lấy danh sách Sections
  const sectionsResult = await sql`
    SELECT * FROM sections 
    WHERE course_id = ${id} 
    ORDER BY "order" ASC
  `

  // 3. Lấy danh sách Items
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
        l.title as lesson_title,
        l.duration_minutes as lesson_duration,
        q.title as quiz_title,
        0 as quiz_question_count
      FROM curriculum_items ci
      LEFT JOIN lessons l ON ci.lesson_id = l.id
      LEFT JOIN quizzes q ON ci.quiz_id = q.id
      WHERE ci.section_id = ANY(${sectionIds})
      ORDER BY ci."order" ASC
    `
  }

  // 4. Ghép dữ liệu (Mapping)
  const curriculum = sectionsResult.map((section) => {
    const items = itemsResult
      .filter((item) => item.section_id === section.id)
      .map((item) => ({
        id: item.id,
        order: item.order,
        type: item.type,
        resource_id: item.type === "lesson" ? item.lesson_id : item.quiz_id,
        title: item.type === "lesson" ? item.lesson_title : item.quiz_title,
        duration_minutes: item.lesson_duration || 0,
        question_count: item.quiz_question_count || 0,
      }))

    return {
      id: section.id,
      title: section.title,
      order: section.order,
      items: items,
    }
  })

  return {
    ...course,
    curriculum: curriculum,
  }
}

// --- COURSE MUTATION ACTIONS ---

export async function createCourseAction(courseData: CreateCoursePayload) {
  console.log("🚀 [Service] Bắt đầu tạo khóa học:", courseData.title)

  try {
    const result = await sqlTransaction.begin(async (tx: any) => {
      const currentTimestamp = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
      })
      // 1. Insert Course
      const newCourseResult = await tx`
        INSERT INTO courses (
          creator_id, title, description, thumbnail_url, status, duration_hours, 
          category_id, created_at, updated_at
        ) VALUES (
          ${courseData.creator_id},
          ${courseData.title},
          ${courseData.description || null},
          ${courseData.thumbnail_url || null},
          ${courseData.status || "draft"},
          ${courseData.duration_hours || 0},
          ${currentTimestamp}, ${currentTimestamp}
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

          if (section.items && section.items.length > 0) {
            for (const [iIndex, item] of section.items.entries()) {
              const lessonId = item.type === "lesson" ? item.resource_id : null
              const quizId = item.type === "quiz" ? item.resource_id : null

              if (!lessonId && !quizId) continue

              await tx`
                INSERT INTO curriculum_items (
                  section_id, type, "order", lesson_id, quiz_id
                ) VALUES (
                  ${newSectionId}, ${item.type}, ${iIndex}, ${lessonId}, ${quizId}
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
    const currentTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
    // Sử dụng sqlTransaction đã khởi tạo ở đầu file để thực hiện Transaction
    return await sqlTransaction.begin(async (tx: any) => {
      // 1. Cập nhật bảng 'courses' (✅ Đã thêm category_id)
      await tx`
        UPDATE courses
        SET
          title = ${data.title},
          description = ${data.description || null},
          thumbnail_url = ${data.thumbnail_url || null},
          status = ${data.status || "draft"},
          duration_hours = ${data.duration_hours || 0},
          updated_at = ${currentTimestamp}
        WHERE id = ${id}
      `

      // 2. Xóa sạch Curriculum cũ
      await tx`
        DELETE FROM curriculum_items 
        WHERE section_id IN (SELECT id FROM sections WHERE course_id = ${id})
      `
      await tx`DELETE FROM sections WHERE course_id = ${id}`

      // 3. Chèn lại Curriculum mới
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
    const existing = await sql`
      SELECT status, deleted_at
      FROM courses
      WHERE id = ${id}
    `

    if (existing.length === 0 || existing[0].deleted_at) {
      return { success: false, error: "Course not found or already deleted" }
    }

    const status = String(existing[0].status)
    if (status === "published" || status === "pending_approval") {
      return {
        success: false,
        error: "Cannot delete a course that is Published or Pending Approval",
      }
    }

    const currentTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
    const result = await sql`
      UPDATE courses
      SET deleted_at = ${currentTimestamp}
      WHERE id = ${id}
        AND deleted_at IS NULL
      RETURNING id
    `

    if (result.length === 0) {
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
  try {
    const currentTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
    const result = await sql`
      UPDATE courses
      SET
        status = 'published',
        approved_by = ${approvedBy},
        approved_at = ${currentTimestamp},
        updated_at = ${currentTimestamp}
      WHERE id = ${id} 
        AND (status = 'pending_approval' OR status = 'draft')
        AND deleted_at IS NULL
      RETURNING *
    `
    return result.length > 0 ? (result[0] as Course) : null
  } catch (error) {
    console.error("Error in approveCourseAction:", error)
    throw error
  }
}

export async function rejectCourseService(courseId: number, reason: string) {
  try {
    const result = await sql`
      UPDATE courses 
      SET 
        status = 'rejected',
        rejection_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${courseId}
        AND deleted_at IS NULL
      RETURNING id, title
    `
    return { success: true, data: result[0] }
  } catch (error: any) {
    console.error("Service Error - rejectCourse:", error)
    return { success: false, error: "Database error: " + error.message }
  }
}

// 👇 HÀM MỚI: Chỉ lấy khóa học đã Published (Dành cho trang /courses)
export async function getPublishedCoursesService({
  query = "",
  page = 1,
  limit = 12,
  sort = "trending",
  category = "all",
}: GetAllCoursesParams) {
  const offset = (page - 1) * limit

  // Xử lý Sort
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
      orderBy = "created_at DESC"
      break
  }

  // ✅ Xử lý Filter Category
  const categoryCondition =
    category && category !== "all" && category !== ""
      ? sql`AND category_id = ${category}`
      : sql``

  // Query Courses - CHỈ LẤY PUBLISHED
  const rows = await sql`
    SELECT *
    FROM courses
    WHERE deleted_at IS NULL
      AND status = 'published'  -- 👈 QUAN TRỌNG NHẤT: Chỉ lấy published
      AND title ILIKE ${"%" + query + "%"}
      ${categoryCondition} 
    ORDER BY ${sql.unsafe(orderBy)}
    LIMIT ${limit}
    OFFSET ${offset}
  `

  // Count Total - CHỈ ĐẾM PUBLISHED
  const totalResult = await sql`
    SELECT COUNT(*) 
    FROM courses 
    WHERE deleted_at IS NULL
      AND status = 'published'  -- 👈 QUAN TRỌNG NHẤT: Chỉ đếm published
      AND title ILIKE ${"%" + query + "%"}
      ${categoryCondition}
  `

  const totalCount = parseInt(totalResult[0].count as string, 10)

  return {
    courses: rows as Course[],
    totalCount,
  }
}
