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

// --- TYPES ---
type GetAllCoursesParams = {
  query?: string
  page?: number
  limit?: number
  sort?: "trending" | "popular" | "newest"
  category?: string // ✅ Added filter param
}

// Định nghĩa kiểu trả về chuẩn cho API
type APIResponse =
  | { success: true; courseId: number }
  | { success: false; error: string }

// Response type cho update operations
type UpdateAPIResponse = { success: true } | { success: false; error: string }

// --- CATEGORY ACTIONS (New) ---

/**
 * Lấy danh sách Category cho Dropdown
 */
export async function getCategoriesAPI() {
  try {
    // Nếu muốn bảo mật thì thêm await requireAuth() ở đây
    return await getAllCategoriesAction()
  } catch (error) {
    console.error("Failed to get categories:", error)
    return []
  }
}

// --- FETCH ACTIONS ---

export async function getAllCourses(params: GetAllCoursesParams) {
  await requireAuth() // Hoặc bỏ nếu trang này public
  return getAllCoursesAction(params)
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

    console.log("🔥 [API] Deleting course (Soft Delete):", courseId)

    const result = await deleteCourseAction(courseId)

    if (result.success) {
      revalidatePath("/courses/manage")
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
      revalidatePath("/courses/manage")
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
    await requireAuth()
    console.log("🔥 [API] Updating course:", courseId)

    const result = await updateFullCourseAction(courseId, data as any)

    if (result.success) {
      revalidatePath(`/courses/${courseId}`)
      revalidatePath("/courses/manage")
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
      revalidatePath("/courses/manage")
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
      revalidatePath("/courses/manage")
      revalidatePath("/courses")
    }

    return result
  } catch (error) {
    console.error("Reject action error:", error)
    return { success: false, error: "System error during rejection" }
  }
}
