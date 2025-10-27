//Course Service
"use server"

import { sql } from "@/lib/neonClient"

export type Course = {
  id: number
  creator_id: number
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  status: string
  duration_hours: number | null
  enrollment_count: number
  approved_by: number | null
  approved_at: Date | null
  published_at: Date | null
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

type GetAllCoursesParams = {
  query?: string
  page?: number
  limit?: number
}

export async function getAllCoursesAction({
  query = "",
  page = 1,
  limit = 10,
}: GetAllCoursesParams) {
  const offset = (page - 1) * limit

  const rows = await sql`
    SELECT *
    FROM courses
    WHERE is_deleted = FALSE
      AND (title ILIKE ${"%" + query + "%"} OR slug ILIKE ${"%" + query + "%"})
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `

  const totalResult = await sql`
    SELECT COUNT(*) FROM courses WHERE is_deleted = FALSE
      AND (title ILIKE ${"%" + query + "%"} OR slug ILIKE ${"%" + query + "%"})
  `

  const totalCount = parseInt(totalResult[0].count as string, 10)

  return {
    courses: rows as Course[],
    totalCount,
  }
}

export async function getCourseByIdAction(id: number) {
  const rows = await sql`
    SELECT * FROM courses
    WHERE id = ${id} AND is_deleted = FALSE
  `
  return rows.length > 0 ? (rows[0] as Course) : null
}

export async function createCourseAction(data: {
  creator_id: number
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
}) {
  try {
    await sql`BEGIN`
    const result = await sql`
      INSERT INTO courses (
        creator_id, title, slug, description, thumbnail_url, status, duration_hours
      ) VALUES (
        ${data.creator_id}, ${data.title}, ${data.slug}, ${data.description || null}, ${data.thumbnail_url || null}, ${data.status || "draft"}, ${data.duration_hours || 0}
      ) RETURNING *
    `
    await sql`COMMIT`
    return result[0] as Course
  } catch (err) {
    await sql`ROLLBACK`
    console.error("createCourseAction transaction failed:", err)
    throw new Error("Failed to create course")
  }
}

export async function updateCourseAction(
  id: number,
  data: Partial<Omit<Course, "id" | "created_at" | "updated_at">>
) {
  const result = await sql`
    UPDATE courses
    SET
      title = COALESCE(${data.title}, title),
      slug = COALESCE(${data.slug}, slug),
      description = COALESCE(${data.description}, description),
      thumbnail_url = COALESCE(${data.thumbnail_url}, thumbnail_url),
      status = COALESCE(${data.status}, status),
      duration_hours = COALESCE(${data.duration_hours}, duration_hours),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result.length > 0 ? (result[0] as Course) : null
}

export async function deleteCourseAction(id: number) {
  await sql`
    UPDATE courses
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE id = ${id}
  `
  return { message: "Course marked as deleted" }
}
