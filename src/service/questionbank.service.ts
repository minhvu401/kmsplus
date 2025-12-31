"use server"

import { sql } from "@/lib/database"
import { parse } from "path"

export type Option = {
  text: String
  isCorrect: boolean
}

export type QuizQuestionDetail = {
  id: string
  creator_id?: string
  question_text: string
  question_type: string
  difficulty_level: string
  updated_at: Date
  category_id: string | null
  category_name?: string | null //join bảng để lấy name
  options?: Option[] | null
}
// tạo type cho param tìm kiếm và phân trang
type GetAllQuestionsParams = {
  query?: string
  categoryId?: string | null
  page?: number
  limit?: number
}
// thêm param cho tìm kiếm và phân trang
export async function getAllQuizQuestionsAction({
  query = "",
  page = 1,
  limit = 10,
}: GetAllQuestionsParams) {
  const offset = (page - 1) * limit
  // lấy data đã phân trang và tìm kiếm
  const quizQuestion = await sql`
      SELECT 
      qb.id, 
      qb.question_text, 
      qb.question_type, 
      qb.difficulty_level, 
      qb.updated_at,
      qb.category_id,
      c.name AS category_name
      FROM question_bank qb
      LEFT JOIN categories c ON qb.category_id = c.id
      WHERE qb.is_deleted = FALSE
      AND qb.question_text ILIKE ${"%" + query + "%"}
      ORDER BY qb.updated_at DESC
      LIMIT ${limit} 
      OFFSET ${offset}
    `
  const totalResult = await sql`
      SELECT COUNT(*) 
      FROM question_bank
      WHERE is_deleted = FALSE
      AND question_text ILIKE ${"%" + query + "%"}
    `
  const totalCount = parseInt(totalResult[0].count as string, 10)
  return {
    quizQuestion: quizQuestion as QuizQuestionDetail[],
    totalCount,
  }
}

export async function createQuizQuestionAction(
  creator_id: string,
  question_text: string,
  question_type: string,
  difficulty_level: string,
  category_id: string,
  options: Option[]
) {
  // SỬA LỖI: Dùng cú pháp `BEGIN` và `COMMIT` thủ công để tương thích rộng hơn
  try {
    await sql`BEGIN` // Bắt đầu transaction
    // 1. Insert câu hỏi vào question_bank
    const [question] = await sql`
            INSERT INTO question_bank
            (creator_id, question_text, question_type, difficulty_level, category_id)
            VALUES
            (${creator_id}, ${question_text}, ${question_type}, ${difficulty_level}, ${category_id})
            RETURNING id, question_text, question_type, difficulty_level, updated_at, category_id
        `

    // 2. Lặp qua các đáp án và insert vào question_options
    if (options && options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const option = options[i]
        await sql`
                    INSERT INTO question_options
                    (question_id, option_text, is_correct, display_order)
                    VALUES
                    (${question.id}, ${option.text}, ${option.isCorrect}, ${i})
                `
      }
    }

    await sql`COMMIT` // Hoàn tất transaction
    return question as QuizQuestionDetail
  } catch (error) {
    await sql`ROLLBACK` // Hủy bỏ transaction nếu có lỗi
    console.error("Transaction failed:", error)
    throw new Error("Failed to create question due to a database error.")
  }
}

export async function updateQuizQuestionAction(
  id: string,
  question_text: string,
  question_type: string,
  difficulty_level: string,
  category_id: string
) {
  const [updatedQuestion] = await sql`
        UPDATE question_bank
        SET 
            question_text = ${question_text},
            question_type = ${question_type},
            difficulty_level = ${difficulty_level},
            category_id = ${category_id},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, question_text, question_type, difficulty_level, updated_at, category_id
    `
  return updatedQuestion as QuizQuestionDetail
}

export async function deleteQuizQuestionAction(id: string) {
  await sql`
        UPDATE question_bank
        SET 
            is_deleted = TRUE, 
            deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
    `
  return { message: "Question marked as deleted successfully" }
}
