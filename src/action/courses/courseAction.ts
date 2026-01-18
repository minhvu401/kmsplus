// src/action/courses/courseAction.ts
// This file contains server actions for course management

"use server"

import { requireAuth } from "@/lib/auth"
import { CourseStatus } from "@/enum/course-status.enum"
import {
  getAllCoursesAction,
  getCourseByIdAction,
  createCourseAction,
  updateFullCourseAction,
  deleteCourseAction,
  approveCourseAction,
  // 👇 Import Type để code an toàn hơn
  type CreateCoursePayload,
} from "@/service/course.service"
import { revalidatePath } from "next/cache"

// --- TYPES ---
type GetAllCoursesParams = {
  query?: string
  page?: number
  limit?: number
}

// Định nghĩa kiểu trả về chuẩn cho API
type APIResponse =
  | { success: true; courseId: number }
  | { success: false; error: string }

// Response type cho update operations (không cần courseId)
type UpdateAPIResponse =
  | { success: true }
  | { success: false; error: string }

// --- FETCH ACTIONS ---

export async function getAllCourses(params: GetAllCoursesParams) {
  await requireAuth()
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
// export async function deleteCourseAPI(courseId: number) {
//   try {
//     const user = await requireAuth()
//     if (!user) throw new Error("Unauthorized")

//     console.log("Deleting course (Soft Delete):", courseId)
//     return await deleteCourseAction(courseId)
//   } catch (error) {
//     console.error("Delete error:", error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Failed to delete course",
//     }
//   }
// }
export async function deleteCourseAPI(courseId: number) {
  try {
    const user = await requireAuth()
    if (!user) throw new Error("Unauthorized")
    console.log("🔥 [API] Deleting course (Soft Delete):", courseId)
    // 1. Gọi Service (Service của bạn đang trả về { success: true/false, ... })
    const result = await deleteCourseAction(courseId)
    // 2. Kiểm tra: Nếu Service báo thành công thì mới Revalidate
    // (Lưu ý: Service của bạn dùng try/catch nên nó không throw error ra ngoài mà trả về object)
    if (result.success) {
      // 👇 DÒNG QUAN TRỌNG BỊ THIẾU
      revalidatePath("/courses/manage")
      revalidatePath("/courses")
      return { success: true }
    } else {
      // Nếu Service báo lỗi (success: false)
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
 * Sử dụng Omit để không yêu cầu creator_id từ Client
 */
export async function createCourseAPI(
  data: Omit<CreateCoursePayload, "creator_id">
): Promise<APIResponse> {
  try {
    const user = await requireAuth()
    if (!user?.id) throw new Error("Unauthorized")
    console.log("🔥 [API] Creating course:", data.title)
    // Map dữ liệu
    const courseData: CreateCoursePayload = {
      ...data,
      creator_id: parseInt(user.id),
      status: data.status || "draft",
      duration_hours: data.duration_hours || 0,
    }
    const result = await createCourseAction(courseData)
    if (result.success && "courseId" in result) {
      revalidatePath("/courses")
      return { success: true, courseId: result.courseId }
    }
    if (!result.success && "error" in result) {
      return { success: false, error: result.error || "Failed to create course" }
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
// export async function updateCourseAPI(
//   courseId: number,
//   data: Partial<CreateCoursePayload>
// ): Promise<APIResponse> {
//   try {
//     await requireAuth()
//     console.log("🔥 [API] Updating course:", courseId)

//     const result = await updateCourseAction(courseId, data)
//     if (result.success) {
//       revalidatePath(`/courses/${courseId}`)
//       revalidatePath("/courses")
//       return { success: true }
//     }
//     return { success: false, error: result.error || "Update failed" }
//   } catch (error) {
//     return { success: false, error: "Update failed" }
//   }
// }
export async function updateCourseAPI(
  courseId: number,
  data: Partial<CreateCoursePayload>
): Promise<UpdateAPIResponse> {
  try {
    const user = await requireAuth()
    if (!user?.id) throw new Error("Unauthorized")

    console.log("🔥 [API] Thực hiện cập nhật toàn diện Course:", courseId)

    // GỌI HÀM UPDATE TOÀN DIỆN (Bao gồm cả curriculum)
    const result = await updateFullCourseAction(courseId, data as any)

    if (result.success) {
      // Làm mới cache để hiển thị dữ liệu mới
      revalidatePath(`/courses/${courseId}`)
      revalidatePath("/courses/manage")
      return { success: true }
    }

    return { success: false, error: "error" in result ? result.error : "Update failed" }
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
      // Refresh cache của trang quản lý để cập nhật trạng thái bảng (từ Pending -> Published)
      revalidatePath("/courses/manage")

      // ✅ THÊM DÒNG NÀY: Refresh trang danh sách khóa học (Public) để user thường nhìn thấy khóa vừa duyệt
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
