//Course Action
"use server"

import { requireAuth } from "@/lib/auth"
import {
  getAllCoursesAction,
  getCourseByIdAction,
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
} from "@/service/course.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
type UpdateAPIResponse = { success: true } | { success: false; error: string }

// --- FETCH ACTIONS ---

export async function getAllCourses(params: GetAllCoursesParams) {
  await requireAuth()
  return getAllCoursesAction(params)
}

/**
 * Lấy chi tiết một khóa học theo ID.
 * - Tham số: id (number)
 * - Trả về Course | null
 * - Yêu cầu xác thực (requireAuth)
 */
export async function getCourseById(id: number) {
  await requireAuth()
  return getCourseByIdAction(id)
}

/**
 * Tạo mới một khóa học từ FormData gửi lên.
 * - FormData expected fields: creator_id, title, slug, description, thumbnail_url, status, duration_hours
 * - Kiểm tra các trường bắt buộc và chuyển đổi kiểu
 * - Sau khi tạo xong sẽ revalidate /courses và redirect về /courses
 +* - Yêu cầu xác thực (requireAuth)
 */
export async function createCourse(formData: FormData) {
  await requireAuth()

  const creator_id = Number(formData.get("creator_id"))
  const title = (formData.get("title") as string) || ""
  const slug = (formData.get("slug") as string) || ""
  const description = (formData.get("description") as string) || undefined
  const thumbnail_url = (formData.get("thumbnail_url") as string) || undefined
  const status = (formData.get("status") as string) || "draft"
  let duration_hours: number | undefined = Number(
    formData.get("duration_hours")
  )
  if (isNaN(duration_hours)) duration_hours = undefined

  if (!creator_id || !title || !slug) {
    throw new Error("Missing required fields: creator_id, title, slug")
  }

  await createCourseAction({
    creator_id,
    title,
    slug,
    description,
    thumbnail_url,
    status,
    duration_hours,
  })

  revalidatePath("/courses")
  redirect("/courses")
}

/**
 * Cập nhật một khóa học từ FormData gửi lên.
 * - FormData expected fields: id, title, slug, description, thumbnail_url, status, duration_hours
 * - Nếu duration_hours không hợp lệ (NaN) sẽ bỏ qua
 * - Sau khi cập nhật sẽ revalidate các path liên quan và redirect về /courses
 * - Yêu cầu xác thực (requireAuth)
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
// export async function updateCourseAPI(
//   courseId: number,
//   data: Partial<CreateCoursePayload>
// ): Promise<APIResponse> {
//   try {
//     await requireAuth()
//     console.log("🔥 [API] Updating course:", courseId)

//     const result = await updateCourseAction(courseId, data)
//     if (result.success) {
export async function updateCourseAPI(
  courseId: number,
  data: Partial<CreateCoursePayload>
): Promise<UpdateAPIResponse> {
  try {
    await requireAuth()
    console.log("🔥 [API] Thực hiện cập nhật toàn diện Course:", courseId)

    // GỌI HÀM UPDATE TOÀN DIỆN (Bao gồm cả curriculum)
    const result = await updateFullCourseAction(courseId, data as any)

    if (result.success) {
      // Làm mới cache để hiển thị dữ liệu mới
      revalidatePath(`/courses/${courseId}`)
      revalidatePath("/courses/manage")
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
