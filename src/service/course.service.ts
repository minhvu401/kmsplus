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
  creator_name?: string | null
  creator_avatar_url?: string | null
  category_id: number | null // ✅ Added category_id
  category_name?: string | null // ✅ Added category_name from JOIN
  title: string
  description: string | null
  thumbnail_url: string | null
  status: CourseStatus
  average_rating: number | null
  rating_count?: number // ✅ Number of ratings/feedback count
  duration_hours: number | null
  enrollment_count: number
  approved_by: number | null
  approved_at: Date | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
  visibility: "public" | "private"
  global_due_type: "relative" | "fixed" | null
  global_due_days: number | null
  global_due_date: Date | null
}

// Định nghĩa Type cho Assignment Rule nhận từ Form
export type AssignmentRulePayload = {
  target_type: "all_employees" | "department" | "user" | "role"
  department_id?: number | null
  user_id?: number | null
  role_id?: number | null
  due_type?: "relative" | "fixed" | "none"
  due_days?: number | null
  due_date?: string | Date | null // Dạng chuỗi (YYYY-MM-DD) hoặc Date Object
}
// Type cho dữ liệu tạo mới (bao gồm cả Curriculum lồng nhau)
export type CreateCoursePayload = {
  creator_id: number
  category_id?: number | null
  title: string
  description?: string | null
  thumbnail_url?: string | null
  status?: CourseStatus | string
  duration_hours?: number
  visibility?: "public" | "private"
  assignment_rules?: AssignmentRulePayload[] // Danh sách các Rule
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
  sort?: "trending" | "popular" | "newest" | "top-rated"
  categories?: string[] // ✅ Changed to array for multi-select
  rating?: string // ✅ Added rating filter (all, 4plus, 3plus, 2plus)
  userId?: number // ✅ Added userId for role-based filtering
  userRole?: string // ✅ Added userRole for permission checking
  creatorId?: number // ✅ Added creator filter
  status?: string // ✅ đLC THÊM: Filter by course status (draft, pending_approval, published, rejected)
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
  categories = [],
  rating = "all",
  userId,
  userRole,
  status = "All", // ✅ ĐLCS THÊM: Nhận tham số status
}: GetAllCoursesParams) {
  const offset = (page - 1) * limit

  let isAdmin = false
  let isHeadOfDepartment = false
  let managedDepartmentId: number | null = null

  if (userId && userId !== 0) {
    const roleCheckResult = await sql`
      SELECT
        EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${userId}
            AND r.name ILIKE '%admin%'
        ) AS is_admin,
        EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${userId}
            AND (
              r.name ILIKE '%head of department%'
              OR r.name ILIKE '%director%'
            )
        ) AS is_hod_role,
        (
          SELECT d.id
          FROM department d
          WHERE d.head_of_department_id = ${userId}
            AND d.is_deleted = FALSE
          LIMIT 1
        ) AS managed_department_id,
        (
          SELECT u.department_id
          FROM users u
          WHERE u.id = ${userId}
          LIMIT 1
        ) AS user_department_id
    `

    isAdmin = Boolean(roleCheckResult?.[0]?.is_admin)

    const departmentManagedByUser =
      roleCheckResult?.[0]?.managed_department_id !== null
        ? Number(roleCheckResult?.[0]?.managed_department_id)
        : null
    const userDepartmentId =
      roleCheckResult?.[0]?.user_department_id !== null
        ? Number(roleCheckResult?.[0]?.user_department_id)
        : null

    const hasHodRole = Boolean(roleCheckResult?.[0]?.is_hod_role)
    isHeadOfDepartment = hasHodRole || departmentManagedByUser !== null

    // Prefer department explicitly managed by this user, fallback to user's own department.
    managedDepartmentId = departmentManagedByUser ?? userDepartmentId
  }

  // Xử lý Sort
  let orderBy = ""
  switch (sort) {
    case "popular":
      orderBy = "enrollment_count DESC, created_at DESC"
      break
    case "newest":
      orderBy = "created_at DESC, enrollment_count DESC"
      break
    case "top-rated":
      // TODO: Add rating column to courses table when available
      // For now, order by enrollment_count as proxy for quality
      orderBy = "enrollment_count DESC, created_at DESC"
      break
    case "trending":
    default:
      orderBy = "created_at DESC"
      break
  }

  // ✅ Xử lý Filter Category (Multiple Categories)
  const categoryCondition =
    categories && categories.length > 0
      ? sql`AND category_id = ANY(${categories.map((c) => parseInt(c, 10))})`
      : sql``

  // ✅ ĐLCS THÊM: Xử lý Filter Status
  const statusCondition =
    status && status !== "All" ? sql`AND c.status = ${status}` : sql``

  //
  console.log(` [DEBUG] Đang check quyền cho User ID: ${userId}`)

  //
  // (An toàn tuyệt đối, không sợ JWT bị thiếu Role)
  const permissionCondition =
    userId && userId !== 0
      ? isAdmin
        ? sql``
        : isHeadOfDepartment
          ? sql`
      AND (
        c.creator_id = ${userId}
        ${
          managedDepartmentId !== null
            ? sql`
        OR c.creator_id IN (
          SELECT u2.id
          FROM users u2
          WHERE u2.department_id = ${managedDepartmentId}
        )
        `
            : sql``
        }
      )
    `
          : sql`AND c.creator_id = ${userId}`
      : sql``

  const hodNonDraftCondition =
    isHeadOfDepartment && !isAdmin ? sql`AND c.status <> 'draft'` : sql``

  // Query Courses with Category Join
  const rows = await sql`
    SELECT 
      c.*,
      cat.name as category_name,
      u.full_name as creator_name,
      u.avatar_url as creator_avatar_url
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.creator_id = u.id
    WHERE c.deleted_at IS NULL
      AND c.title ILIKE ${"%" + query + "%"}
      ${hodNonDraftCondition}
      ${categoryCondition}
      ${statusCondition}
      ${permissionCondition}
    ORDER BY ${sql.unsafe(orderBy)}
    LIMIT ${limit}
    OFFSET ${offset}
  `

  // Count Total
  const totalResult = await sql`
    SELECT COUNT(*) 
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.deleted_at IS NULL
      AND c.title ILIKE ${"%" + query + "%"}
      ${hodNonDraftCondition}
      ${categoryCondition}
      ${statusCondition}
      ${permissionCondition}
  `

  // ✅ DEBUG: Query để xem tổng số courses trong DB (bỏ qua filter)
  const allCoursesResult = await sql`
    SELECT COUNT(*) as total_all_courses
    FROM courses c
    WHERE c.deleted_at IS NULL
  `

  console.log(
    ` [DEBUG] Total courses in DB: ${allCoursesResult[0].total_all_courses}`
  )
  console.log(` [DEBUG] Filtered courses count: ${totalResult[0].count}`)

  const totalCount = parseInt(totalResult[0].count as string, 10)

  return {
    courses: rows as Course[],
    totalCount,
    isHeadOfDepartmentView: isHeadOfDepartment,
    currentUserId: userId || null,
  }
}

export async function getCourseByIdAction(id: number) {
  // 1. Lấy thông tin cơ bản của Course (có category)
  const courseResult = await sql`
    SELECT 
      c.*,
      cat.name as category_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.id = ${id} AND c.deleted_at IS NULL
  `
  if (courseResult.length === 0) return null
  const course = courseResult[0] as Course

  // 2. Lấy danh sách Assignment Rules (CẬP NHẬT MỚI)
  const rulesResult = await sql`
    SELECT 
      id, target_type, department_id, user_id, 
      due_type, due_days, due_date
    FROM assignment_rules 
    WHERE course_id = ${id}
  `

  // 3. Lấy danh sách Sections
  const sectionsResult = await sql`
    SELECT * FROM sections 
    WHERE course_id = ${id} 
    ORDER BY "order" ASC
  `

  // 4. Lấy danh sách Items
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
        l.type as lesson_type,
        l.video_url,
        l.file_path,
        l.content as lesson_content,
        q.title as quiz_title,
        0 as quiz_question_count
      FROM curriculum_items ci
      LEFT JOIN lessons l ON ci.lesson_id = l.id
      LEFT JOIN quizzes q ON ci.quiz_id = q.id
      WHERE ci.section_id = ANY(${sectionIds})
      ORDER BY ci."order" ASC
    `
  }

  // 5. Ghép dữ liệu Curriculum (Mapping)
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
        // ✅ ĐLCS THÊM: Preserve lesson details for editing
        lesson_type: item.lesson_type,
        video_url: item.video_url,
        file_path: item.file_path,
        lesson_content: item.lesson_content,
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
    assignment_rules: rulesResult, // ✅ Ném mảng Rules vào kết quả trả về
    curriculum: curriculum,
  }
}

// --- COURSE MUTATION ACTIONS ---

export async function createCourseAction(courseData: CreateCoursePayload) {
  try {
    const result = await sqlTransaction.begin(async (tx: any) => {
      const currentTimestamp = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
      })

      // 1. Insert Course (Đã bổ sung 4 cột mới)
      const newCourseResult = await tx`
        INSERT INTO courses (
          creator_id, title, description, thumbnail_url, status, duration_hours, 
          category_id, created_at, updated_at, visibility
        ) VALUES (
          ${courseData.creator_id},
          ${courseData.title},
          ${courseData.description || null},
          ${courseData.thumbnail_url || null},
          ${courseData.status || "draft"},
          ${courseData.duration_hours || 0},
          ${courseData.category_id || null},
          ${currentTimestamp}, 
          ${currentTimestamp},
          ${courseData.visibility || "private"}
        )
        RETURNING *;
      `
      const courseId = newCourseResult[0].id

      // 2. Insert Assignment Rules (NẾU CÓ)
      if (
        courseData.assignment_rules &&
        courseData.assignment_rules.length > 0
      ) {
        for (const rule of courseData.assignment_rules) {
          await tx`
            INSERT INTO assignment_rules (
              course_id, target_type, department_id, user_id, role_id, 
              due_type, due_days, due_date
            ) VALUES (
              ${courseId}, 
              ${rule.target_type}, 
              ${rule.department_id || null}, 
              ${rule.user_id || null}, 
              ${rule.role_id || null},
              ${rule.due_type || null}, 
              ${rule.due_days || null}, 
              ${rule.due_date || null}
            )
          `
        }
      }

      // 3. Insert Sections & Items (Curriculum)
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

    return await sqlTransaction.begin(async (tx: any) => {
      // 1. KIỂM TRA TRẠNG THÁI HIỆN TẠI CỦA KHÓA HỌC
      const [existingCourse] =
        await tx`SELECT status FROM courses WHERE id = ${id}`
      const isPublished = existingCourse?.status === "published"

      if (isPublished) {
        // 🔥 KỊCH BẢN A: KHÓA HỌC ĐÃ XUẤT BẢN -> CHỈ CẬP NHẬT VISIBILITY & RULES

        await tx`
          UPDATE courses
          SET 
            visibility = ${data.visibility || "private"},
            updated_at = ${currentTimestamp}
          WHERE id = ${id}
        `

        // Cập nhật Assignment Rules (Xóa cũ, Thêm mới)
        await tx`DELETE FROM assignment_rules WHERE course_id = ${id}`
        if (data.assignment_rules && data.assignment_rules.length > 0) {
          for (const rule of data.assignment_rules) {
            await tx`
              INSERT INTO assignment_rules (course_id, target_type, department_id, user_id, role_id, due_type, due_days, due_date) 
              VALUES (${id}, ${rule.target_type}, ${rule.department_id || null}, ${rule.user_id || null}, ${rule.role_id || null}, ${rule.due_type || null}, ${rule.due_days || null}, ${rule.due_date || null})
            `
          }
        }
        return {
          success: true,
          message: "Đã cập nhật quy tắc ghi danh thành công",
        }
      } else {
        // 🟢 KỊCH BẢN B: KHÓA HỌC ĐANG LÀ NHÁP (DRAFT/PENDING) -> UPDATE TOÀN BỘ NHƯ CŨ

        await tx`
          UPDATE courses
          SET
            title = ${data.title},
            description = ${data.description || null},
            thumbnail_url = ${data.thumbnail_url || null},
            status = ${data.status || "draft"},
            duration_hours = ${data.duration_hours || 0},
            category_id = ${data.category_id || null},
            visibility = ${data.visibility || "private"},
            updated_at = ${currentTimestamp}
          WHERE id = ${id}
        `

        await tx`DELETE FROM assignment_rules WHERE course_id = ${id}`
        if (data.assignment_rules && data.assignment_rules.length > 0) {
          for (const rule of data.assignment_rules) {
            await tx`
              INSERT INTO assignment_rules (course_id, target_type, department_id, user_id, role_id, due_type, due_days, due_date) 
              VALUES (${id}, ${rule.target_type}, ${rule.department_id || null}, ${rule.user_id || null}, ${rule.role_id || null}, ${rule.due_type || null}, ${rule.due_days || null}, ${rule.due_date || null})
            `
          }
        }

        // Xóa sạch Curriculum cũ & Insert mới
        await tx`DELETE FROM curriculum_items WHERE section_id IN (SELECT id FROM sections WHERE course_id = ${id})`
        await tx`DELETE FROM sections WHERE course_id = ${id}`

        if (data.curriculum && data.curriculum.length > 0) {
          for (const [sIndex, section] of data.curriculum.entries()) {
            const [newSection] =
              await tx`INSERT INTO sections (course_id, title, "order") VALUES (${id}, ${section.title}, ${sIndex}) RETURNING id`
            if (section.items && section.items.length > 0) {
              for (const [iIndex, item] of section.items.entries()) {
                const lessonId =
                  item.type === "lesson" ? item.resource_id : null
                const quizId = item.type === "quiz" ? item.resource_id : null
                await tx`INSERT INTO curriculum_items (section_id, type, "order", lesson_id, quiz_id) VALUES (${newSection.id}, ${item.type}, ${iIndex}, ${lessonId}, ${quizId})`
              }
            }
          }
        }
        return { success: true }
      }
    })
  } catch (error) {
    console.error("❌ [Service Error - Update Course]:", error)
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
        updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
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

export async function getPublishedCoursesService({
  query = "",
  page = 1,
  limit = 12,
  sort = "trending",
  categories = [],
  rating = "all",
  userId = 0,
}: GetAllCoursesParams & { userId?: number }) {
  try {
    const offset = (page - 1) * limit
    let orderBy = "c.created_at DESC"

    switch (sort) {
      case "popular":
        orderBy = "c.enrollment_count DESC, c.created_at DESC"
        break
      case "newest":
        orderBy = "c.created_at DESC, c.enrollment_count DESC"
        break
      case "trending":
      default:
        orderBy = "c.created_at DESC"
        break
    }

    // ✅ Xử lý Filter Category (Multiple Categories)
    const categoryCondition =
      categories && categories.length > 0
        ? sql`AND category_id = ANY(${categories.map((c) => parseInt(c, 10))})`
        : sql``

    // ✅ LOGIC CỐT LÕI: Tách nhỏ ra để dễ debug
    const rows = await sql`
      SELECT 
        c.*,
        COALESCE(ROUND(AVG(f.rating))::smallint, 0) AS average_rating,
        COALESCE(COUNT(f.id), 0)::int AS rating_count
      FROM courses c
      LEFT JOIN feedback f ON f.course_id = c.id AND f.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND c.title ILIKE ${"%" + query + "%"}
        ${categoryCondition}
        AND (
          -- Điều kiện 1: Khóa học Public hoặc chưa set (NULL)
          c.visibility = 'public' 
          OR c.visibility IS NULL
          
          -- Điều kiện 2: Khóa học Private nhưng được Assign
          OR (
            c.visibility = 'private' AND ${userId} != 0 AND EXISTS (
              SELECT 1 FROM assignment_rules ar
              WHERE ar.course_id = c.id
              AND (
                ar.target_type = 'all_employees'
                OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${userId}))
                OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
                OR (ar.target_type = 'user' AND ar.user_id = ${userId})
              )
            )
          )
        )
      GROUP BY c.id
      ORDER BY ${sql.unsafe(orderBy)}
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalResult = await sql`
      SELECT COUNT(c.id) 
      FROM courses c
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND c.title ILIKE ${"%" + query + "%"}
        ${categoryCondition}
        AND (
          c.visibility = 'public' 
          OR c.visibility IS NULL
          OR (
            c.visibility = 'private' AND ${userId} != 0 AND EXISTS (
              SELECT 1 FROM assignment_rules ar
              WHERE ar.course_id = c.id
              AND (
                ar.target_type = 'all_employees'
                OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${userId}))
                OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
                OR (ar.target_type = 'user' AND ar.user_id = ${userId})
              )
            )
          )
        )
    `

    return {
      courses: rows as Course[],
      totalCount: parseInt(totalResult[0].count as string, 10),
    }
  } catch (error) {
    console.error("❌ [Catalog API] LỖI CÂU LỆNH SQL:", error)
    return { courses: [], totalCount: 0 }
  }
}

// =====SECTION SPECIFIC SERVICES=====

/**
 * Get user's enrolled courses that are in progress (not completed)
 * Used for "Tiếp tục học" (Continue) section
 */
export async function getUserEnrolledCoursesService(
  userId: number,
  limit: number = 4
) {
  try {
    if (!userId || userId === 0) {
      return { courses: [] }
    }

    const rows = await sql`
      SELECT 
        c.*,
        COALESCE(ROUND(AVG(f.rating))::smallint, 0) AS average_rating,
        COALESCE(COUNT(f.id), 0)::int AS rating_count
      FROM courses c
      LEFT JOIN feedback f ON f.course_id = c.id AND f.deleted_at IS NULL
      INNER JOIN enrollments e ON e.course_id = c.id
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND e.user_id = ${userId}
        AND e.status != 'completed'
        AND (
          c.visibility = 'public' 
          OR c.visibility IS NULL
          OR (
            c.visibility = 'private' AND EXISTS (
              SELECT 1 FROM assignment_rules ar
              WHERE ar.course_id = c.id
              AND (
                ar.target_type = 'all_employees'
                OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${userId}))
                OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
                OR (ar.target_type = 'user' AND ar.user_id = ${userId})
              )
            )
          )
        )
      GROUP BY c.id
      ORDER BY e.enrolled_at DESC, c.created_at DESC
      LIMIT ${limit}
    `

    return { courses: rows as Course[] }
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return { courses: [] }
  }
}

/**
 * Get newest published courses
 * Used for "Mới nhất từ KMS Plus" (Newest) section
 */
export async function getNewestCoursesService(
  userId: number = 0,
  limit: number = 12
) {
  try {
    const rows = await sql`
      SELECT 
        c.*,
        COALESCE(ROUND(AVG(f.rating))::smallint, 0) AS average_rating,
        COALESCE(COUNT(f.id), 0)::int AS rating_count
      FROM courses c
      LEFT JOIN feedback f ON f.course_id = c.id AND f.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND (
          c.visibility = 'public' 
          OR c.visibility IS NULL
          OR (
            c.visibility = 'private' AND ${userId} != 0 AND EXISTS (
              SELECT 1 FROM assignment_rules ar
              WHERE ar.course_id = c.id
              AND (
                ar.target_type = 'all_employees'
                OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${userId}))
                OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
                OR (ar.target_type = 'user' AND ar.user_id = ${userId})
              )
            )
          )
        )
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.enrollment_count DESC
      LIMIT ${limit}
    `

    return { courses: rows as Course[] }
  } catch (error) {
    console.error("Error fetching newest courses:", error)
    return { courses: [] }
  }
}

/**
 * Get trending courses based on recent enrollment activity
 * Used for "Xu hướng" (Trending) section
 */
export async function getTrendingCoursesService(
  userId: number = 0,
  limit: number = 12
) {
  try {
    const rows = await sql`
      SELECT 
        c.*,
        COALESCE(ROUND(AVG(f.rating))::smallint, 0) AS average_rating,
        COALESCE(COUNT(f.id), 0)::int AS rating_count
      FROM courses c
      LEFT JOIN feedback f ON f.course_id = c.id AND f.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND (
          c.visibility = 'public' 
          OR c.visibility IS NULL
          OR (
            c.visibility = 'private' AND ${userId} != 0 AND EXISTS (
              SELECT 1 FROM assignment_rules ar
              WHERE ar.course_id = c.id
              AND (
                ar.target_type = 'all_employees'
                OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${userId}))
                OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
                OR (ar.target_type = 'user' AND ar.user_id = ${userId})
              )
            )
          )
        )
      GROUP BY c.id
      ORDER BY c.enrollment_count DESC, c.created_at DESC
      LIMIT ${limit}
    `

    return { courses: rows as Course[] }
  } catch (error) {
    console.error("Error fetching trending courses:", error)
    return { courses: [] }
  }
}

/**
 * Get personalized courses for user based on department
 * Used for "Khóa học theo yên cầu" (Personalized/Relevant) section
 */
export async function getPersonalizedCoursesService(
  userId: number = 0,
  limit: number = 8
) {
  try {
    if (!userId || userId === 0) {
      return { courses: [] }
    }

    // Get user's department
    const userDept = await sql`
      SELECT department_id FROM users WHERE id = ${userId}
    `

    if (userDept.length === 0) {
      return { courses: [] }
    }

    const departmentId = userDept[0].department_id

    const rows = await sql`
      SELECT 
        c.*,
        COALESCE(ROUND(AVG(f.rating))::smallint, 0) AS average_rating,
        COALESCE(COUNT(f.id), 0)::int AS rating_count
      FROM courses c
      LEFT JOIN feedback f ON f.course_id = c.id AND f.deleted_at IS NULL
      LEFT JOIN assignment_rules ar ON ar.course_id = c.id
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND (
          c.visibility = 'public' 
          OR c.visibility IS NULL
          OR (
            c.visibility = 'private' 
            AND (
              ar.target_type = 'all_employees'
              OR (ar.target_type = 'department' AND ar.department_id = ${departmentId})
              OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
              OR (ar.target_type = 'user' AND ar.user_id = ${userId})
            )
          )
        )
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.enrollment_count DESC
      LIMIT ${limit}
    `

    return { courses: rows as Course[] }
  } catch (error) {
    console.error("Error fetching personalized courses:", error)
    return { courses: [] }
  }
}

/**
 * Get popular courses grouped by category
 * Used for "Phổ biến theo danh mục" (Popular by Category) section
 */
export async function getPopularCoursesByCategoryService(
  userId: number = 0,
  limit: number = 12,
  topPerCategory: number = 3
) {
  try {
    const rows = await sql`
      SELECT 
        c.*,
        COALESCE(ROUND(AVG(f.rating))::smallint, 0) AS average_rating,
        COALESCE(COUNT(f.id), 0)::int AS rating_count,
        ROW_NUMBER() OVER (PARTITION BY c.category_id ORDER BY c.enrollment_count DESC, c.created_at DESC) as category_rank
      FROM courses c
      LEFT JOIN feedback f ON f.course_id = c.id AND f.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
        AND c.status = 'published'
        AND category_id IS NOT NULL
        AND (
          c.visibility = 'public' 
          OR c.visibility IS NULL
          OR (
            c.visibility = 'private' AND ${userId} != 0 AND EXISTS (
              SELECT 1 FROM assignment_rules ar
              WHERE ar.course_id = c.id
              AND (
                ar.target_type = 'all_employees'
                OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${userId}))
                OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${userId}))
                OR (ar.target_type = 'user' AND ar.user_id = ${userId})
              )
            )
          )
        )
      GROUP BY c.id
    `

    // Filter to top courses per category
    const filtered = rows
      .filter((r) => Number(r.category_rank) <= topPerCategory)
      .slice(0, limit)

    return { courses: filtered as Course[] }
  } catch (error) {
    console.error("Error fetching popular courses by category:", error)
    return { courses: [] }
  }
}
