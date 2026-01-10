// @/service/quiz.service.ts
// Quiz Service - Chứa logic xử lý quiz
"use server"

import { sql } from "../lib/database"
import { revalidatePath } from "next/cache"

export type Quiz = {
  id: number
  course_id: number | null
  lesson_id: number | null
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
  // Computed field
  question_count?: number
}

/**
 * Lấy tất cả quiz
 */
type QuizFromDB = {
  id: number
  title: string
  description: string | null
  time_limit: number | null
  passing_score: number | null
  max_attempts: number | null
  question_count: string | number
}

type GetAllQuizzesResult = {
  success: boolean
  data?: Array<Omit<QuizFromDB, "question_count"> & { question_count: number }>
  error?: string
}

export async function getAllQuizzesAction(): Promise<GetAllQuizzesResult> {
  try {
    const result = await sql`
      SELECT 
        q.id, 
        q.title, 
        q.description,
        q.time_limit_minutes,
        q.passing_score,
        q.max_attempts,
        q.available_from,
        q.available_until,
        (
          SELECT COUNT(*) 
          FROM quiz_questions qq 
          WHERE qq.quiz_id = q.id
        ) as question_count
      FROM quizzes q
      WHERE q.is_deleted = false
      ORDER BY q.created_at DESC
    `

    return {
      success: true,
      data: result.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit,
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts,
        question_count: Number(quiz.question_count) || 0,
      })),
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return {
      success: false,
      error: "Failed to fetch quizzes",
    }
  }
}

/**
 * Lấy quiz theo ID
 */
export async function getQuizByIdAction(id: number) {
  try {
    const result = await sql`
      SELECT 
        id, 
        title, 
        description,
        time_limit_minutes,
        passing_score,
        max_attempts,
        (
          SELECT COUNT(*) 
          FROM quiz_questions qq 
          WHERE qq.quiz_id = quizzes.id
        ) as question_count
      FROM quizzes
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (result.length === 0) {
      return {
        success: false,
        error: "Quiz not found",
      }
    }

    return {
      success: true,
      data: {
        ...result[0],
        question_count: Number(result[0].question_count) || 0,
      },
    }
  } catch (error) {
    console.error(`Error fetching quiz ${id}:`, error)
    return {
      success: false,
      error: "Failed to fetch quiz",
    }
  }
}

/**
 * Attach quiz to lesson
 */
export async function attachQuizToLessonAction(
  quizId: number,
  lessonId: number
) {
  try {
    // Kiểm tra quiz tồn tại và published (giả sử có status, nhưng hiện tại không có, có thể thêm sau)
    const [quiz] = await sql`
      SELECT id FROM quizzes WHERE id = ${quizId} AND is_deleted = false
    `
    if (!quiz) {
      throw new Error("Quiz not found or not available")
    }

    // Kiểm tra lesson tồn tại
    const [lesson] = await sql`
      SELECT id FROM lessons WHERE id = ${lessonId} AND deleted_at IS NULL
    `
    if (!lesson) {
      throw new Error("Lesson not found")
    }

    // Update quiz với lesson_id
    await sql`
      UPDATE quizzes
      SET lesson_id = ${lessonId}, updated_at = NOW()
      WHERE id = ${quizId}
    `

    revalidatePath(`/lessons/${lessonId}`)
    return { success: true }
  } catch (error) {
    console.error("Error attaching quiz to lesson:", error)
    throw new Error("Failed to attach quiz to lesson")
  }
}

/**
 * Detach quiz from lesson
 */
export async function detachQuizFromLessonAction(quizId: number) {
  try {
    await sql`
      UPDATE quizzes
      SET lesson_id = NULL, updated_at = NOW()
      WHERE id = ${quizId}
    `

    return { success: true }
  } catch (error) {
    console.error("Error detaching quiz from lesson:", error)
    throw new Error("Failed to detach quiz from lesson")
  }
}

/**
 * Update quiz course_id
 */
export async function updateQuizCourseIdAction(
  quizId: number,
  courseId: number | null
) {
  try {
    await sql`
      UPDATE quizzes
      SET course_id = ${courseId}, updated_at = NOW()
      WHERE id = ${quizId}
    `
    return { success: true }
  } catch (error) {
    console.error("Error updating quiz course_id:", error)
    throw new Error("Failed to update quiz course_id")
  }
}
