// services/question.service.ts
import { sql } from "@/lib/database"
import { ServiceResponse } from "./user.service"

// INTERFACE MỚI: Response data structure cho pagination
export interface PaginatedQuestionsResponse {
  data: QuestionType[]
  totalItems: number
  totalPages: number
  currentPage: number
}

// 1. ĐỊNH NGHĨA DATA TYPE (cho 1 hàng)
export interface QuestionType {
  key: React.Key
  id: string
  creator_id?: number | null
  is_in_active_quiz?: boolean
  question_text: string
  name: string
  type: "single_choice" | "multiple_choice"
  explanation?: string | null
  created_at: string
  updated_at: string
}

export interface FullQuestionType {
  id: string
  question_text: string
  category_id: string
  type: "single_choice" | "multiple_choice"
  options: string[]
  correct_answer: number | number[] | null
  explanation?: string | null
}

export interface GetQuestionsFilters {
  query?: string
  type?: "single_choice" | "multiple_choice" | "all"
  category?: string
  sort?: "newest" | "oldest"
}

export async function getQuestionsAction(
  page: number = 1,
  limit: number = 10,
  filters: GetQuestionsFilters = {}
): Promise<PaginatedQuestionsResponse> {
  try {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
    const offset = (safePage - 1) * safeLimit

    const normalizedQuery = filters.query?.trim() ?? ""
    const selectedType = filters.type ?? "all"
    const selectedCategory = filters.category ?? "all"
    const sort = filters.sort ?? "newest"

    const whereQuery = normalizedQuery
      ? sql`
          AND (
            COALESCE(qb.question_text, '') ILIKE ${"%" + normalizedQuery + "%"}
            OR COALESCE(qb.explanation, '') ILIKE ${"%" + normalizedQuery + "%"}
          )
        `
      : sql``

    const whereType =
      selectedType !== "all" ? sql`AND qb.type = ${selectedType}` : sql``

    const whereCategory =
      selectedCategory !== "all" ? sql`AND c.name = ${selectedCategory}` : sql``

    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM question_bank qb
      JOIN categories c ON qb.category_id = c.id
      WHERE (qb.is_deleted = false OR qb.is_deleted IS NULL)
      ${whereQuery}
      ${whereType}
      ${whereCategory}
    `
    const totalItems = parseInt(countResult[0].total)

    const data = await sql`
      SELECT 
        qb.id, 
        qb.creator_id,
        EXISTS (
          SELECT 1
          FROM quiz_questions qq
          JOIN quizzes q ON q.id = qq.quiz_id
          WHERE qq.question_id = qb.id
            AND q.is_deleted = false
            AND (q.available_from IS NULL OR q.available_from <= NOW())
            AND (q.available_until IS NULL OR q.available_until >= NOW())
        ) as is_in_active_quiz,
        qb.question_text, 
        qb.type,
        qb.explanation,
        c.name, 
        qb.created_at,
        qb.updated_at 
      FROM question_bank qb
      JOIN categories c
      ON qb.category_id = c.id
      WHERE (qb.is_deleted = false OR qb.is_deleted IS NULL)
      ${whereQuery}
      ${whereType}
      ${whereCategory}
      ORDER BY
        CASE WHEN ${sort} = 'oldest' THEN qb.created_at END ASC,
        CASE WHEN ${sort} = 'newest' THEN qb.created_at END DESC,
        qb.created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset};
    `
    // ← STEP 4: Tính tổng số trang
    const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit))
    // ← STEP 5: Return object với metadata
    return {
      data: data as QuestionType[],
      totalItems,
      totalPages,
      currentPage: safePage,
    }
  } catch (error) {
    console.error("Error fetching questions:", error)
    throw new Error("Could not fetch questions")
  }
}

/**
 * Lấy tất cả câu hỏi từ question_bank cho một category cụ thể
 * Dùng cho việc thêm câu hỏi vào quiz
 */
export async function getQuestionsByCategoryAction(categoryId: number) {
  try {
    console.log(
      "🟦 [getQuestionsByCategoryAction] Querying for categoryId:",
      categoryId
    )
    const data = await sql`
      SELECT 
        qb.id,
        qb.question_text,
        qb.type,
        qb.explanation,
        c.name as category_name,
        qb.created_at,
        qb.updated_at
      FROM question_bank qb
      JOIN categories c ON qb.category_id = c.id
      WHERE qb.category_id = ${categoryId}
        AND (qb.is_deleted = false OR qb.is_deleted IS NULL)
      ORDER BY qb.updated_at DESC
    `
    console.log(
      "🟦 [getQuestionsByCategoryAction] Query returned",
      data?.length || 0,
      "questions"
    )
    console.log("🟦 [getQuestionsByCategoryAction] Data:", data)
    return data
  } catch (error) {
    console.error(
      "🔴 [getQuestionsByCategoryAction] Error fetching questions by category:",
      error
    )
    throw new Error("Could not fetch questions by category")
  }
}

/**
 * Lấy tất cả câu hỏi từ question_bank (không phân trang)
 * Dùng cho dropdown chọn câu hỏi
 */
export async function getAllQuestionsAction() {
  try {
    const data = await sql`
      SELECT 
        qb.id,
        qb.question_text,
        qb.type,
        qb.explanation,
        c.name as category_name,
        qb.created_at,
        qb.updated_at
      FROM question_bank qb
      JOIN categories c ON qb.category_id = c.id
      WHERE qb.is_deleted = false OR qb.is_deleted IS NULL
      ORDER BY qb.updated_at DESC
    `
    return data
  } catch (error) {
    console.error("Error fetching all questions:", error)
    throw new Error("Could not fetch all questions")
  }
}

export async function getCategoriesAction() {
  try {
    const data = await sql`
      SELECT id, name
      FROM categories
      WHERE (is_deleted = false OR is_deleted IS NULL)
        AND id <> 1
      ORDER BY name ASC;
    `
    return data
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Could not fetch categories")
  }
}

export async function createQuestionAction(questionData: any) {
  try {
    const {
      questionText,
      categoryId,
      type,
      options,
      correctAnswer,
      explanation,
      creatorId,
    } = questionData

    // Sanitize: escape HTML and trim
    const sanitizedQuestionText =
      questionText
        ?.trim()
        .replace(/[<>]/g, (char: string) => (char === "<" ? "&lt;" : "&gt;")) ||
      ""
    const sanitizedOptions = Array.isArray(options)
      ? options.map((opt: string) =>
          opt
            .trim()
            .replace(/[<>]/g, (char: string) =>
              char === "<" ? "&lt;" : "&gt;"
            )
        )
      : []
    const sanitizedExplanation =
      explanation
        ?.trim()
        .replace(/[<>]/g, (char: string) => (char === "<" ? "&lt;" : "&gt;")) ||
      null

    const insertedQuestions = await sql`
      INSERT INTO question_bank (
      question_text, 
      category_id, 
      type, 
      options, 
      correct_answer,
      explanation,
      creator_id)
      VALUES (
      ${sanitizedQuestionText}, 
      ${categoryId}, 
      ${type}, 
      ${JSON.stringify(sanitizedOptions)}, 
      ${JSON.stringify(correctAnswer)},
      ${sanitizedExplanation},
      ${creatorId})
      RETURNING *;
    `
    return {
      success: true,
      message: "Question created successfully",
      data: insertedQuestions[0],
    }
  } catch (error) {
    console.error("Error creating question:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not create question: ${errorMessage}`)
  }
}

export async function getQuestionByIdAction(
  id: string
): Promise<FullQuestionType | undefined> {
  try {
    const data = await sql`
      SELECT * FROM question_bank WHERE id = ${id} LIMIT 1;
    `
    return data[0] as FullQuestionType | undefined // trả về row duy nhất (nếu có)
  } catch (error) {
    console.error("Error fetching question by ID:", error)
    throw new Error("Could not fetch question by ID")
  }
}

export async function updateQuestionAction(id: string, questionData: any) {
  try {
    const {
      questionText,
      categoryId,
      type,
      options,
      correctAnswer,
      explanation,
    } = questionData

    // Sanitize: escape HTML and trim
    const sanitizedQuestionText =
      questionText
        ?.trim()
        .replace(/[<>]/g, (char: string) => (char === "<" ? "&lt;" : "&gt;")) ||
      ""
    const sanitizedOptions = Array.isArray(options)
      ? options.map((opt: string) =>
          opt
            .trim()
            .replace(/[<>]/g, (char: string) =>
              char === "<" ? "&lt;" : "&gt;"
            )
        )
      : []
    const sanitizedExplanation =
      explanation
        ?.trim()
        .replace(/[<>]/g, (char: string) => (char === "<" ? "&lt;" : "&gt;")) ||
      null

    const updatedQuestions = await sql`
      UPDATE question_bank
      SET 
        question_text = ${sanitizedQuestionText},
        category_id = ${categoryId},
        type = ${type},
        options = ${JSON.stringify(sanitizedOptions)},
        correct_answer = ${JSON.stringify(correctAnswer)},
        explanation = ${sanitizedExplanation},
        updated_at = NOW()
      WHERE id = ${id}  
      RETURNING *;
    `
    return {
      success: true,
      message: "Question updated successfully",
      data: updatedQuestions[0],
    }
  } catch (error) {
    console.error("Error updating question:", error)
    throw new Error("Could not update question")
  }
}

export async function deleteQuestionAction(
  id: string
): Promise<ServiceResponse> {
  try {
    const result = await sql`
      UPDATE question_bank
      SET is_deleted = true, deleted_at = NOW()
      WHERE id = ${id};
    `
    return {
      success: true,
      message: "Question deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting question:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `Failed to delete question: ${errorMessage}`,
    }
  }
}
