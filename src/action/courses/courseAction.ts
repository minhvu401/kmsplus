// src/action/courses/courseAction.ts
// This file contains server actions for course management

"use server"

import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { CourseStatus } from "@/enum/course-status.enum"
import {
  getAllCategoriesAction, // ✅ Import hàm từ service
  getAllCoursesAction,
  getCourseByIdAction,
  createCourseAction,
  updateFullCourseAction,
  deleteCourseAction,
  approveCourseAction,
  rejectCourseService,
  type CreateCoursePayload,
} from "@/service/course.service"
import { revalidatePath } from "next/cache"
import { sql } from "@/lib/database"

// --- TYPES ---
type GetAllCoursesParams = {
  query?: string
  page?: number
  limit?: number
  sort?: "trending" | "popular" | "newest"
  categories?: string[] // ✅ Changed to array for multi-select
  status?: string // ✅ ĐỘC LẬP THÊM: Filter by course status
}

// Định nghĩa kiểu trả về chuẩn cho API
type APIResponse =
  | { success: true; courseId: number }
  | { success: false; error: string }

// Response type cho update operations
type UpdateAPIResponse = { success: true } | { success: false; error: string }

// ============================================================================
// HÀM HỖ TRỢ: KIỂM TRA QUYỀN LỰA CHỌN DANH MỤC
// ============================================================================
async function validateCategoryPermission(
  userId: number,
  categoryId: number | null | undefined
) {
  if (!categoryId) return true // Bỏ qua nếu khóa học không chọn danh mục

  const check = await sql`
    SELECT 
      u.department_id as user_dept,
      (SELECT id FROM department WHERE head_of_department_id = ${userId} AND is_deleted = false LIMIT 1) as managed_dept,
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId} AND r.name ILIKE '%admin%'
      ) as is_admin,
      (SELECT department_id FROM categories WHERE id = ${categoryId}) as target_cat_dept
    FROM users u
    WHERE u.id = ${userId}
  `

  if (check.length === 0) return false

  const { is_admin, user_dept, managed_dept, target_cat_dept } = check[0]

  // 1. Admin được quyền chọn mọi Category
  if (is_admin) return true

  // 2. Thuộc cùng phòng ban của User (Training Manager / Contributor / Others)
  if (target_cat_dept === user_dept) return true

  // 3. Thuộc phòng ban mà User làm Head of Department
  if (managed_dept && target_cat_dept === managed_dept) return true

  return false // Chặn nếu khác phòng ban
}

// --- CATEGORY ACTIONS (New) ---

/**
 * Lấy danh sách Category cho Dropdown (Đã áp dụng Phân quyền)
 */
export async function getCategoriesAPI() {
  try {
    await requirePermission(Permission.VIEW_COURSE_LIST)
    const user = await requireAuth()
    if (!user?.id) return []

    const userId = parseInt(user.id)

    // Lấy thông tin phòng ban & quyền Admin của user
    const check = await sql`
      SELECT 
        u.department_id as user_dept,
        (SELECT id FROM department WHERE head_of_department_id = ${userId} AND is_deleted = false LIMIT 1) as managed_dept,
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${userId} AND r.name ILIKE '%admin%'
        ) as is_admin
      FROM users u
      WHERE u.id = ${userId}
    `

    if (check.length === 0) return []
    const { is_admin, user_dept, managed_dept } = check[0]

    // NẾU LÀ ADMIN: Trả về tất cả Category
    if (is_admin) {
      const allCategories = await sql`
        SELECT id, name FROM categories 
        WHERE is_deleted = false ORDER BY name ASC
      `
      return allCategories.map((c: any) => ({ id: Number(c.id), name: c.name }))
    }

    // NẾU LÀ USER BÌNH THƯỜNG / HOD / MANAGER: Chỉ trả về Category của phòng ban họ
    const departmentCategories = await sql`
      SELECT id, name FROM categories 
      WHERE is_deleted = false 
        AND (department_id = ${user_dept} OR department_id = ${managed_dept})
      ORDER BY name ASC
    `
    return departmentCategories.map((c: any) => ({
      id: Number(c.id),
      name: c.name,
    }))
  } catch (error) {
    console.error("Failed to get categories:", error)
    return []
  }
}

// --- FETCH ACTIONS ---

export async function getAllCourses(params: GetAllCoursesParams) {
  await requirePermission(Permission.VIEW_COURSE_LIST)
  const user = await requireAuth() // Lấy thông tin user hiện tại
  console.log(`🔍 [ACTION DEBUG] User from requireAuth:`, user)
  console.log(
    `🔍 [ACTION DEBUG] Passing to service: userId=${user?.id ? parseInt(user.id) : undefined}, userRole=${user?.role || undefined}`
  )

  return getAllCoursesAction({
    ...params,
    userId: user?.id ? parseInt(user.id) : undefined,
    userRole: user?.role || undefined,
  })
}

export async function getCourseById(id: number) {
  await requirePermission(Permission.READ_COURSE)
  return getCourseByIdAction(id)
}

type CourseManagementAccessResult = {
  allowed: boolean
  redirectTo?: "/courses/management" | "/courses"
  flash?:
    | "course-not-found"
    | "course-access-denied"
    | "management-access-denied"
}

/**
 * Check whether current user can access a specific course under management routes.
 */
export async function getCourseManagementAccess(
  courseId: number
): Promise<CourseManagementAccessResult> {
  const user = await requireAuth()
  const userId = Number(user.id)

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return {
      allowed: false,
      redirectTo: "/courses/management",
      flash: "course-not-found",
    }
  }

  const courseRows = await sql`
    SELECT
      c.id,
      c.creator_id,
      creator.department_id AS creator_department_id
    FROM courses c
    LEFT JOIN users creator ON creator.id = c.creator_id
    WHERE c.id = ${courseId} AND c.deleted_at IS NULL
    LIMIT 1
  `

  if (courseRows.length === 0) {
    return {
      allowed: false,
      redirectTo: "/courses/management",
      flash: "course-not-found",
    }
  }

  const course = courseRows[0] as {
    creator_id: number
    creator_department_id: number | null
  }

  const roleCheckRows = await sql`
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
          AND r.name ILIKE '%director%'
      ) AS is_director,
      EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId}
          AND r.name ILIKE '%training manager%'
      ) AS is_training_manager,
      EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId}
          AND r.name ILIKE '%contributor%'
      ) AS is_contributor,
      EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId}
          AND r.name ILIKE '%employee%'
      ) AS is_employee,
      (
        SELECT d.id
        FROM department d
        WHERE d.head_of_department_id = ${userId}
          AND d.is_deleted = FALSE
        LIMIT 1
      ) AS managed_department_id
  `

  const roleCheck = roleCheckRows[0] as {
    is_admin: boolean
    is_director: boolean
    is_training_manager: boolean
    is_contributor: boolean
    is_employee: boolean
    managed_department_id: number | null
  }

  if (roleCheck.is_admin || roleCheck.is_director) {
    return { allowed: true }
  }

  if (roleCheck.is_contributor || roleCheck.is_employee) {
    return {
      allowed: false,
      redirectTo: "/courses",
      flash: "management-access-denied",
    }
  }

  const managedDepartmentId =
    roleCheck.managed_department_id !== null
      ? Number(roleCheck.managed_department_id)
      : null

  if (roleCheck.is_training_manager) {
    // Training Manager (Head of Department): can manage only courses in managed department.
    if (managedDepartmentId !== null) {
      const courseDepartmentId =
        course.creator_department_id !== null
          ? Number(course.creator_department_id)
          : null

      if (courseDepartmentId === managedDepartmentId) {
        return { allowed: true }
      }

      return {
        allowed: false,
        redirectTo: "/courses/management",
        flash: "course-access-denied",
      }
    }

    // Training Manager (regular): can manage only own courses.
    if (Number(course.creator_id) === userId) {
      return { allowed: true }
    }

    return {
      allowed: false,
      redirectTo: "/courses/management",
      flash: "course-access-denied",
    }
  }

  return {
    allowed: false,
    redirectTo: "/courses",
    flash: "management-access-denied",
  }
}

// --- MUTATION ACTIONS ---

/**
 * Xóa mềm (Soft Delete)
 */
export async function deleteCourseAPI(courseId: number) {
  try {
    await requirePermission(Permission.DELETE_COURSE)
    const user = await requireAuth()
    if (!user) throw new Error("Unauthorized")

    const result = await deleteCourseAction(courseId)

    if (result.success) {
      revalidatePath("/courses/management")
      revalidatePath("/courses")
      return { success: true }
    } else {
      return { success: false, error: result.error || "Failed to delete" }
    }
  } catch (error) {
    console.error("Delete error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete course",
    }
  }
}

/**
 * Tạo khóa học mới (JSON Payload)
 */
export async function createCourseAPI(
  data: Omit<CreateCoursePayload, "creator_id">
): Promise<APIResponse> {
  try {
    await requirePermission(Permission.CREATE_COURSE)
    const user = await requireAuth()
    if (!user?.id) throw new Error("Unauthorized")

    // ✅ THÊM ĐOẠN NÀY: VALIDATE BẢO MẬT QUYỀN CHỌN CATEGORY
    const isCategoryValid = await validateCategoryPermission(
      parseInt(user.id),
      data.category_id
    )
    if (!isCategoryValid) {
      return {
        success: false,
        error:
          "Bạn chỉ được phép đăng khóa học vào Danh mục thuộc phòng ban của mình!",
      }
    }
    // ========================================================

    console.log("🔥 [API] Creating course:", data.title)

    const courseData: CreateCoursePayload = {
      ...data,
      creator_id: parseInt(user.id),
      status: data.status || "draft",
      duration_hours: data.duration_hours || 0,
      // category_id sẽ được tự động lấy từ data nếu client gửi lên
    }

    const result = await createCourseAction(courseData)

    if (result.success && "courseId" in result) {
      revalidatePath("/courses")
      revalidatePath("/courses/management")
      return { success: true, courseId: result.courseId }
    }

    if (!result.success && "error" in result) {
      return {
        success: false,
        error: result.error || "Failed to create course",
      }
    }
    return { success: false, error: "Failed to create course" }
  } catch (error) {
    console.error("Create API Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Cập nhật khóa học
 */
export async function updateCourseAPI(
  courseId: number,
  data: Partial<CreateCoursePayload>
): Promise<UpdateAPIResponse> {
  try {
    await requirePermission(Permission.UPDATE_COURSE)
    const user = await requireAuth()
    if (!user?.id) throw new Error("Unauthorized")

    // ✅ THÊM ĐOẠN NÀY: VALIDATE BẢO MẬT QUYỀN CHỌN CATEGORY KHI UPDATE
    if (data.category_id !== undefined) {
      const isCategoryValid = await validateCategoryPermission(
        parseInt(user.id),
        data.category_id
      )
      if (!isCategoryValid) {
        return {
          success: false,
          error:
            "Bạn chỉ được phép chuyển khóa học sang Danh mục thuộc phòng ban của mình!",
        }
      }
    }
    // ========================================================

    console.log("🔥 [API] Updating course:", courseId)

    const result = await updateFullCourseAction(courseId, data as any)

    if (result.success) {
      revalidatePath(`/courses/${courseId}`)
      revalidatePath("/courses/management")
      revalidatePath("/courses") // Refresh trang danh sách để thấy category mới
      return { success: true }
    }

    return {
      success: false,
      error: "error" in result ? result.error : "Update failed",
    }
  } catch (error) {
    console.error("API Update Error:", error)
    return { success: false, error: "Hệ thống gặp lỗi khi lưu dữ liệu" }
  }
}

export async function approveCourse(id: number) {
  try {
    await requirePermission(Permission.APPROVE_COURSE)
    const user = await requireAuth()
    if (!user?.id) throw new Error("Unauthorized")

    const adminId = Number(user.id)
    if (isNaN(adminId)) {
      throw new Error("Invalid User ID format")
    }

    const result = await approveCourseAction(id, adminId)

    if (result) {
      revalidatePath("/courses/management")
      revalidatePath("/courses")
      return { success: true }
    }

    return {
      success: false,
      error: "Failed to approve: Course not found or already processed",
    }
  } catch (error) {
    console.error("Approve error:", error)
    return { success: false, error: "System error during approval" }
  }
}

export async function rejectCourseAction(courseId: number, reason: string) {
  try {
    await requirePermission(Permission.APPROVE_COURSE)
    const user = await requireAuth()
    if (!user) return { success: false, error: "Unauthorized" }

    // 2. Validate dữ liệu
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Vui lòng nhập lý do từ chối." }
    }

    // 3. Gọi Service
    const result = await rejectCourseService(courseId, reason)

    // 4. Revalidate để UI cập nhật ngay
    if (result.success) {
      revalidatePath("/courses/management")
      revalidatePath("/courses")
    }

    return result
  } catch (error) {
    console.error("Reject action error:", error)
    return { success: false, error: "System error during rejection" }
  }
}
