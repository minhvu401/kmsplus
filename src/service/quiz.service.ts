// Quiz Service
"use server"

import { sql } from "@/lib/database"

// Quiz Question Type
export type Question = {
  id: number
  question_text: string
  type: "single_choice" | "multiple_choice"
  options: string[]
  time_limit?: number
}

// Quiz Attempt Type
export type QuizAttempt = {
  id: number
  quiz_id: number
  user_id: number
  attempt_number: number
  status: "in_progress" | "completed"
  started_at: Date
  submitted_at?: Date
  correct_answers?: number
  score?: number
  time_spent_seconds?: number
}

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
  title: string
  attempt_number: number
  time_spent_seconds: number
  score: number
  questions: QuestionResult[]
}

// 1. Định nghĩa Type đầy đủ
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
  question_count?: number // Bổ sung field này vì query có lấy
}

type GetAllQuizzesParams = {
  query?: string
  page?: number
  limit?: number
  course_id?: number
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
export async function startQuizAttemptAction(quiz_id: number, user_id: number, total_questions: number): Promise<QuizAttempt> {
  try {
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
  } catch (error) {
    console.error("startQuizAttemptAction error:", error);
    throw error;
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
    console.error("submitQuizAttemptAction error:", error);
    throw error;
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
  } catch (error) {
    console.error("saveAttemptAnswerAction error:", error);
    throw error;
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
        FROM question_bank qb
        JOIN quiz_questions qq ON qb.id = qq.question_id
        JOIN quiz_attempts qa ON qa.quiz_id = qq.quiz_id
        WHERE qa.id = ${attemptId} AND qb.is_deleted = FALSE
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
    `;
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
        JOIN quiz_attempts qa ON qa.quiz_id = q.id
        WHERE qa.id = ${attemptId}
    `;
    return rows[0]?.time_limit_minutes || null;
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
          JOIN quiz_attempts qa ON qa.quiz_id = q.id
          WHERE qa.id = ${attemptId} AND q.deleted_at IS NULL
      `;
    if (result.length === 0) {
      throw new Error('Quiz not found for this attempt');
    }
    return result[0] as Quiz
  } catch (error) {
    console.error("getQuizByAttemptAction error:", error);
    throw error;
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
  } catch (error) {
    console.error("getAttemptResultAction error:", error);
    throw error;
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