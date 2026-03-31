// src/action/courses/courseAction.ts
// This file contains server actions for course management

"use server"

import { requireAuth } from "@/lib/auth"
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
  await requireAuth()
  return getCourseByIdAction(id)
}

// --- MUTATION ACTIONS ---

/**
 * Xóa mềm (Soft Delete)
 */
export async function deleteCourseAPI(courseId: number) {
  try {
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
    // 1. Bảo mật: Chỉ Admin/Manager mới được reject (Tùy logic dự án của bạn)
    await requireAuth()
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
