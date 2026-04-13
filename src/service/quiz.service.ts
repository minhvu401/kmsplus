// Quiz Service
"use server"

import { sql } from "@/lib/database"
import { updateProgressService } from "@/service/progress.service"

// Quiz Question Type
export type Question = {
  id: number
  question_text: string
  type: "single_choice" | "multiple_choice"
  options: string[]
  time_limit?: number
}

export type AttemptMeta = {
  attempt_number: number
}

// Quiz Attempt Type
export type QuizAttempt = {
  id: number
  curriculum_item_id: number
  user_id: number
  attempt_number: number
  status: "in_progress" | "submitted"
  started_at: Date
  submitted_at?: Date
  correct_answers?: number
  score?: number
  time_spent_seconds?: number
}

type AttemptRow = {
  id: number
  status: "in_progress" | "submitted"
  started_at: Date
  total_questions: number | null
  curriculum_item_id: number
  course_id: number
  passing_score: number
  time_limit_minutes: number | null
}

type AttemptStats = {
  correct_answers: number
}

type QuestionRow = {
  type: "single_choice" | "multiple_choice"
  correct_answer: unknown
}

const toNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((v) => Number(v)).filter(Number.isFinite))]
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? [value] : []
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return toNumberArray(parsed)
    } catch {
      const asNumber = Number(value)
      return Number.isFinite(asNumber) ? [asNumber] : []
    }
  }

  if (value && typeof value === "object" && "correct" in value) {
    return toNumberArray((value as { correct: unknown }).correct)
  }

  return []
}

const normalizeCorrectAnswer = (value: unknown): number[] => {
  return toNumberArray(value)
}

const normalizeSelectedAnswer = (
  value: number | number[]
): number[] => {
  const raw = Array.isArray(value) ? value : [value]
  return [...new Set(raw.map((v) => Number(v)).filter(Number.isFinite))].sort(
    (a, b) => a - b
  )
}

const isSameAnswerSet = (selected: number[], correct: number[]): boolean => {
  if (selected.length !== correct.length) return false
  const selectedSet = new Set(selected)
  return correct.every((value) => selectedSet.has(value))
}

// Question Result Type (for quiz results)
export type QuestionResult = {
  id: number
  questionText: string
  type: "single_choice" | "multiple_choice"
  options: string[]
  selectedAnswers: number[]
  correctAnswers: number[]
  explanation?: string
}

// Attempt Result Type
export type AttemptResult = {
  id?: number // Add attemptId for AI explanation
  title: string
  attempt_number: number
  time_spent_seconds: number
  score: number
  passing_score: number
  questions: QuestionResult[]
}

export type AttemptHistoryItem = {
  id: number
  attempt_number: number
  status: "passed" | "failed" | "in_progress"
  score: number | null
}

export type AttemptHistorySummary = {
  max_attempts: number | null
  attempts_used: number
  attempts_left: number | null
  attempts: AttemptHistoryItem[]
}

// 1. Định nghĩa Type đầy đủ
export type Quiz = {
  id: number
  course_id: number
  category_id?: number | null // Category from associated course
  category_name?: string | null // Category name from associated course
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
  question_count?: number // Bổ sung field này vì query có lấy
}

type GetAllQuizzesParams = {
  query?: string
  page?: number
  limit?: number
  course_id?: number
  category_id?: number | "All" // Filter by category
}

// Định nghĩa kết quả trả về cho hàm get all
export type GetAllQuizzesResult = {
  success: boolean
  data?: Quiz[]
  total?: number
  error?: string
}

/**
 * Lấy danh sách bài thi có phân trang và tìm kiếm.
 */
export async function getAllQuizzesAction(
  params: GetAllQuizzesParams = {} // Gán giá trị mặc định là rỗng
): Promise<GetAllQuizzesResult> {
  try {
    const { query = "", page = 1, limit = 100, course_id } = params
    const offset = (page - 1) * limit

    // Xử lý điều kiện lọc
    // Lưu ý: Cú pháp ILIKE và %${query}% phụ thuộc vào lib DB,
    // ở đây viết theo chuẩn chung dùng template literal.

    // Câu query lấy dữ liệu
    const quizzes = await sql`
      SELECT 
        q.id, 
        q.course_id,
        q.title, 
        q.description,
        q.time_limit_minutes,
        q.passing_score,
        q.max_attempts,
        q.available_from,
        q.available_until,
        q.created_at,
        q.updated_at,
        (
          SELECT COUNT(*) 
          FROM quiz_questions qq 
          WHERE qq.quiz_id = q.id
        ) as question_count
      FROM quizzes q
      WHERE q.is_deleted = false
      ${course_id ? sql`AND q.course_id = ${course_id}` : sql``}
      ${query ? sql`AND q.title ILIKE ${"%" + query + "%"}` : sql``}
      ORDER BY q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Câu query đếm tổng số lượng (để phân trang)
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM quizzes q
      WHERE q.is_deleted = false
      ${course_id ? sql`AND q.course_id = ${course_id}` : sql``}
      ${query ? sql`AND q.title ILIKE ${"%" + query + "%"}` : sql``}
    `

    const total = Number(countResult[0].total)

    return {
      success: true,
      data: quizzes.map((quiz) => ({
        ...quiz,
        // Sửa lỗi mapping: DB trả về time_limit_minutes, không phải time_limit
        time_limit_minutes: quiz.time_limit_minutes,
        question_count: Number(quiz.question_count) || 0,
      })) as Quiz[],
      total,
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
    // Nên return null hoặc throw tùy theo cách xử lý ở UI
    return null
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
    // Không cần BEGIN/COMMIT nếu chỉ có 1 lệnh INSERT đơn lẻ,
    // trừ khi thư viện DB yêu cầu bắt buộc.

    const result = await sql`
      INSERT INTO quizzes (
        course_id, 
        title, 
        description, 
        time_limit_minutes, 
        passing_score, 
        max_attempts,
        is_deleted,
        created_at,
        updated_at
      ) VALUES (
        ${data.course_id}, 
        ${data.title}, 
        ${data.description || null}, 
        ${data.time_limit_minutes || null}, 
        ${data.passing_score || 70}, 
        ${data.max_attempts || 3},
        false,
        NOW(),
        NOW()
      ) RETURNING *
    `

    return result[0] as Quiz
  } catch (err) {
    console.error("createQuizAction failed:", err)
    console.error("createQuizAction failed:", err)
    throw new Error("Failed to create quiz")
  }
}

/**
 * Cập nhật một bài thi.
 * FIX: Sử dụng logic update an toàn hơn, tránh nối chuỗi SQL thủ công dễ gây lỗi.
 */
export async function updateQuizAction(
  id: number,
  data: Partial<Omit<Quiz, "id" | "created_at" | "updated_at">>
) {
  try {
    // Cách an toàn nhất với Tagged Templates là Update từng trường
    // hoặc sử dụng helper của thư viện nếu có.
    // Dưới đây là cách dùng COALESCE hoặc logic update thông dụng:

    // Lấy dữ liệu cũ trước (để đảm bảo tính toàn vẹn nếu cần)
    // Tuy nhiên, cách đơn giản nhất là viết câu lệnh UPDATE set từng field
    // nếu giá trị đó tồn tại trong object data.

    // Lưu ý: Cú pháp này giả định thư viện `sql` hỗ trợ dynamic fragments
    // (như postgres.js hoặc neon). Nếu dùng vercel/postgres, bạn phải viết query tĩnh
    // hoặc dùng COALESCE.

    const result = await sql`
      UPDATE quizzes
      SET 
        title = ${data.title !== undefined ? data.title : sql`title`},
        description = ${data.description !== undefined ? data.description : sql`description`},
        time_limit_minutes = ${data.time_limit_minutes !== undefined ? data.time_limit_minutes : sql`time_limit_minutes`},
        passing_score = ${data.passing_score !== undefined ? data.passing_score : sql`passing_score`},
        max_attempts = ${data.max_attempts !== undefined ? data.max_attempts : sql`max_attempts`},
        available_from = ${data.available_from !== undefined ? data.available_from : sql`available_from`},
        available_until = ${data.available_until !== undefined ? data.available_until : sql`available_until`},
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

// -------------- NhatTT -----------------------

// NhatTT
export async function startQuizAttemptAction(
  curriculum_item_id: number,
  user_id: number,
  total_questions: number
): Promise<QuizAttempt> {
  try {
    // Check for existing in-progress attempt
    const existingAttempt = await sql`
          SELECT * FROM quiz_attempts
          WHERE curriculum_item_id = ${curriculum_item_id} AND user_id = ${user_id} AND status = 'in_progress'
          LIMIT 1
      `
    if (existingAttempt.length > 0) {
      return existingAttempt[0] as QuizAttempt
    }

    // Validate: User must complete all lessons before this quiz
    // Get the course and section of this quiz
    const quizItemInfo = await sql`
      SELECT ci.section_id, s.course_id
      FROM curriculum_items ci
      JOIN sections s ON s.id = ci.section_id
      WHERE ci.id = ${curriculum_item_id}
      LIMIT 1
    `

    if (quizItemInfo.length === 0) {
      throw new Error("Quiz not found")
    }

    const { section_id: sectionId, course_id: courseId } = quizItemInfo[0]

    // Get all lesson items in the same course (before this quiz)
    const allLessons = await sql`
      SELECT DISTINCT ci.id
      FROM curriculum_items ci
      JOIN sections s ON s.id = ci.section_id
      WHERE s.course_id = ${courseId} 
        AND ci.type = 'lesson'
    `

    if (allLessons.length > 0) {
      // Check if user has completed all lessons
      const userEnrollment = await sql`
        SELECT completed_item_ids
        FROM enrollments
        WHERE user_id = ${user_id} AND course_id = ${courseId}
        LIMIT 1
      `

      if (userEnrollment.length > 0) {
        let completedIds: number[] = []
        const completedData = userEnrollment[0].completed_item_ids

        // Parse completed_item_ids
        if (Array.isArray(completedData)) {
          completedIds = completedData.map((id) => Number(id))
        } else if (typeof completedData === "string") {
          try {
            const parsed = JSON.parse(completedData)
            completedIds = Array.isArray(parsed)
              ? parsed.map((id) => Number(id))
              : []
          } catch {
            completedIds = []
          }
        }

        // Check if all lessons are completed
        const allLessonIds = allLessons.map((l) => Number(l.id))
        const allCompleted = allLessonIds.every((id) =>
          completedIds.includes(id)
        )

        if (!allCompleted) {
          throw new Error(
            "You must complete all lessons before taking this quiz"
          )
        }
      }
    }

    const quizResult = await sql`
          SELECT q.max_attempts
          FROM curriculum_items ci
          JOIN quizzes q ON q.id = ci.quiz_id
          WHERE ci.id = ${curriculum_item_id}
      `

    if (quizResult.length === 0) {
      throw new Error("Quiz not found")
    }

    const { max_attempts } = quizResult[0]

    if (max_attempts !== null) {
      const attemptCount = await sql`
              SELECT COUNT(*)::int AS count
              FROM quiz_attempts
            WHERE curriculum_item_id = ${curriculum_item_id}
                  AND user_id = ${user_id};
          `

      if (attemptCount[0].count >= max_attempts) {
        throw new Error(
          "You have reached the maximum number of attempts for this quiz."
        )
      }
    }

    // Create new attempt if not
    const newAttempt = await sql`
          INSERT INTO quiz_attempts (
              curriculum_item_id,
              user_id, 
              attempt_number,
              total_questions
          ) VALUES (
              ${curriculum_item_id},
              ${user_id},
              (
                  SELECT COALESCE(MAX(attempt_number), 0) + 1
                  FROM quiz_attempts
                  WHERE curriculum_item_id = ${curriculum_item_id}
                  AND user_id = ${user_id}
              ),
              ${total_questions}
          )
          RETURNING *
      `
    return newAttempt[0] as QuizAttempt
  } catch (error) {
    console.error("startQuizAttemptAction error:", error)
    throw error
  }
}

/**
 * Nộp bài thi và tính điểm
 */
// NhatTT
export async function submitQuizAttemptAction(
  attemptId: number,
  userId: number
) {
  try {
    // 1️⃣ Begin transaction
    await sql`BEGIN`

    // 2️⃣ Lock attempt
    const attemptResult = (await sql`
        SELECT
          qa.id,
          qa.status,
          qa.started_at,
          qa.total_questions,
          qa.curriculum_item_id,
          s.course_id,
          q.passing_score,
          q.time_limit_minutes
        FROM quiz_attempts qa
        JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
        JOIN sections s ON s.id = ci.section_id
        JOIN quizzes q ON q.id = ci.quiz_id
        WHERE qa.id = ${attemptId}
          AND qa.user_id = ${userId}
        FOR UPDATE;
      `) as AttemptRow[]

    if (attemptResult.length === 0) {
      throw new Error("Attempt not found")
    }

    if (attemptResult[0].status !== "in_progress") {
      throw new Error("Attempt already submitted")
    }

    // 3️⃣ Calculate stats
    const stats = (await sql`
        SELECT
        COUNT(*) FILTER (WHERE is_correct = true) AS correct_answers
        FROM attempt_answers
        WHERE attempt_id = ${attemptId};
      `) as AttemptStats[]

    const correct_answers = Number(stats[0]?.correct_answers ?? 0)

    // Score is always out of 100. Each question is worth 100/total_questions.
    let totalQuestions = Number(attemptResult[0]?.total_questions ?? 0)
    if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) {
      const countRows = await sql`
        SELECT COUNT(*)::int AS total_questions
        FROM quiz_attempts qa
        JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
        JOIN quiz_questions qq ON qq.quiz_id = ci.quiz_id
        WHERE qa.id = ${attemptId};
      `
      totalQuestions = Number(countRows[0]?.total_questions ?? 0)
    }
    const score =
      totalQuestions > 0
        ? Math.round((correct_answers * 100) / totalQuestions)
        : 0

    const courseId = Number(attemptResult[0].course_id)
    const curriculumItemId = Number(attemptResult[0].curriculum_item_id)
    const passingScore = Number(attemptResult[0].passing_score ?? 0)
    const isPassed = score >= passingScore
    const timeLimitMinutesRaw = attemptResult[0].time_limit_minutes
    const timeLimitSeconds =
      timeLimitMinutesRaw === null
        ? null
        : Math.max(0, Number(timeLimitMinutesRaw) * 60)

    // 4️⃣ Finalize attempt
    const updated = await sql`
            UPDATE quiz_attempts
            SET
            status = 'submitted',
            submitted_at = CURRENT_TIMESTAMP,
            correct_answers = ${correct_answers},
            score = ${score},
            time_spent_seconds = CASE
              WHEN ${timeLimitSeconds}::int IS NULL THEN
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::int
              ELSE
                LEAST(
                  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::int,
                  ${timeLimitSeconds}::int
                )
            END
            WHERE id = ${attemptId}
            RETURNING *;
        `

    // 5️⃣ Commit
    await sql`COMMIT`

    // 6️⃣ Auto-complete quiz item on pass and refresh enrollment progress.
    if (isPassed) {
      const progressResult = await updateProgressService(
        userId,
        courseId,
        curriculumItemId,
        "quiz"
      )

      if (!progressResult.success) {
        console.warn(
          `[submitQuizAttemptAction] Attempt ${attemptId} submitted but failed to update enrollment progress for user ${userId} and course ${courseId}.`
        )
      }
    }

    return updated[0]
  } catch (error) {
    // 7️⃣ Rollback on failure
    await sql`ROLLBACK`
    console.error("submitQuizAttemptAction error:", error)
    throw error
  }
}

/**
 * Lưu câu trả lời của người dùng
 */
// NhatTT
export async function saveAttemptAnswerAction(
  attemptId: number,
  userId: number,
  questionId: number,
  selectedAnswer: number | number[]
) {
  try {
    // 1️⃣ Verify attempt is valid and active
    const attempt = await sql`
      SELECT 
        qa.id,
        qa.status,
        q.time_limit_minutes,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - qa.started_at))::int AS elapsed_seconds
      FROM quiz_attempts
      qa
      JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
      JOIN quizzes q ON q.id = ci.quiz_id
      WHERE qa.id = ${attemptId}
          AND qa.user_id = ${userId};
    `

    if (attempt.length === 0) {
      throw new Error("Attempt not found")
    }

    if (attempt[0].status !== "in_progress") {
      throw new Error("Cannot answer a submitted attempt")
    }

    const timeLimitMinutes = attempt[0].time_limit_minutes
    const elapsedSeconds = Number(attempt[0].elapsed_seconds || 0)
    const isExpired =
      timeLimitMinutes !== null &&
      Number(timeLimitMinutes) > 0 &&
      elapsedSeconds >= Number(timeLimitMinutes) * 60

    if (isExpired) {
      try {
        await submitQuizAttemptAction(attemptId, userId)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to auto-submit"
        if (!message.includes("Attempt already submitted")) {
          throw error
        }
      }

      throw new Error("Time limit exceeded. Attempt was auto-submitted")
    }

    // 2️⃣ Load question data
    const questionResult = (await sql`
    SELECT type, correct_answer
    FROM question_bank
    WHERE id = ${questionId}
      AND is_deleted = false;
  `) as QuestionRow[]

    if (questionResult.length === 0) {
      throw new Error("Question not found")
    }

    const { type, correct_answer } = questionResult[0]

    // 3️⃣ Normalize both selected answer and correct answer to numeric index arrays.
    const normalizedSelected = normalizeSelectedAnswer(selectedAnswer)
    const answerToStore =
      type === "single_choice"
        ? normalizedSelected.slice(0, 1)
        : normalizedSelected
    const normalizedCorrect = normalizeCorrectAnswer(correct_answer).sort(
      (a, b) => a - b
    )

    // 4️⃣ Determine correctness based on exact set match.
    const isCorrect = isSameAnswerSet(answerToStore, normalizedCorrect)

    // 5️⃣ Calculate points
    const pointsEarned = isCorrect ? 1 : 0

    // 6️⃣ UPSERT answer
    await sql`
      INSERT INTO attempt_answers (
        attempt_id,
        question_id,
        selected_option_id,
        is_correct,
        points_earned
      )
      VALUES (
        ${attemptId},
        ${questionId},
        ${JSON.stringify(answerToStore)},
        ${isCorrect},
        ${pointsEarned}
      )
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET
        selected_option_id = EXCLUDED.selected_option_id,
        is_correct = EXCLUDED.is_correct,
        points_earned = EXCLUDED.points_earned,
        answered_at = CURRENT_TIMESTAMP;
    `
  } catch (error) {
    console.error("saveAttemptAnswerAction error:", error)
    throw error
  }
}

/**
 * Heartbeat cập nhật thời gian làm bài định kỳ cho attempt đang diễn ra.
 */
export async function saveAttemptHeartbeatAction(
  attemptId: number,
  userId: number
) {
  try {
    const rows = await sql`
      UPDATE quiz_attempts
      SET time_spent_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::int
      WHERE id = ${attemptId}
        AND user_id = ${userId}
        AND status = 'in_progress'
      RETURNING id;
    `

    return { success: rows.length > 0 }
  } catch (error) {
    console.error("saveAttemptHeartbeatAction error:", error)
    throw error
  }
}

/**
 * Lấy danh sách câu hỏi cho một lần làm bài
 * NhatTT
 */
export async function getQuestionsForAttemptAction(attemptId: number) {
  try {
    const rows = await sql`
      SELECT qb.id, qb.question_text, qb.type, qb.options
      FROM quiz_attempts qa
      JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
      JOIN quiz_questions qq ON qq.quiz_id = ci.quiz_id
      JOIN question_bank qb ON qb.id = qq.question_id
      WHERE qa.id = ${attemptId} AND qb.is_deleted = FALSE
      ORDER BY qq.question_order, qb.id
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
      SELECT
        question_id,
        selected_option_id
      FROM attempt_answers
      WHERE attempt_id = ${attemptId};
    `
    return rows as Array<{ question_id: number; selected_option_id: any }>
  } catch (error) {
    console.error("getSavedAnswersAction error:", error)
    throw new Error("Failed to fetch saved answers")
  }
}

// Fetch basic attempt info (used for UI headers)
export async function getAttemptMetaAction(
  attemptId: number,
  userId: number
): Promise<AttemptMeta> {
  try {
    const rows = await sql`
      SELECT attempt_number
      FROM quiz_attempts
      WHERE id = ${attemptId} AND user_id = ${userId}
      LIMIT 1;
    `

    if (rows.length === 0) {
      throw new Error("Attempt not found")
    }

    return { attempt_number: Number(rows[0].attempt_number) }
  } catch (error) {
    console.error("getAttemptMetaAction error:", error)
    throw error
  }
}

// NhatTT
export async function getTimeLimitForAttemptAction(attemptId: number) {
  try {
    const rows = await sql`
        SELECT 
          q.time_limit_minutes,
          CASE
            WHEN qa.status = 'submitted' THEN COALESCE(
              qa.time_spent_seconds,
              EXTRACT(EPOCH FROM (COALESCE(qa.submitted_at, CURRENT_TIMESTAMP) - qa.started_at))::int
            )
            ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - qa.started_at))::int
          END as elapsed_seconds
        FROM quizzes q
        JOIN curriculum_items ci ON ci.quiz_id = q.id
        JOIN quiz_attempts qa ON qa.curriculum_item_id = ci.id
        WHERE qa.id = ${attemptId}
    `

    if (!rows[0]) return null

    const totalSeconds = (rows[0]?.time_limit_minutes || 0) * 60
    const spentSeconds = rows[0]?.elapsed_seconds || 0
    const remainingSeconds = Math.max(0, totalSeconds - spentSeconds)

    // Return remaining seconds, not minutes
    return remainingSeconds
  } catch (error) {
    console.error("getTimeLimitForAttemptAction error:", error)
    throw new Error("Failed to fetch time limit for attempt")
  }
}

// NhatTT
export async function getQuizByAttemptAction(attemptId: number): Promise<Quiz> {
  try {
    const result = await sql`
          SELECT q.*
          FROM quizzes q
          JOIN curriculum_items ci ON ci.quiz_id = q.id
          JOIN quiz_attempts qa ON qa.curriculum_item_id = ci.id
          WHERE qa.id = ${attemptId} AND q.deleted_at IS NULL
      `
    if (result.length === 0) {
      throw new Error("Quiz not found for this attempt")
    }
    return result[0] as Quiz
  } catch (error) {
    console.error("getQuizByAttemptAction error:", error)
    throw error
  }
}

/**
 * Lấy kết quả chi tiết của một lần làm bài
 */
// NhatTT
export async function getAttemptResultAction(
  attemptId: number
): Promise<AttemptResult> {
  try {
    // 1. Get attempt + quiz info
    const attemptResult = await sql`
      SELECT
        q.title,
        q.passing_score,
        qa.attempt_number,
        qa.time_spent_seconds,
        qa.score,
        qa.correct_answers,
        qa.total_questions
      FROM quiz_attempts qa
      JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
      JOIN quizzes q ON q.id = ci.quiz_id
      WHERE qa.id = ${attemptId} AND qa.status = 'submitted'
    `

    //   a.total_score,
    //   a.passed

    if (attemptResult.length === 0) {
      throw new Error("Attempt not found")
    }

    // 2. Get ALL questions for this quiz, with user's answers (if any)
    const quizId = (
      await sql`
    SELECT ci.quiz_id
    FROM quiz_attempts qa
    JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
    WHERE qa.id = ${attemptId}
  `
    )[0].quiz_id

    const questionResults = await sql`
    SELECT
      qb.id AS question_id,
      qb.question_text,
      qb.type,
      qb.options,
      aa.selected_option_id as selected_answers,
      qb.correct_answer as correct_answers,
      qb.explanation
    FROM quiz_questions qq
    JOIN question_bank qb ON qb.id = qq.question_id
    LEFT JOIN attempt_answers aa ON aa.question_id = qb.id AND aa.attempt_id = ${attemptId}
    WHERE qq.quiz_id = ${quizId}
      AND qb.is_deleted = false
    ORDER BY qq.question_order, qb.id
  `

    // Prefer percentage score out of 100 (each question = 100 / total_questions).
    // This also makes older attempts (that stored raw points like 6) display correctly.
    let totalQuestions = Number(attemptResult[0].total_questions ?? 0)
    if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) {
      const countRows = await sql`
      SELECT COUNT(*)::int AS total_questions
      FROM quiz_attempts qa
      JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
      JOIN quiz_questions qq ON qq.quiz_id = ci.quiz_id
      WHERE qa.id = ${attemptId};
    `
      totalQuestions = Number(countRows[0]?.total_questions ?? 0)
    }

    let correctAnswers = Number(attemptResult[0].correct_answers ?? 0)
    if (!Number.isFinite(correctAnswers) || correctAnswers < 0)
      correctAnswers = 0
    if (
      (correctAnswers === 0 && totalQuestions > 0) ||
      attemptResult[0].correct_answers == null
    ) {
      const statsRows = await sql`
      SELECT COUNT(*) FILTER (WHERE is_correct = true) AS correct_answers
      FROM attempt_answers
      WHERE attempt_id = ${attemptId};
    `
      correctAnswers = Number(statsRows[0]?.correct_answers ?? 0)
    }

    const computedScore =
      totalQuestions > 0
        ? Math.round((correctAnswers * 100) / totalQuestions)
        : Number(attemptResult[0].score ?? 0)

    return {
      id: attemptId, // Include attemptId for AI explanation
      title: attemptResult[0].title,
      attempt_number: attemptResult[0].attempt_number,
      time_spent_seconds: Number(attemptResult[0].time_spent_seconds ?? 0),
      score: Number.isFinite(computedScore) ? computedScore : 0,
      passing_score: Number(attemptResult[0].passing_score ?? 0),
      // total_score: attemptResult[0].total_score,
      // passed: attemptResult[0].passed,
      questions: questionResults.map((q) => ({
        id: q.question_id,
        questionText: q.question_text,
        type: q.type,
        options: q.options,
        selectedAnswers: toNumberArray(q.selected_answers),
        correctAnswers: normalizeCorrectAnswer(q.correct_answers),
        explanation: q.explanation,
      })),
    }
  } catch (error) {
    console.error("getAttemptResultAction error:", error)
    throw error
  }
}

/**
 * Lấy chi tiết quiz thông qua curriculum_item_id.
 */
export async function getQuizByCurriculumItemIdAction(
  curriculumItemId: number
) {
  try {
    const rows = await sql`
      SELECT q.*
      FROM curriculum_items ci
      JOIN quizzes q ON q.id = ci.quiz_id
      WHERE ci.id = ${curriculumItemId} AND q.is_deleted = FALSE
      LIMIT 1
    `
    return rows.length > 0 ? (rows[0] as Quiz) : null
  } catch (error) {
    console.error("getQuizByCurriculumItemIdAction error:", error)
    return null
  }
}

export async function getAttemptHistoryForCurriculumItemAction(
  curriculumItemId: number,
  userId: number
): Promise<AttemptHistorySummary> {
  try {
    const quizRows = await sql`
      SELECT q.max_attempts, q.passing_score
      FROM curriculum_items ci
      JOIN quizzes q ON q.id = ci.quiz_id
      WHERE ci.id = ${curriculumItemId} AND q.is_deleted = FALSE
      LIMIT 1
    `

    if (quizRows.length === 0) {
      return {
        max_attempts: null,
        attempts_used: 0,
        attempts_left: null,
        attempts: [],
      }
    }

    const maxAttempts =
      quizRows[0].max_attempts == null ? null : Number(quizRows[0].max_attempts)
    const passingScore = Number(quizRows[0].passing_score ?? 0)

    const attemptRows = await sql`
      SELECT
        id,
        attempt_number,
        status,
        score
      FROM quiz_attempts
      WHERE curriculum_item_id = ${curriculumItemId}
        AND user_id = ${userId}
      ORDER BY attempt_number DESC, started_at DESC
    `

    const attempts: AttemptHistoryItem[] = attemptRows.map((row) => {
      const rawScore = row.score == null ? null : Number(row.score)
      const mappedStatus: AttemptHistoryItem["status"] =
        row.status === "in_progress"
          ? "in_progress"
          : (rawScore ?? 0) >= passingScore
            ? "passed"
            : "failed"

      return {
        id: Number(row.id),
        attempt_number: Number(row.attempt_number),
        status: mappedStatus,
        score: rawScore,
      }
    })

    const attemptsUsed = attempts.length
    const attemptsLeft =
      maxAttempts == null ? null : Math.max(0, maxAttempts - attemptsUsed)

    return {
      max_attempts: maxAttempts,
      attempts_used: attemptsUsed,
      attempts_left: attemptsLeft,
      attempts,
    }
  } catch (error) {
    console.error("getAttemptHistoryForCurriculumItemAction error:", error)
    throw new Error("Failed to fetch attempt history")
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
 * - Xóa tất cả câu hỏi cũ
 * - Insert lại danh sách mới với ON CONFLICT DO UPDATE
 */
export async function updateQuizQuestionsAction(
  quizId: number,
  questionIds: number[]
) {
  try {
    // Xóa tất cả câu hỏi hiện tại của quiz
    await sql`
      DELETE FROM quiz_questions
      WHERE quiz_id = ${quizId}
    `

    if (questionIds.length === 0) {
      return true
    }

    // Insert từng câu hỏi với ON CONFLICT DO UPDATE
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
