// Quiz Service
"use server"

import { sql } from "@/lib/database"

/**
 * Quiz type theo DB schema actual:
 * - id: BIGSERIAL PRIMARY KEY
 * - course_id: BIGINT NOT NULL (FOREIGN KEY)
 * - title: VARCHAR(500) NOT NULL
 * - description: TEXT (nullable)
 * - time_limit_minutes: INTEGER (nullable)
 * - passing_score: NUMERIC(5, 2) DEFAULT 70.00
 * - max_attempts: SMALLINT DEFAULT 3
 * - available_from: TIMESTAMP (nullable)
 * - available_until: TIMESTAMP (nullable)
 * - is_deleted: BOOLEAN DEFAULT false
 * - deleted_at: TIMESTAMP (nullable)
 * - created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * - updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 */
export type Quiz = {
  id: number
  course_id: number
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  available_from: Date | null
  available_until: Date | null
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

type GetAllQuizzesParams = {
  query?: string
  page?: number
  limit?: number
  course_id?: number
}

/**
 * Lấy danh sách bài thi có phân trang và tìm kiếm.
 * - Hỗ trợ tìm kiếm theo title
 * - Hỗ trợ filter theo course_id
 * - Phân trang theo page và limit
 */
// ...existing code...

export async function getAllQuizzesAction({
  query = "",
  page = 1,
  limit = 10,
  course_id,
}: GetAllQuizzesParams) {
  const offset = (page - 1) * limit

  try {
    let whereConditions: string[] = ["is_deleted = FALSE"]
    const params: any[] = []

    if (query) {
      whereConditions.push(`title ILIKE $${params.length + 1}`)
      params.push("%" + query + "%")
    }

    if (course_id) {
      whereConditions.push(`course_id = $${params.length + 1}`)
      params.push(course_id)
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Fetch data
    const dataQuery = `
      SELECT *
      FROM quizzes
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const rows = await (sql as any)(dataQuery, [...params, limit, offset])

    // Count total
    const countQuery = `SELECT COUNT(*) FROM quizzes ${whereClause}`
    const totalResult = await (sql as any)(countQuery, params)

    const totalCount = parseInt(totalResult[0].count as string, 10)

    return {
      quizzes: rows as Quiz[],
      totalCount,
    }
  } catch (error) {
    console.error("getAllQuizzesAction error:", error)
    throw new Error("Failed to fetch quizzes")
  }
}

/**
 * Lấy chi tiết một bài thi theo ID.
 */
export async function getQuizByIdAction(id: number) {
  try {
    const rows = await sql`
      SELECT * FROM quizzes
      WHERE id = ${id} AND is_deleted = FALSE
    `
    return rows.length > 0 ? (rows[0] as Quiz) : null
  } catch (error) {
    console.error("getQuizByIdAction error:", error)
    throw new Error("Failed to fetch quiz")
  }
}

/**
 * Tạo mới một bài thi.
 * 
 * Functional Requirements (FR-01):
 * - User Action: Click vào ô "Quiz Title" và nhập text
 * - System Behavior: Validate độ dài (Max 255 ký tự). Cập nhật biến state title.
 * - Post-conditions: Dữ liệu Title và Description được lưu trong DB
 * 
 * Accepts sanitized data từ server action (quizActions.ts)
 */
export async function createQuizAction(data: {
  course_id: number
  title: string
  description?: string
  status?: string
  time_limit_minutes?: number
  passing_score?: number
  max_attempts?: number
}) {
  try {
    await sql`BEGIN`

    const result = await sql`
      INSERT INTO quizzes (
        course_id, 
        title, 
        description, 
        time_limit_minutes, 
        passing_score, 
        max_attempts,
        is_deleted
      ) VALUES (
        ${data.course_id}, 
        ${data.title}, 
        ${data.description || null}, 
        ${data.time_limit_minutes || null}, 
        ${data.passing_score || 70}, 
        ${data.max_attempts || 3},
        false
      ) RETURNING *
    `

    await sql`COMMIT`
    return result[0] as Quiz
  } catch (err) {
    await sql`ROLLBACK`
    console.error("createQuizAction transaction failed:", err)
    throw new Error("Failed to create quiz")
  }
}

/**
 * Cập nhật một bài thi.
 */
// ...existing code...

/**
 * Cập nhật một bài thi.
 */
export async function updateQuizAction(
  id: number,
  data: Partial<Omit<Quiz, "id" | "created_at" | "updated_at">>
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        updates.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    })

    if (updates.length === 0) return { id } as Quiz

    const query = `
      UPDATE quizzes
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(id)

    const result = await (sql as any)(query, values)
    return result.length > 0 ? (result[0] as Quiz) : null
  } catch (error) {
    console.error("updateQuizAction error:", error)
    throw new Error("Failed to update quiz")
  }
}

/**
 * Xóa một bài thi (soft delete).
 */
export async function deleteQuizAction(id: number) {
  try {
    const result = await sql`
      UPDATE quizzes
      SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result.length > 0 ? (result[0] as Quiz) : null
  } catch (error) {
    console.error("deleteQuizAction error:", error)
    throw new Error("Failed to delete quiz")
  }
}