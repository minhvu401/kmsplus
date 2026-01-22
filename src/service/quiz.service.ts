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

export type QuizAttempt = {
  id: number,
  quiz_id: number,
  user_id: number,
  attempt_number: number,
  status: 'in_progress' | 'completed' | 'abandoned',
  score: number | null,
  total_questions: number,
  correct_answers: number | null,
  time_spent_seconds: number | null,
  started_at: Date,
  submitted_at: Date | null,
}

export type Question = {
  id: number;
  question_text: string;
  type: 'single_choice' | 'multiple_choice';
  options: string[];
};

type AttemptRow = {
  id: number;
  status: 'in_progress' | 'submitted';
  started_at: Date;
}

type AttemptStats = {
  correct_answers: number;
  score: number;
}

type QuestionRow = {
  type: 'single_choice' | 'multiple_choice';
  correct_answer: any;
};

export type QuestionResult = {
  id: number;
  questionText: string;
  type: 'single_choice' | 'multiple_choice';
  options: string[];
  selectedAnswers: number[];      // indexes
  correctAnswers: number[];       // indexes
  explanation?: string | null;
};

export type AttemptResult = {
  title: string;
  attempt_number: number;
  time_spent_seconds: number;
  score: number;
  //   total_score: number;
  //   passed: boolean;
  questions: QuestionResult[];
};

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
 * Lấy danh sách câu hỏi cho một lần làm bài
 * NhatTT
 */
export async function getQuestionsForAttemptAction(attemptId: number) {
  try {
    const rows = await sql`
      SELECT q.id, q.question_text, q.type, q.options, q.time_limit
      FROM questions q
      INNER JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
      WHERE qa.id = ${attemptId}
      ORDER BY q.id ASC
    `
    return rows as Question[]
  } catch (error) {
    console.error("getQuestionsForAttemptAction error:", error)
    throw new Error("Failed to fetch questions for attempt")
  }
}

/**
 * Lấy các câu trả lời đã lưu cho một lần làm bài
 * NhatTT
 */
export async function getSavedAnswersAction(attemptId: number) {
  try {
    const rows = await sql`
      SELECT question_id, selected_option_id
      FROM attempt_answers
      WHERE attempt_id = ${attemptId}
    `
    return rows as Array<{ question_id: number; selected_option_id: any }>
  } catch (error) {
    console.error("getSavedAnswersAction error:", error)
    throw new Error("Failed to fetch saved answers")
  }
}

// NhatTT
export async function getTimeLimitForAttemptAction(attemptId: number) {
  try {
    const rows = await sql`
      SELECT q.time_limit_minutes
      FROM quizzes q
      INNER JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE qa.id = ${attemptId}
    `
    return rows.length > 0 ? rows[0].time_limit_minutes : null
  } catch (error) {
    console.error("getTimeLimitForAttemptAction error:", error)
    throw new Error("Failed to fetch time limit for attempt")
  }
}

// NhatTT
export async function startQuizAttemptAction(quizId: number, userId: number) {
  try {
    await sql`BEGIN`

    // Get current attempt count
    const attempts = await sql`
      SELECT COUNT(*) as count
      FROM quiz_attempts
      WHERE quiz_id = ${quizId} AND user_id = ${userId}
    `
    const attemptNumber = (attempts[0].count as number) + 1

    // Create new attempt
    const result = await sql`
      INSERT INTO quiz_attempts (quiz_id, user_id, attempt_number, status, started_at)
      VALUES (${quizId}, ${userId}, ${attemptNumber}, 'in_progress', NOW())
      RETURNING *
    `

    await sql`COMMIT`
    return result[0] as QuizAttempt
  } catch (error) {
    await sql`ROLLBACK`
    console.error("startQuizAttemptAction error:", error)
    throw new Error("Failed to start quiz attempt")
  }
}

/**
 * Lưu câu trả lời của người dùng
 */
// NhatTT
export async function saveAttemptAnswerAction(
  attemptId: number,
  questionId: number,
  selectedOptionId: number | number[]
) {
  try {
    const selectedOptionIdJson = Array.isArray(selectedOptionId)
      ? JSON.stringify(selectedOptionId)
      : String(selectedOptionId)

    await sql`
      INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id)
      VALUES (${attemptId}, ${questionId}, ${selectedOptionIdJson})
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET selected_option_id = ${selectedOptionIdJson}
    `

    return true
  } catch (error) {
    console.error("saveAttemptAnswerAction error:", error)
    throw new Error("Failed to save attempt answer")
  }
}

/**
 * Nộp bài thi và tính điểm
 */
// NhatTT
export async function submitQuizAttemptAction(attemptId: number) {
  try {
    await sql`BEGIN`

    // Get attempt with quiz info
    const attemptRows = await sql`
      SELECT qa.id, qa.quiz_id, q.passing_score, q.id as quiz_id_check
      FROM quiz_attempts qa
      INNER JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = ${attemptId}
    `

    if (attemptRows.length === 0) {
      throw new Error("Attempt not found")
    }

    const quizId = attemptRows[0].quiz_id as number

    // Count total questions
    const totalRows = await sql`
      SELECT COUNT(*) as count FROM questions WHERE quiz_id = ${quizId}
    `
    const totalQuestions = totalRows[0].count as number

    // Count correct answers
    const correctRows = await sql`
      SELECT COUNT(*) as count
      FROM attempt_answers aa
      INNER JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = ${attemptId}
      AND aa.selected_option_id = q.correct_answer::text
    `
    const correctAnswers = correctRows[0].count as number

    // Calculate score
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Update attempt
    const result = await sql`
      UPDATE quiz_attempts
      SET 
        status = 'completed',
        submitted_at = NOW(),
        correct_answers = ${correctAnswers},
        score = ${score},
        time_spent_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
      WHERE id = ${attemptId}
      RETURNING *
    `

    await sql`COMMIT`
    return result[0] as QuizAttempt
  } catch (error) {
    await sql`ROLLBACK`
    console.error("submitQuizAttemptAction error:", error)
    throw new Error("Failed to submit quiz attempt")
  }
}

/**
 * Lấy kết quả chi tiết của một lần làm bài
 */
// NhatTT
export async function getAttemptResultAction(attemptId: number): Promise<AttemptResult> {
  try {
    // Get attempt info
    const attemptRows = await sql`
      SELECT qa.id, qa.quiz_id, qa.attempt_number, qa.score, qa.time_spent_seconds, q.title
      FROM quiz_attempts qa
      INNER JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = ${attemptId}
    `

    if (attemptRows.length === 0) {
      throw new Error("Attempt not found")
    }

    const attempt = attemptRows[0] as any
    const quizId = attempt.quiz_id as number

    // Get all questions with their answers
    const questionsRows = await sql`
      SELECT 
        q.id,
        q.question_text,
        q.type,
        q.options,
        q.correct_answer,
        q.explanation,
        aa.selected_option_id
      FROM questions q
      LEFT JOIN attempt_answers aa ON q.id = aa.question_id AND aa.attempt_id = ${attemptId}
      WHERE q.quiz_id = ${quizId}
      ORDER BY q.id ASC
    `

    const questions: QuestionResult[] = questionsRows.map((row: any) => {
      const options = Array.isArray(row.options) ? row.options : JSON.parse(row.options)
      const correctAnswer = Array.isArray(row.correct_answer)
        ? row.correct_answer
        : JSON.parse(row.correct_answer)
      const selectedAnswer = row.selected_option_id
        ? Array.isArray(row.selected_option_id)
          ? row.selected_option_id
          : JSON.parse(row.selected_option_id)
        : []

      return {
        id: row.id as number,
        questionText: row.question_text as string,
        type: row.type as 'single_choice' | 'multiple_choice',
        options,
        selectedAnswers: Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer],
        correctAnswers: Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer],
        explanation: row.explanation,
      }
    })

    return {
      title: attempt.title,
      attempt_number: attempt.attempt_number,
      time_spent_seconds: attempt.time_spent_seconds || 0,
      score: attempt.score || 0,
      questions,
    }
  } catch (error) {
    console.error("getAttemptResultAction error:", error)
    throw new Error("Failed to fetch attempt result")
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

