// @/service/lesson.service.ts
// Lesson Service - Chứa logic xử lý lesson
"use server"

import { sql } from "../lib/database"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type Lesson = {
  id: number
  course_id: number
  // section_id: number | null  XOA dong nay
  title: string
  content: string | null
  video_url: string | null
  display_order: number
  duration_minutes: number | null
  file_path: string | null
  type: string // 'video', 'text', 'quiz'
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}
export type CreateLessonPayload = {
  title: string
  content: string
  type?: string
  course_id?: number | null
  duration_minutes?: number
}
/**
 * Type cho tham số lấy danh sách lesson
 */
type GetAllLessonsParams = {
  course_id?: number
  query?: string
  page?: number
  limit?: number
  sort?: "newest" | "oldest" | "title"
  include_deleted?: boolean
}

/**
 * Lấy tất cả lessons
 */
export async function getAllLessonsAction({
  course_id,
  query = "",
  page = 1,
  limit = 100,
  sort = "newest",
  include_deleted = false,
}: GetAllLessonsParams = {}) {
  const offset = (page - 1) * limit
  const searchQuery = `%${query}%`

  // Xây dựng câu lệnh ORDER BY
  let orderBy = ""
  switch (sort) {
    case "title":
      orderBy = "title ASC"
      break
    case "oldest":
      orderBy = "created_at ASC"
      break
    case "newest":
    default:
      orderBy = "created_at DESC"
      break
  }

  try {
    // Lấy tổng số bản ghi
    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM lessons
      WHERE 
        (title ILIKE ${searchQuery} OR content ILIKE ${searchQuery})
        ${course_id ? sql`AND course_id = ${course_id}` : sql``}
        ${!include_deleted ? sql`AND deleted_at IS NULL` : sql``}
    `

    // Lấy dữ liệu phân trang
    const lessons = await sql`
      SELECT 
        id,
        course_id,
        title,
        content,
        video_url,
        display_order,
        duration_minutes,
        file_path,
        created_at,
        updated_at
      FROM lessons
      WHERE 
        (title ILIKE ${searchQuery} OR content ILIKE ${searchQuery})
        ${course_id ? sql`AND course_id = ${course_id}` : sql``}
        ${!include_deleted ? sql`AND deleted_at IS NULL` : sql``}
      ORDER BY ${sql.unsafe(orderBy)}, display_order ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    return {
      data: lessons,
      pagination: {
        total: Number(countResult.total),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult.total) / limit),
      },
    }
  } catch (error) {
    console.error("Error in getAllLessonsAction:", error)
    throw new Error("Failed to fetch lessons")
  }
}

/**
 * Lấy lesson theo ID
 */
export async function getLessonByIdAction(id: number, include_deleted = false) {
  // 1. Kiểm tra ID đầu vào
  if (!id || isNaN(id)) {
    console.warn("⚠️ getLessonByIdAction received invalid ID:", id)
    return undefined
  }

  try {
    const [lesson] = await sql`
      SELECT 
        id, 
        course_id, 
        title, 
        content, 
        video_url, 
        duration_minutes, 
        type
      FROM lessons
      WHERE id = ${id}
      ${!include_deleted ? sql`AND deleted_at IS NULL` : sql``}
    `

    // Nếu không tìm thấy lesson, trả về undefined thay vì lỗi
    if (!lesson) {
      console.warn(`⚠️ Lesson with ID ${id} not found in DB`)
      return undefined
    }

    return lesson as Lesson
  } catch (error) {
    // 2. Log lỗi chi tiết ra Terminal của Server để debug
    console.error(`❌ DB Error in getLessonByIdAction(${id}):`, error)

    // 3. Trả về undefined để Client không bị crash
    return undefined
  }
}
/**
 * Tạo mới lesson
 */
export async function createLessonAction(payload: CreateLessonPayload) {
  // 1. Chuẩn bị biến để lưu vào DB
  let dbContent: string | null = null
  let dbVideoUrl: string | null = null
  let dbFilePath: string | null = null

  // 2. Phân loại dữ liệu dựa trên 'type'
  // Dữ liệu từ Frontend gửi lên luôn nằm trong payload.content, ta cần chia nó ra.
  switch (payload.type) {
    case "video":
      dbVideoUrl = payload.content // Nếu là video, lưu vào cột video_url
      break
    case "pdf":
      dbFilePath = payload.content // Nếu là pdf, lưu link vào cột file_path
      break
    case "text":
    default:
      dbContent = payload.content // Mặc định hoặc text, lưu vào cột content
      break
  }

  // 3. Thực hiện câu lệnh SQL INSERT chuẩn xác
  const result = await sql`
    INSERT INTO lessons (
      title, 
      course_id, 
      duration_minutes,
      type,       -- Cột loại bài học
      content,    -- Cột nội dung text
      video_url,  -- Cột link video
      file_path   -- Cột link file PDF
    ) VALUES (
      ${payload.title}, 
      ${payload.course_id}, 
      ${payload.duration_minutes},
      ${payload.type}, -- Lưu: 'text', 'video', hoặc 'pdf'
      ${dbContent},    -- Chỉ có dữ liệu nếu type là text
      ${dbVideoUrl},   -- Chỉ có dữ liệu nếu type là video
      ${dbFilePath}    -- Chỉ có dữ liệu nếu type là pdf
    )
    RETURNING id, title, duration_minutes, type
  `

  return result[0]
}

/**
 * Cập nhật lesson
 */
export async function updateLessonAction(
  id: number,
  data: Partial<
    Omit<
      Lesson,
      "id" | "created_at" | "updated_at" | "deleted_at" | "course_id"
    >
  >
) {
  try {
    await sql`BEGIN`

    // Nếu cập nhật display_order, cần điều chỉnh các bài học khác
    if (data.display_order !== undefined) {
      const [currentLesson] = await sql`
        SELECT course_id, display_order 
        FROM lessons 
        WHERE id = ${id}
      `

      if (currentLesson) {
        // Nếu giảm display_order
        if (data.display_order < currentLesson.display_order) {
          await sql`
            UPDATE lessons
            SET display_order = display_order + 1
            WHERE course_id = ${currentLesson.course_id}
              AND display_order >= ${data.display_order}
              AND display_order < ${currentLesson.display_order}
              AND id != ${id}
          `
        }
        // Nếu tăng display_order
        else if (data.display_order > currentLesson.display_order) {
          await sql`
            UPDATE lessons
            SET display_order = display_order - 1
            WHERE course_id = ${currentLesson.course_id}
              AND display_order <= ${data.display_order}
              AND display_order > ${currentLesson.display_order}
              AND id != ${id}
          `
        }
      }
    }

    const [updatedLesson] = await sql`
      UPDATE lessons
      SET 
        
        title = COALESCE(${data.title}, title),
        content = COALESCE(${data.content}, content),
        video_url = COALESCE(${data.video_url}, video_url),
        display_order = COALESCE(${data.display_order}, display_order),
        duration_minutes = ${data.duration_minutes !== undefined ? data.duration_minutes : null},
        file_path = COALESCE(${data.file_path}, file_path),
        updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `

    if (!updatedLesson) {
      throw new Error("Lesson not found")
    }

    await sql`COMMIT`

    // Revalidate paths
    revalidatePath(`/courses/${updatedLesson.course_id}/lessons`)
    revalidatePath(`/lessons/${id}`)

    return updatedLesson as Lesson
  } catch (error) {
    await sql`ROLLBACK`
    console.error(`Error in updateLessonAction(${id}):`, error)
    throw new Error("Failed to update lesson")
  }
}

/**
 * Xóa lesson (soft delete)
 */
export async function deleteLessonAction(id: number) {
  try {
    await sql`BEGIN`

    // Lấy thông tin lesson để revalidate path sau khi xóa
    const [lesson] = await sql`
      SELECT course_id 
      FROM lessons 
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (!lesson) {
      throw new Error("Lesson not found or already deleted")
    }

    const [deletedLesson] = await sql`
      UPDATE lessons
      SET 
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `

    await sql`COMMIT`

    // Revalidate paths
    revalidatePath(`/courses/${lesson.course_id}/lessons`)
    revalidatePath(`/lessons/${id}`)

    return { success: true }
  } catch (error) {
    await sql`ROLLBACK`
    console.error(`Error in deleteLessonAction(${id}):`, error)
    throw new Error("Failed to delete lesson")
  }
}

/**
 * Lấy các lesson theo danh sách ID
 */
export async function getLessonsByIdsAction(ids: number[]) {
  if (!ids.length) return []

  try {
    const lessons = await sql`
      SELECT * FROM lessons
      WHERE id = ANY(${ids}::int[])
      AND deleted_at IS NULL
      ORDER BY array_position(${ids}::int[], id)
    `
    return lessons as Lesson[]
  } catch (error) {
    console.error("Error in getLessonsByIdsAction:", error)
    throw new Error("Failed to fetch lessons by IDs")
  }
}

/**
 * Cập nhật thứ tự hiển thị của các bài học
 */
export async function updateLessonsOrderAction(
  lessons: { id: number; display_order: number }[]
) {
  try {
    await sql`BEGIN`

    // Tạo một bảng tạm để cập nhật hàng loạt
    const values = lessons.map((l) => `(${l.id}, ${l.display_order})`).join(",")

    await sql.unsafe(`
      UPDATE lessons AS l
      SET 
        display_order = v.display_order,
        updated_at = NOW()
      FROM (VALUES ${values}) AS v(id, display_order)
      WHERE l.id = v.id::bigint
    `)

    await sql`COMMIT`

    // Revalidate paths
    if (lessons.length > 0) {
      const [course] = await sql`
        SELECT course_id FROM lessons WHERE id = ${lessons[0].id}
      `
      if (course) {
        revalidatePath(`/courses/${course.course_id}/lessons`)
      }
    }

    return { success: true }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Error in updateLessonsOrderAction:", error)
    throw new Error("Failed to update lessons order")
  }
}

/**
 * 1. CHECK DEPENDENCY: Kiểm tra lesson đang được dùng ở đâu
 */
export async function checkLessonUsageService(lessonId: number) {
  try {
    // Logic: Đếm số lượng khóa học đang liên kết với bài học này
    // Giả sử bài học liên kết với khóa học qua cột course_id (1-N)
    // Nếu bạn có bảng trung gian (curriculum_items), hãy sửa query JOIN tương ứng
    const usage = await sql`
      SELECT 
        c.status,
        COUNT(c.id) as count
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = ${lessonId}
      GROUP BY c.status
    `

    const result = { total: 0, published: 0, draft: 0 }

    usage.forEach((row: any) => {
      const count = Number(row.count)
      result.total += count
      if (row.status === "published") result.published += count
      else result.draft += count
    })

    return result
  } catch (error) {
    console.error("Check Usage Error:", error)
    return { total: 0, published: 0, draft: 0 }
  }
}

/**
 * 2. SOFT DELETE (Lưu trữ)
 */
export async function softDeleteLessonService(id: number) {
  await sql`
    UPDATE lessons 
    SET deleted_at = NOW() 
    WHERE id = ${id}
  `
  return { success: true }
}

/**
 * 3. HARD DELETE (Xóa vĩnh viễn)
 */
export async function hardDeleteLessonService(id: number) {
  await sql`DELETE FROM lessons WHERE id = ${id}`
  return { success: true }
}

/**
 * 4. CLONE LESSON (Lưu thành bài mới)
 */
export async function cloneLessonService(originalId: number, newData: any) {
  // Lấy data cũ
  const [original] = await sql`SELECT * FROM lessons WHERE id = ${originalId}`
  if (!original) throw new Error("Original lesson not found")

  // Data mới ưu tiên, nếu không có thì lấy cũ
  const title = newData.title || `${original.title} (Copy)`
  const content =
    newData.content !== undefined ? newData.content : original.content
  const type = newData.type || original.type
  const video_url =
    newData.video_url !== undefined ? newData.video_url : original.video_url
  const file_path =
    newData.file_path !== undefined ? newData.file_path : original.file_path

  // Insert bài mới
  const [newLesson] = await sql`
    INSERT INTO lessons (
      title, content, type, video_url, file_path, duration_minutes, course_id
    ) VALUES (
      ${title}, ${content}, ${type}, ${video_url}, ${file_path}, 
      ${original.duration_minutes}, ${null} 
    )
    RETURNING id, title, duration_minutes, type, content, video_url, file_path
  `
  // Note: course_id set null để nó thành bài trong Content Bank (Orphan)
  return newLesson
}
