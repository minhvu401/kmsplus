// @/src/service/lesson.service.ts
// Lesson Service - Chứa logic xử lý lesson
"use server"

import { sql } from "../lib/database"
import { revalidatePath } from "next/cache"

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================

export type Lesson = {
  id: bigint
  course_id: number | null
  category_id?: number | null
  title: string
  content: string | null
  video_url: string | null
  display_order: number
  duration_minutes: number | null
  file_path: string | null
  type: string // 'video', 'text_media', 'pdf'
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export type CreateLessonPayload = {
  title: string
  content: string
  type?: string
  course_id?: number | null
  category_id?: number | null
  duration_minutes?: number
}

type GetAllLessonsParams = {
  course_id?: number
  query?: string
  page?: number
  limit?: number
  sort?: "newest" | "oldest" | "title"
  include_deleted?: boolean
}

// ============================================================================
// 2. QUERY ACTIONS
// ============================================================================

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
        category_id,
        title,
        content,
        video_url,
        display_order,
        duration_minutes,
        file_path,
        type,
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
      data: lessons as Lesson[],
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
  if (!id || isNaN(id)) {
    return undefined
  }

  try {
    const [lesson] = await sql`
      SELECT 
        id, 
        course_id, 
        category_id,
        content, 
        video_url, 
        duration_minutes, 
        type,
        file_path
      FROM lessons
      WHERE id = ${id}
      ${!include_deleted ? sql`AND deleted_at IS NULL` : sql``}
    `

    if (!lesson) {
      return undefined
    }

    return lesson as Lesson
  } catch (error) {
    console.error(`❌ DB Error in getLessonByIdAction(${id}):`, error)
    return undefined
  }
}

// ============================================================================
// 3. MUTATION ACTIONS
// ============================================================================

/**
 * Tạo mới lesson
 */
export async function createLessonAction(payload: CreateLessonPayload) {
  let dbContent: string | null = null
  let dbVideoUrl: string | null = null
  let dbFilePath: string | null = null

  switch (payload.type) {
    case "video":
      dbVideoUrl = payload.content
      break
    case "pdf":
      dbFilePath = payload.content
      break
    case "text_media":
    default:
      dbContent = payload.content
      break
  }

  const result = await sql`
    INSERT INTO lessons (
      title, 
      course_id, 
      category_id,     
      duration_minutes,
      type,             
      content,          
      video_url,        
      file_path         
    ) VALUES (
      ${payload.title}, 
      ${payload.course_id || null}, 
      ${payload.category_id || null}, 
      ${payload.duration_minutes || 0},
      ${payload.type || "text_media"}, 
      ${dbContent},     
      ${dbVideoUrl},    
      ${dbFilePath}     
    )
    RETURNING id, title, duration_minutes, type, category_id, content, video_url, file_path
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

    // Xử lý thứ tự hiển thị (nếu có)
    if (data.display_order !== undefined) {
      const [currentLesson] = await sql`
        SELECT course_id, display_order 
        FROM lessons 
        WHERE id = ${id}
      `

      if (currentLesson && currentLesson.course_id) {
        if (data.display_order < currentLesson.display_order) {
          await sql`
            UPDATE lessons
            SET display_order = display_order + 1
            WHERE course_id = ${currentLesson.course_id}
              AND display_order >= ${data.display_order}
              AND display_order < ${currentLesson.display_order}
              AND id != ${id}
          `
        } else if (data.display_order > currentLesson.display_order) {
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
        category_id = ${data.category_id !== undefined ? data.category_id : sql`category_id`}, 
        content = COALESCE(${data.content}, content),
        video_url = COALESCE(${data.video_url}, video_url),
        display_order = COALESCE(${data.display_order}, display_order),
        duration_minutes = ${data.duration_minutes !== undefined ? data.duration_minutes : sql`duration_minutes`},
        file_path = COALESCE(${data.file_path}, file_path),
        type = COALESCE(${data.type}, type),
        updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `

    if (!updatedLesson) {
      throw new Error("Lesson not found")
    }

    await sql`COMMIT`

    if (updatedLesson.course_id) {
      revalidatePath(`/courses/${updatedLesson.course_id}/lessons`)
    }
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

    const [lesson] = await sql`
      SELECT course_id 
      FROM lessons 
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (!lesson) {
      throw new Error("Lesson not found or already deleted")
    }

    await sql`
      UPDATE lessons
      SET 
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `

    await sql`COMMIT`

    if (lesson.course_id) {
      revalidatePath(`/courses/${lesson.course_id}/lessons`)
    }
    revalidatePath(`/lessons/${id}`)

    return { success: true }
  } catch (error) {
    await sql`ROLLBACK`
    console.error(`Error in deleteLessonAction(${id}):`, error)
    throw new Error("Failed to delete lesson")
  }
}

// ============================================================================
// 4. SMART / BULK ACTIONS
// ============================================================================

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

    if (lessons.length > 0) {
      const [course] = await sql`
        SELECT course_id FROM lessons WHERE id = ${lessons[0].id}
      `
      if (course && course.course_id) {
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
 * CHECK DEPENDENCY: Kiểm tra lesson đang được dùng ở đâu
 */
export async function checkLessonUsageService(lessonId: number) {
  try {
    const courseIds = new Set<number>()
    const addCourseIds = (rows: any[]) => {
      rows.forEach((row: any) => {
        if (row?.course_id != null) courseIds.add(Number(row.course_id))
      })
    }

    // Current schema: curriculum_items.lesson_id + sections.course_id
    try {
      const modernUsage = await sql`
        SELECT DISTINCT s.course_id
        FROM curriculum_items ci
        JOIN sections s ON s.id = ci.section_id
        WHERE ci.lesson_id = ${lessonId}
          AND s.course_id IS NOT NULL
      `
      addCourseIds(modernUsage as any[])
    } catch {
      // Ignore if this schema/table variant is unavailable.
    }

    // Older section table variant: curriculum_sections
    try {
      const legacySectionUsage = await sql`
        SELECT DISTINCT cs.course_id
        FROM curriculum_items ci
        JOIN curriculum_sections cs ON cs.id = ci.section_id
        WHERE ci.lesson_id = ${lessonId}
          AND cs.course_id IS NOT NULL
      `
      addCourseIds(legacySectionUsage as any[])
    } catch {
      // Ignore if this schema/table variant is unavailable.
    }

    // Legacy schema fallback: curriculum_items.resource_id + course_id
    try {
      const legacyUsage = await sql`
        SELECT DISTINCT ci.course_id
        FROM curriculum_items ci
        WHERE ci.type = 'lesson'
          AND ci.resource_id = ${lessonId}
          AND ci.course_id IS NOT NULL
      `
      addCourseIds(legacyUsage as any[])
    } catch {
      // Ignore legacy query errors when old columns are unavailable.
    }

    // Legacy variant where resource_id is present but course_id lives on curriculum_sections.
    try {
      const legacyUsageBySection = await sql`
        SELECT DISTINCT cs.course_id
        FROM curriculum_items ci
        JOIN curriculum_sections cs ON cs.id = ci.section_id
        WHERE ci.type = 'lesson'
          AND ci.resource_id = ${lessonId}
          AND cs.course_id IS NOT NULL
      `
      addCourseIds(legacyUsageBySection as any[])
    } catch {
      // Ignore legacy query errors when old columns are unavailable.
    }

    // Legacy direct linkage fallback: lessons.course_id
    const directUsage = await sql`
      SELECT course_id
      FROM lessons
      WHERE id = ${lessonId}
        AND course_id IS NOT NULL
    `
    addCourseIds(directUsage as any[])

    if (courseIds.size === 0) {
      return { total: 0, published: 0, draft: 0 }
    }

    const [result] = await sql`
      SELECT
        COUNT(DISTINCT c.id) AS total,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published') AS published,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status <> 'published') AS draft
      FROM courses c
      WHERE c.id = ANY(${Array.from(courseIds)})
        AND c.deleted_at IS NULL
    `

    return {
      total: Number(result?.total || 0),
      published: Number(result?.published || 0),
      draft: Number(result?.draft || 0),
    }
  } catch (error) {
    console.error("Check Usage Error:", error)
    return { total: 0, published: 0, draft: 0 }
  }
}

/**
 * CHECK DEPENDENCY (BATCH): Kiểm tra nhiều lesson đang được dùng ở đâu
 */
export async function checkLessonsUsageBatchService(lessonIds: number[]) {
  const normalizedIds = Array.from(
    new Set((lessonIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))
  )

  if (normalizedIds.length === 0) return {}

  try {
    const lessonToCourseIds = new Map<number, Set<number>>()

    const addPairs = (rows: any[], lessonKey: string, courseKey: string) => {
      for (const row of rows || []) {
        const lessonId = Number(row?.[lessonKey])
        const courseId = Number(row?.[courseKey])
        if (!Number.isFinite(lessonId) || !Number.isFinite(courseId)) continue
        if (!lessonToCourseIds.has(lessonId)) {
          lessonToCourseIds.set(lessonId, new Set<number>())
        }
        lessonToCourseIds.get(lessonId)!.add(courseId)
      }
    }

    // Current schema: curriculum_items.lesson_id + sections.course_id
    try {
      const modernPairs = await sql`
        SELECT DISTINCT ci.lesson_id, s.course_id
        FROM curriculum_items ci
        JOIN sections s ON s.id = ci.section_id
        WHERE ci.lesson_id = ANY(${normalizedIds}::int[])
          AND s.course_id IS NOT NULL
      `
      addPairs(modernPairs as any[], "lesson_id", "course_id")
    } catch {
      // Ignore if this schema/table variant is unavailable.
    }

    // Older section table variant: curriculum_sections
    try {
      const legacySectionPairs = await sql`
        SELECT DISTINCT ci.lesson_id, cs.course_id
        FROM curriculum_items ci
        JOIN curriculum_sections cs ON cs.id = ci.section_id
        WHERE ci.lesson_id = ANY(${normalizedIds}::int[])
          AND cs.course_id IS NOT NULL
      `
      addPairs(legacySectionPairs as any[], "lesson_id", "course_id")
    } catch {
      // Ignore if this schema/table variant is unavailable.
    }

    // Legacy schema fallback: curriculum_items.resource_id + course_id
    try {
      const legacyResourcePairs = await sql`
        SELECT DISTINCT ci.resource_id AS lesson_id, ci.course_id
        FROM curriculum_items ci
        WHERE ci.type = 'lesson'
          AND ci.resource_id = ANY(${normalizedIds}::int[])
          AND ci.course_id IS NOT NULL
      `
      addPairs(legacyResourcePairs as any[], "lesson_id", "course_id")
    } catch {
      // Ignore legacy query errors when old columns are unavailable.
    }

    // Legacy variant: resource_id + curriculum_sections.course_id
    try {
      const legacyResourceSectionPairs = await sql`
        SELECT DISTINCT ci.resource_id AS lesson_id, cs.course_id
        FROM curriculum_items ci
        JOIN curriculum_sections cs ON cs.id = ci.section_id
        WHERE ci.type = 'lesson'
          AND ci.resource_id = ANY(${normalizedIds}::int[])
          AND cs.course_id IS NOT NULL
      `
      addPairs(legacyResourceSectionPairs as any[], "lesson_id", "course_id")
    } catch {
      // Ignore legacy query errors when old columns are unavailable.
    }

    // Legacy direct linkage fallback: lessons.course_id
    try {
      const directPairs = await sql`
        SELECT id AS lesson_id, course_id
        FROM lessons
        WHERE id = ANY(${normalizedIds}::int[])
          AND course_id IS NOT NULL
      `
      addPairs(directPairs as any[], "lesson_id", "course_id")
    } catch {
      // Ignore direct fallback errors.
    }

    const allCourseIds = Array.from(
      new Set(
        Array.from(lessonToCourseIds.values()).flatMap((set) => Array.from(set))
      )
    )

    const courseStatusMap = new Map<number, string>()
    if (allCourseIds.length > 0) {
      const courseRows = await sql`
        SELECT id, status
        FROM courses
        WHERE id = ANY(${allCourseIds}::int[])
          AND deleted_at IS NULL
      `
      for (const row of (courseRows as any[]) || []) {
        const id = Number(row?.id)
        if (Number.isFinite(id)) {
          courseStatusMap.set(id, String(row?.status || ""))
        }
      }
    }

    const result: Record<number, { total: number; published: number; draft: number }> = {}

    for (const lessonId of normalizedIds) {
      const linkedCourseIds = lessonToCourseIds.get(lessonId) || new Set<number>()
      let total = 0
      let published = 0
      let draft = 0

      for (const courseId of linkedCourseIds) {
        const status = courseStatusMap.get(courseId)
        if (!status) continue
        total += 1
        if (status === "published") {
          published += 1
        } else {
          draft += 1
        }
      }

      result[lessonId] = { total, published, draft }
    }

    return result
  } catch (error) {
    console.error("Check Batch Usage Error:", error)
    return Object.fromEntries(
      normalizedIds.map((id) => [id, { total: 0, published: 0, draft: 0 }])
    )
  }
}

/**
 * SOFT DELETE (Lưu trữ)
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
 * HARD DELETE (Xóa vĩnh viễn)
 */
export async function hardDeleteLessonService(id: number) {
  await sql`DELETE FROM lessons WHERE id = ${id}`
  return { success: true }
}

/**
 * CLONE LESSON (Lưu thành bài mới)
 */
export async function cloneLessonService(originalId: number, newData: any) {
  const [original] = await sql`SELECT * FROM lessons WHERE id = ${originalId}`
  if (!original) throw new Error("Original lesson not found")

  const title = newData.title || `${original.title} (Copy)`
  const content =
    newData.content !== undefined ? newData.content : original.content
  const type = newData.type || original.type
  const video_url =
    newData.video_url !== undefined ? newData.video_url : original.video_url
  const file_path =
    newData.file_path !== undefined ? newData.file_path : original.file_path
  const category_id =
    newData.category_id !== undefined
      ? newData.category_id
      : original.category_id // Lấy category_id

  const [newLesson] = await sql`
    INSERT INTO lessons (
      title, content, type, video_url, file_path, duration_minutes, course_id, category_id 
    ) VALUES (
      ${title}, ${content}, ${type}, ${video_url}, ${file_path}, 
      ${original.duration_minutes}, ${null}, ${category_id || null} 
    )
    RETURNING id, title, duration_minutes, type, content, video_url, file_path, category_id
  `

  return newLesson
}
