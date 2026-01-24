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

export async function getQuizDetailsAction(id: number): Promise<Quiz> {
  const result = await sql`
        SELECT * 
        FROM quizzes
        WHERE id = ${id} AND is_deleted = FALSE
    `
  return result[0] as Quiz
}

export async function startQuizAttemptAction(quiz_id: number, user_id: number, total_questions: number): Promise<QuizAttempt> {
  // Check for existing in-progress attempt
  const existingAttempt = await sql`
        SELECT * FROM quiz_attempts
        WHERE quiz_id = ${quiz_id} AND user_id = ${user_id} AND status = 'in_progress'
        LIMIT 1
    `
  if (existingAttempt.length > 0) {
    return existingAttempt[0] as QuizAttempt;
  }

  const quizResult = await sql`
        SELECT max_attempts
        FROM quizzes
        WHERE id = ${quiz_id}
    `

  if (quizResult.length === 0) {
    throw new Error('Quiz not found');
  }

  const { max_attempts } = quizResult[0];

  if (max_attempts !== null) {
    const attemptCount = await sql`
            SELECT COUNT(*)::int AS count
            FROM quiz_attempts
            WHERE quiz_id = ${quiz_id}
                AND user_id = ${user_id};
        `;

    if (attemptCount[0].count >= max_attempts) {
      throw new Error('You have reached the maximum number of attempts for this quiz.');
    }
  }

  // Create new attempt if not
  const newAttempt = await sql`
        INSERT INTO quiz_attempts (
            quiz_id,
            user_id, 
            attempt_number,
            total_questions
        ) VALUES (
            ${quiz_id},
            ${user_id},
            (
                SELECT COALESCE(MAX(attempt_number), 0) + 1
                FROM quiz_attempts
                WHERE quiz_id = ${quiz_id}
                AND user_id = ${user_id}
            ),
            ${total_questions}
        )
        RETURNING *
    `
  return newAttempt[0] as QuizAttempt
}

export async function submitQuizAttemptAction(
  attemptId: number,
  userId: number
) {
  try {
    // 1️⃣ Begin transaction
    await sql`BEGIN`;

    // 2️⃣ Lock attempt
    const attemptResult = await sql`
            SELECT id, status, started_at
            FROM quiz_attempts
            WHERE id = ${attemptId}
                AND user_id = ${userId}
            FOR UPDATE;
        ` as AttemptRow[];

    if (attemptResult.length === 0) {
      throw new Error('Attempt not found');
    }

    if (attemptResult[0].status !== 'in_progress') {
      throw new Error('Attempt already submitted');
    }

    // 3️⃣ Calculate stats
    const stats = await sql`
            SELECT
            COUNT(*) FILTER (WHERE is_correct = true) AS correct_answers,
            COALESCE(SUM(points_earned), 0)          AS score
            FROM attempt_answers
            WHERE attempt_id = ${attemptId};
        ` as AttemptStats[];

    const { correct_answers, score } = stats[0];

    // 4️⃣ Finalize attempt
    const updated = await sql`
            UPDATE quiz_attempts
            SET
            status = 'submitted',
            submitted_at = CURRENT_TIMESTAMP,
            correct_answers = ${correct_answers},
            score = ${score},
            time_spent_seconds = EXTRACT(
            EPOCH FROM (CURRENT_TIMESTAMP - started_at)
            )::int
            WHERE id = ${attemptId}
            RETURNING *;
        `;

    // 5️⃣ Commit
    await sql`COMMIT`;

    return updated[0];

  } catch (error) {
    // 6️⃣ Rollback on failure
    await sql`ROLLBACK`;
    throw error;
  }
}

export async function saveAttemptAnswerAction(
  attemptId: number,
  userId: number,
  questionId: number,
  selectedAnswer: number | number[]
) {
  // 1️⃣ Verify attempt is valid and active
  const attempt = await sql`
    SELECT id, status
    FROM quiz_attempts
    WHERE id = ${attemptId}
        AND user_id = ${userId};
  `;

  if (attempt.length === 0) {
    throw new Error('Attempt not found');
  }

  if (attempt[0].status !== 'in_progress') {
    throw new Error('Cannot answer a submitted attempt');
  }

  // 2️⃣ Load question data
  const questionResult = (await sql`
    SELECT type, correct_answer
    FROM question_bank
    WHERE id = ${questionId}
      AND is_deleted = false;
  `) as QuestionRow[];

  if (questionResult.length === 0) {
    throw new Error('Question not found');
  }

  const { type, correct_answer } = questionResult[0];

  // 3️⃣ Determine correctness
  let isCorrect = false;

  if (type === 'single_choice') {
    isCorrect = selectedAnswer === correct_answer;

  } else if (type === 'multiple_choice') {

    const selectedArray = Array.isArray(selectedAnswer)
      ? selectedAnswer
      : [selectedAnswer];

    if (!Array.isArray(correct_answer)) {
      throw new Error('Invalid answer format');
    }

    const selectedSet = new Set(selectedArray);
    const correctSet = new Set(correct_answer);

    isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every(v => correctSet.has(v));
  }

  // 4️⃣ Calculate points
  const pointsEarned = isCorrect ? 1 : 0;

  // 5️⃣ UPSERT answer
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
      ${JSON.stringify(selectedAnswer)},
      ${isCorrect},
      ${pointsEarned}
    )
    ON CONFLICT (attempt_id, question_id)
    DO UPDATE SET
      selected_option_id = EXCLUDED.selected_option_id,
      is_correct = EXCLUDED.is_correct,
      points_earned = EXCLUDED.points_earned,
      answered_at = CURRENT_TIMESTAMP;
  `;
}

export async function getQuestionsForAttemptAction(attemptId: number): Promise<Question[]> {
  const result = await sql`
        SELECT qb.id, qb.question_text, qb.type, qb.options
        FROM question_bank qb
        JOIN quiz_questions qq ON qb.id = qq.question_id
        JOIN quiz_attempts qa ON qa.quiz_id = qq.quiz_id
        WHERE qa.id = ${attemptId} AND qb.is_deleted = FALSE
    `;
  return result as Question[];
}

export async function getTimeLimitForAttemptAction(attemptId: number): Promise<number | null> {
  const result = await sql`
        SELECT q.time_limit_minutes
        FROM quizzes q
        JOIN quiz_attempts qa ON qa.quiz_id = q.id
        WHERE qa.id = ${attemptId}
    `;
  return result[0]?.time_limit_minutes || null;
}

export async function getSavedAnswersAction(attemptId: number) {
  return sql`
    SELECT
      question_id,
      selected_option_id
    FROM attempt_answers
    WHERE attempt_id = ${attemptId};
  `;
}

export async function getQuizDetailsByAttemptAction(attemptId: number): Promise<Quiz> {
  const result = await sql`
        SELECT q.*
        FROM quizzes q
        JOIN quiz_attempts qa ON qa.quiz_id = q.id
        WHERE qa.id = ${attemptId} AND q.deleted_at IS NULL
    `;
  return result[0] as Quiz
}

export async function getAttemptResultAction(
  attemptId: number
): Promise<AttemptResult> {
  // 1. Get attempt + quiz info
  const attemptResult = await sql`
    SELECT
      q.title,
      qa.attempt_number,
      qa.time_spent_seconds,
      qa.score
    FROM quiz_attempts qa
    JOIN quizzes q ON q.id = qa.quiz_id
    WHERE qa.id = ${attemptId} AND qa.status = 'submitted'
  `;

  //   a.total_score,
  //   a.passed

  if (attemptResult.length === 0) {
    throw new Error('Attempt not found');
  }

  // 2. Get question-level results
  const questionResults = await sql`
    SELECT
      qb.id AS question_id,
      qb.question_text,
      qb.type,
      qb.options,
      aa.selected_option_id as selected_answers,
      qb.correct_answer as correct_answers,
      qb.explanation
    FROM attempt_answers aa
    JOIN question_bank qb ON qb.id = aa.question_id
    WHERE aa.attempt_id = ${attemptId}
    ORDER BY qb.id
  `;

  return {
    title: attemptResult[0].title,
    attempt_number: attemptResult[0].attempt_number,
    time_spent_seconds: attemptResult[0].time_spent_seconds,
    score: attemptResult[0].score,
    // total_score: attemptResult[0].total_score,
    // passed: attemptResult[0].passed,
    questions: questionResults.map((q) => ({
      id: q.question_id,
      questionText: q.question_text,
      type: q.type,
      options: q.options,
      selectedAnswers: q.selected_answers,
      correctAnswers: q.correct_answers,
      explanation: q.explanation,
    })),
  };
}