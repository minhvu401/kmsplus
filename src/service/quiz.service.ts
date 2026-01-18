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
export async function getAllQuizzesAction({
  query = "",
  page = 1,
  limit = 10,
  course_id,
}: GetAllQuizzesParams) {
  const offset = (page - 1) * limit

  try {
    let rows
    let totalResult
    
    if (query && course_id) {
      const searchPattern = `%${query}%`
      rows = await sql`
        SELECT * FROM quizzes
        WHERE is_deleted = FALSE 
          AND title ILIKE ${searchPattern}
          AND course_id = ${course_id}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      totalResult = await sql`
        SELECT COUNT(*) FROM quizzes
        WHERE is_deleted = FALSE 
          AND title ILIKE ${searchPattern}
          AND course_id = ${course_id}
      `
    } else if (query) {
      const searchPattern = `%${query}%`
      rows = await sql`
        SELECT * FROM quizzes
        WHERE is_deleted = FALSE 
          AND title ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      totalResult = await sql`
        SELECT COUNT(*) FROM quizzes
        WHERE is_deleted = FALSE 
          AND title ILIKE ${searchPattern}
      `
    } else if (course_id) {
      rows = await sql`
        SELECT * FROM quizzes
        WHERE is_deleted = FALSE 
          AND course_id = ${course_id}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      totalResult = await sql`
        SELECT COUNT(*) FROM quizzes
        WHERE is_deleted = FALSE 
          AND course_id = ${course_id}
      `
    } else {
      rows = await sql`
        SELECT * FROM quizzes
        WHERE is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      totalResult = await sql`
        SELECT COUNT(*) FROM quizzes
        WHERE is_deleted = FALSE
      `
    }

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
 */
export async function createQuizAction(data: {
  course_id: number
  title: string
  description?: string
  status?: string
  time_limit_minutes?: number
  passing_score?: number
  max_attempts?: number
  questionIds?: number[]
}) {
  try {
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

    const quiz = result[0] as Quiz
    const quizId = quiz.id

    // Nếu có question IDs, tạo liên kết
    if (data.questionIds && data.questionIds.length > 0) {
      for (let i = 0; i < data.questionIds.length; i++) {
        const questionId = data.questionIds[i]
        try {
          await sql`
            INSERT INTO quiz_questions (quiz_id, question_id, question_order)
            VALUES (${quizId}, ${questionId}, ${i + 1})
          `
        } catch (insertError) {
          console.error("Failed to insert question link:", insertError)
        }
      }
    }

    return quiz
  } catch (err) {
    console.error("createQuizAction failed:", err)
    throw new Error("Failed to create quiz")
  }
}

/**
 * Cập nhật một bài thi.
 */
export async function updateQuizAction(
  id: number,
  data: Partial<Omit<Quiz, "id" | "created_at" | "updated_at">>
) {
  try {
    const title = data.title
    const description = data.description
    const time_limit_minutes = data.time_limit_minutes
    const passing_score = data.passing_score
    const max_attempts = data.max_attempts
    const course_id = data.course_id

    const result = await sql`
      UPDATE quizzes
      SET 
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        time_limit_minutes = COALESCE(${time_limit_minutes}, time_limit_minutes),
        passing_score = COALESCE(${passing_score}, passing_score),
        max_attempts = COALESCE(${max_attempts}, max_attempts),
        course_id = COALESCE(${course_id}, course_id),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
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

/**
 * Lấy danh sách câu hỏi của một quiz.
 */
export async function getQuizQuestionsAction(quizId: number) {
  try {
    const rows = await sql`
      SELECT 
        qq.id as quiz_question_id,
        qq.question_id,
        qq.question_order,
        qb.question_text,
        qb.type,
        qb.explanation
      FROM quiz_questions qq
      JOIN question_bank qb ON qq.question_id = qb.id
      WHERE qq.quiz_id = ${quizId}
      ORDER BY qq.question_order ASC, qq.id ASC
    `
    return rows
  } catch (error) {
    console.error("getQuizQuestionsAction error:", error)
    return []
  }
}

/**
 * Cập nhật danh sách câu hỏi của một quiz.
 * - Xóa tất cả câu hỏi cũ
 * - Thêm lại câu hỏi mới (batch insert)
 */
// ...existing code...

/**
 * Cập nhật danh sách câu hỏi của một quiz.
 */
export async function updateQuizQuestionsAction(quizId: number, questionIds: number[]) {
  try {
    // Xóa tất cả câu hỏi hiện tại của quiz
    await sql`
      DELETE FROM quiz_questions
      WHERE quiz_id = ${quizId}
    `
    
    if (questionIds.length === 0) {
      return true
    }

    // Insert từng câu một (chậm hơn nhưng ổn định hơn)
    for (let i = 0; i < questionIds.length; i++) {
      const questionId = questionIds[i]
      const order = i + 1
      
      await sql`
        INSERT INTO quiz_questions (quiz_id, question_id, question_order)
        VALUES (${quizId}, ${questionId}, ${order})
        ON CONFLICT (quiz_id, question_id) 
        DO UPDATE SET question_order = EXCLUDED.question_order
      `
    }
    
    return true
  } catch (error) {
    console.error("updateQuizQuestionsAction error:", error)
    throw new Error("Failed to update quiz questions")
  }
}

