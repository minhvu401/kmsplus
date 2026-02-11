// src/actions/lesson/lessonActions.ts
"use server"

import {
  createLessonAction,
  updateLessonAction,
  deleteLessonAction as deleteLessonService, // Đổi tên để tránh trùng
  checkLessonUsageService,
  softDeleteLessonService,
  hardDeleteLessonService,
  cloneLessonService,
} from "@/service/lesson.service"

// 1. Định nghĩa Type chuẩn cho Frontend
export type Lesson = {
  id: number
  title: string
  duration_minutes: number | null
  type?: "text_media" | "video" | "pdf"
  content?: string
}

/**
 * Hàm Helper: Map dữ liệu từ DB (nhiều cột) về format chung (1 cột content) cho Frontend
 */
const mapLessonResponse = (lesson: any): Lesson => {
  let contentVal = ""
  if (lesson.type === "video") contentVal = lesson.video_url || ""
  else if (lesson.type === "pdf") contentVal = lesson.file_path || ""
  else contentVal = lesson.content || ""

  return {
    id: lesson.id,
    title: lesson.title,
    duration_minutes: lesson.duration_minutes,
    type: (lesson.type as "text_media" | "video" | "pdf") || "text_media",
    content: contentVal,
  }
}

// ==============================================================================
//  CÁC HÀM CƠ BẢN (BASIC CRUD) - Dùng cho các trường hợp gọi đơn giản
// ==============================================================================

// ✅ UPDATE CƠ BẢN (Ghi đè trực tiếp)
export async function updateLessonAPI(
  id: number,
  data: { title: string; type: string; content: string }
) {
  console.log("🔥 [Server Action] Updating Lesson (Overwrite):", id)

  // 1. Map dữ liệu vào đúng cột DB
  const updatePayload: any = {
    title: data.title,
    type: data.type,
    content: null,
    video_url: null,
    file_path: null, // Reset các trường khác
  }

  if (data.type === "video") updatePayload.video_url = data.content
  else if (data.type === "pdf") updatePayload.file_path = data.content
  else updatePayload.content = data.content

  try {
    const updated = await updateLessonAction(id, updatePayload)
    return mapLessonResponse(updated)
  } catch (error) {
    console.error("Update API Error:", error)
    throw new Error("Could not update lesson")
  }
}

// ✅ DELETE CƠ BẢN (Xóa thẳng, không check)
export async function deleteLessonAPI(id: number) {
  console.log("🔥 [Server Action] Deleting Lesson:", id)
  try {
    await deleteLessonService(id) // Gọi hàm xóa thường trong service
    return { success: true }
  } catch (error) {
    console.error("Delete API Error:", error)
    throw new Error("Could not delete lesson")
  }
}

// ✅ CREATE (Tạo mới)
export async function createNewLessonAPI(data: {
  title: string
  content: string
  type: string
}): Promise<Lesson> {
  console.log("🔥 [Server Action] Creating Lesson:", data)

  try {
    const newLesson = await createLessonAction({
      title: data.title,
      content: data.content,
      type: data.type,
      course_id: null,
      duration_minutes: 0,
    })

    return mapLessonResponse(newLesson)
  } catch (error) {
    console.error("Create API Error:", error)
    throw new Error("Could not create lesson")
  }
}

// ==============================================================================
//  CÁC HÀM NÂNG CAO (SMART LOGIC) - Dùng cho giao diện Edit/Delete có cảnh báo
// ==============================================================================

// ✅ 1. Kiểm tra phụ thuộc (Dùng cho cả Edit và Delete)
export async function checkLessonDependencyAPI(id: number) {
  return await checkLessonUsageService(id)
}

// ✅ 2. Xóa thông minh (Tự quyết định Hard hay Soft Delete)
export async function smartDeleteLessonAPI(id: number) {
  console.log("🧠 [Smart Action] Deleting:", id)
  const usage = await checkLessonUsageService(id)

  if (usage.total > 0) {
    // Đang dùng -> Soft Delete (Lưu trữ)
    await softDeleteLessonService(id)
    return { success: true, mode: "soft_delete" }
  } else {
    // Chưa dùng -> Hard Delete (Xóa vĩnh viễn)
    await hardDeleteLessonService(id)
    return { success: true, mode: "hard_delete" }
  }
}

// ✅ 3. Sửa thông minh (Xử lý Clone hoặc Overwrite)
export async function smartUpdateLessonAPI(
  id: number,
  data: any,
  mode: "overwrite" | "save_as_new"
) {
  console.log(`🧠 [Smart Action] Update mode: ${mode}`, id)

  // Chuẩn bị payload chuẩn cho DB
  const payload: any = {
    title: data.title,
    type: data.type,
    content: null,
    video_url: null,
    file_path: null,
  }

  if (data.type === "video") payload.video_url = data.content
  else if (data.type === "pdf") payload.file_path = data.content
  else payload.content = data.content

  try {
    if (mode === "save_as_new") {
      // Logic Clone: Tạo bài mới dựa trên dữ liệu edit
      const newLesson = await cloneLessonService(id, payload)
      return {
        success: true,
        mode: "cloned",
        lesson: mapLessonResponse(newLesson),
      }
    } else {
      // Logic Overwrite: Ghi đè bài cũ
      const updated = await updateLessonAction(id, payload)
      return {
        success: true,
        mode: "updated",
        lesson: mapLessonResponse(updated),
      }
    }
  } catch (error) {
    console.error("Smart Update Error:", error)
    throw new Error("Failed to process smart update")
  }
}
