//Course Action
"use server"

import { requireAuth } from "@/lib/serverAuth"
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

/**
 * Lấy danh sách khóa học có phân trang và tìm kiếm.
 * - Params: { query, page, limit }
 * - Trả về object { courses, totalCount }
 * - Yêu cầu xác thực (requireAuth)
 */
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
export async function updateCourse(formData: FormData) {
  await requireAuth()

  const id = Number(formData.get("id"))
  if (!id) throw new Error("Course ID is required")

  const title = (formData.get("title") as string) || undefined
  const slug = (formData.get("slug") as string) || undefined
  const description = (formData.get("description") as string) || undefined
  const thumbnail_url = (formData.get("thumbnail_url") as string) || undefined
  const status = (formData.get("status") as string) || undefined
  let duration_hours: number | undefined = Number(
    formData.get("duration_hours")
  )
  if (isNaN(duration_hours)) duration_hours = undefined

  await updateCourseAction(id, {
    title,
    slug,
    description,
    thumbnail_url,
    status,
    duration_hours,
  })

  revalidatePath(`/courses/${id}`)
  revalidatePath("/courses")
  redirect("/courses")
}

/**
 * Xóa mềm (soft delete) khóa học.
 * - FormData expected: id
 * - Yêu cầu xác thực (requireAuth)
 */
export async function deleteCourse(formData: FormData) {
  await requireAuth()
  const id = Number(formData.get("id"))
  if (!id) throw new Error("Course ID is required")
  await deleteCourseAction(id)
  revalidatePath("/courses")
}
