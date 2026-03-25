// Quiz Actions
"use server"

import { sql } from "@/lib/database"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import {
  getAllQuizzesAction,
  getQuizByIdAction,
  getQuizByCurriculumItemIdAction,
  createQuizAction,
  updateQuizAction,
  deleteQuizAction,
  getQuizQuestionsAction,
  updateQuizQuestionsAction,
  startQuizAttemptAction,
  submitQuizAttemptAction,
  saveAttemptAnswerAction,
  getQuestionsForAttemptAction,
  getSavedAnswersAction,
  getAttemptMetaAction,
  getTimeLimitForAttemptAction,
  getAttemptResultAction,
  getAttemptHistoryForCurriculumItemAction,
} from "@/service/quiz.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"
import {
  QuizMetadataDto,
  QuizCreateDto,
  parseAndValidateQuizFormData,
} from "./quizHelper"
// ============================================
// SERVER ACTIONS
// ============================================

type GetAllQuizzesParams = {
  query?: string
  page?: number
  limit?: number
  course_id?: number
}

async function requireAttemptOwner(attemptId: number, userId: number) {
  const rows = await sql`
    SELECT id
    FROM quiz_attempts
    WHERE id = ${attemptId} AND user_id = ${userId}
    LIMIT 1;
  `
  if (rows.length === 0) {
    throw new Error("Attempt not found")
  }
}

/**
 * Lấy danh sách bài thi có phân trang và tìm kiếm.
 * - Params: { query, page, limit }
 * - Trả về object { quizzes, totalCount }
 * - Yêu cầu xác thực (requireAuth)
 */
export async function getAllQuizzes(params: GetAllQuizzesParams) {
  await requireAuth()
  return getAllQuizzesAction(params)
}

/**
 * Lấy chi tiết một bài thi theo ID.
 * - Tham số: id (number)
 * - Trả về Quiz | null
 * - Yêu cầu xác thực (requireAuth)
 */
export async function getQuizById(id: number) {
  await requireAuth()
  return getQuizByIdAction(id)
}

export async function getQuizByCurriculumItemId(curriculumItemId: number) {
  await requireAuth()
  return getQuizByCurriculumItemIdAction(curriculumItemId)
}

export async function getAttemptHistoryForCurriculumItem(
  curriculumItemId: number
) {
  const user = await requireAuth()
  return getAttemptHistoryForCurriculumItemAction(
    curriculumItemId,
    Number(user.id)
  )
}

/**
 * Tạo mới một bài thi từ FormData gửi lên.
 *
 * Functional Requirements:
 * - FR-01: Quiz Identity Form
 * - Sanitization: Input text cần được làm sạch để chống XSS
 * - Validation độ dài (Max 255 ký tự cho Title, 1000 cho Description)
 * - Tạo liên kết giữa quiz và questions
 *
 * Pre-conditions: Người dùng đã đăng nhập với quyền Manager/Admin
 * Post-conditions: Dữ liệu Title, Description, và liên kết Questions được lưu trong DB
 *
 * - FormData expected fields: course_id, title, description, status, question_ids (JSON array)
 * - Kiểm tra các trường bắt buộc và chuyển đổi kiểu
 * - Validate với Zod schema
 * - Sanitize input để chống XSS
 * - Sau khi tạo xong sẽ revalidate /quizzes và redirect về /quizzes
 * - Yêu cầu xác thực (requireAuth) + quyền CREATE_COURSE
 */
export async function createQuiz(formData: FormData) {
  const course_id = Number(formData.get("course_id"))
  const title = (formData.get("title") as string) || ""
  const description = (formData.get("description") as string) || ""
  const status = (formData.get("status") as string) || "draft"
  const time_limit_minutes = formData.get("time_limit_minutes")
    ? Number(formData.get("time_limit_minutes"))
    : undefined
  const passing_score = formData.get("passing_score")
    ? Number(formData.get("passing_score"))
    : 70
  const max_attempts = formData.get("max_attempts")
    ? Number(formData.get("max_attempts"))
    : 3

  if (!course_id) {
    throw new Error("Course ID is required")
  }

  // Sanitize inputs
  const sanitizedTitle = sanitizeTitle(title)
  const sanitizedDescription = sanitizeDescription(description)

  // Validate với Zod
  const validationResult = QuizCreateDto.safeParse({
    title: sanitizedTitle,
    description: sanitizedDescription,
    course_id,
    status,
    time_limit_minutes,
    passing_score,
    max_attempts,
  })

  if (!validationResult.success) {
    throw new Error(
      validationResult.error.issues.map((e) => e.message).join(", ")
    )
  }
  console.log("[createQuiz] Starting...")
  await requireAuth()
  console.log("[createQuiz] Auth verified")

  // Parse and validate FormData
  const parsedData = parseAndValidateQuizFormData(formData)

  console.log("[createQuiz] Data validated, calling createQuizAction...")

  await createQuizAction({
    course_id: parsedData.course_id,
    title: parsedData.title,
    description: parsedData.description,
    status: parsedData.status,
    time_limit_minutes: parsedData.time_limit_minutes,
    passing_score: parsedData.passing_score,
    max_attempts: parsedData.max_attempts,
    questionIds: parsedData.questionIds,
  })

  console.log(
    "[createQuiz] Quiz created successfully, revalidating and redirecting..."
  )
  revalidatePath("/quizzes")
  redirect("/quizzes")
}

/**
 * Cập nhật một bài thi từ FormData gửi lên.
 * - FormData expected fields: id, title, description, status, etc.
 * - Validate với Zod schema
 * - Sanitize input để chống XSS
 * - Sau khi cập nhật sẽ revalidate các path liên quan
 * - Yêu cầu xác thực (requireAuth)
 */
export async function updateQuiz(formData: FormData) {
  await requireAuth()

  const id = Number(formData.get("id"))
  if (!id) throw new Error("Quiz ID is required")

  const title = (formData.get("title") as string) || undefined
  const description = (formData.get("description") as string) || undefined
  const status = (formData.get("status") as string) || undefined

  // Sanitize nếu có
  const sanitizedTitle = title ? sanitizeTitle(title) : undefined
  const sanitizedDescription = description
    ? sanitizeDescription(description)
    : undefined

  // Validate nếu có title
  if (sanitizedTitle) {
    const validationResult = QuizMetadataDto.safeParse({
      title: sanitizedTitle,
      description: sanitizedDescription || "",
    })
    if (!validationResult.success) {
      throw new Error(
        validationResult.error.issues.map((e) => e.message).join(", ")
      )
    }
  }

  await updateQuizAction(id, {
    ...(sanitizedTitle && { title: sanitizedTitle }),
    ...(sanitizedDescription && { description: sanitizedDescription }),
    ...(status && { status }),
  })

  revalidatePath("/quizzes")
  revalidatePath(`/quizzes/${id}`)
}

/**
 * Xóa một bài thi (soft delete).
 * - Tham số: id (number)
 * - Yêu cầu xác thực (requireAuth)
 */
export async function deleteQuiz(id: number) {
  await requireAuth()
  await deleteQuizAction(id)
  revalidatePath("/quizzes")
}

/**
 * Lấy danh sách câu hỏi của một quiz.
 * - Tham số: quizId (number)
 * - Trả về danh sách câu hỏi với thông tin chi tiết
 * - Yêu cầu xác thực (requireAuth)
 */
export async function getQuizQuestions(quizId: number) {
  await requireAuth()
  return getQuizQuestionsAction(quizId)
}

/**
 * Cập nhật danh sách câu hỏi của một quiz.
 * - Tham số: quizId (number), questionIds (number[])
 * - Yêu cầu xác thực (requireAuth)
 */
export async function updateQuizQuestions(
  quizId: number,
  questionIds: number[]
) {
  await requireAuth()
  await updateQuizQuestionsAction(quizId, questionIds)
  revalidatePath(`/quizzes/${quizId}`)
  revalidatePath("/quizzes")
}

/**
 * Cập nhật thông tin chi tiết của quiz (title, description, time limit, passing score, max attempts)
 * - Tham số: quizId (number), data object
 * - Yêu cầu xác thực (requireAuth)
 */
export async function updateQuizMetadata(
  quizId: number,
  data: {
    title: string
    description?: string
    time_limit_minutes?: number | null
    passing_score?: number
    max_attempts?: number
  }
) {
  await requireAuth()

  const sanitizedTitle = sanitizeTitle(data.title)
  const sanitizedDescription = data.description
    ? sanitizeDescription(data.description)
    : undefined

  // Validate
  const validationResult = QuizMetadataDto.safeParse({
    title: sanitizedTitle,
    description: sanitizedDescription || "",
  })
  if (!validationResult.success) {
    throw new Error(
      validationResult.error.issues.map((e) => e.message).join(", ")
    )
  }

  await updateQuizAction(quizId, {
    title: sanitizedTitle,
    ...(sanitizedDescription && { description: sanitizedDescription }),
    time_limit_minutes: data.time_limit_minutes,
    passing_score: data.passing_score || 70,
    max_attempts: data.max_attempts || 3,
  })

  revalidatePath("/quizzes")
  revalidatePath(`/quizzes/${quizId}`)
}

export async function startQuizAttempt(curriculumItemId: number) {
  const user = await requireAuth()

  // totalQuestions should come from DB, not frontend
  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM curriculum_items ci
    JOIN quiz_questions qq ON qq.quiz_id = ci.quiz_id
    JOIN question_bank qb ON qb.id = qq.question_id
    WHERE ci.id = ${curriculumItemId} AND qb.is_deleted = FALSE;
  `

  const totalQuestions = result[0].count

  return startQuizAttemptAction(
    curriculumItemId,
    Number(user.id),
    totalQuestions
  )
}

export async function getInProgressAttemptForCurriculumItem(
  curriculumItemId: number
) {
  const user = await requireAuth()

  const rows = await sql`
    SELECT id
    FROM quiz_attempts
    WHERE curriculum_item_id = ${curriculumItemId}
      AND user_id = ${Number(user.id)}
      AND status = 'in_progress'
    ORDER BY started_at DESC
    LIMIT 1;
  `

  return {
    attemptId: rows.length > 0 ? Number(rows[0].id) : null,
  }
}

export async function submitQuizAttempt(attemptId: number) {
  const user = await requireAuth()
  const result = await submitQuizAttemptAction(attemptId, Number(user.id))

  // Keep learning/history pages in sync with auto progress updates on passed attempts.
  const routeInfo = await getAttemptRouteInfo(attemptId)
  revalidatePath("/history")
  revalidatePath(`/courses/${routeInfo.course_id}`)
  revalidatePath(`/courses/${routeInfo.course_id}/learning`)

  return result
}

export async function getQuestionsForAttempt(attemptId: number) {
  const user = await requireAuth()
  await requireAttemptOwner(attemptId, Number(user.id))
  return getQuestionsForAttemptAction(attemptId)
}

export async function getSavedAnswers(attemptId: number) {
  const user = await requireAuth()
  await requireAttemptOwner(attemptId, Number(user.id))
  return getSavedAnswersAction(attemptId)
}

export async function getAttemptMeta(attemptId: number) {
  const user = await requireAuth()
  await requireAttemptOwner(attemptId, Number(user.id))
  return getAttemptMetaAction(attemptId, Number(user.id))
}

export async function getAttemptRouteInfo(attemptId: number) {
  const user = await requireAuth()
  await requireAttemptOwner(attemptId, Number(user.id))

  const rows = await sql`
    SELECT
      s.course_id,
      qa.curriculum_item_id
    FROM quiz_attempts qa
    JOIN curriculum_items ci ON ci.id = qa.curriculum_item_id
    JOIN sections s ON s.id = ci.section_id
    WHERE qa.id = ${attemptId}
    LIMIT 1;
  `

  if (rows.length === 0) {
    throw new Error("Attempt not found")
  }

  return {
    course_id: Number(rows[0].course_id),
    curriculum_item_id: Number(rows[0].curriculum_item_id),
  }
}

export async function getTimeLimitForAttempt(attemptId: number) {
  const user = await requireAuth()
  await requireAttemptOwner(attemptId, Number(user.id))
  return getTimeLimitForAttemptAction(attemptId)
}

export async function getAttemptResult(attemptId: number) {
  const user = await requireAuth()
  await requireAttemptOwner(attemptId, Number(user.id))
  return getAttemptResultAction(attemptId)
}

const SaveAnswerSchema = z.object({
  attemptId: z.coerce.number().int(),
  questionId: z.coerce.number().int(),
  selectedAnswer: z.union([z.string(), z.array(z.string())]),
})
export async function saveAttemptAnswer(input: unknown) {
  // 1️⃣ Validate payload
  const parsed = SaveAnswerSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error("Invalid answer payload")
  }

  const { attemptId, questionId, selectedAnswer } = parsed.data

  // 2️⃣ Auth
  const user = await requireAuth()

  // 3️⃣ Save answer
  await saveAttemptAnswerAction(
    attemptId,
    Number(user.id),
    questionId,
    selectedAnswer
  )

  // 4️⃣ Minimal response
  return { success: true }
}

// ============================================
// AI EXPLANATION ACTION
// ============================================

const GetExplanationSchema = z.object({
  attemptId: z.coerce.number().int(),
  questionId: z.coerce.number().int(),
})

/**
 * Lấy giải thích AI sâu hơn cho một câu hỏi trong quiz
 * - Xác minh user đã submit quiz attempt
 * - Lấy chi tiết câu hỏi từ question_bank
 * - Gọi Gemini API để generate giải thích chi tiết
 *
 * Pre-conditions: User đã hoàn thành quiz attempt
 * Post-conditions: Trả về giải thích AI chi tiết
 */
export async function getQuestionExplanation(input: unknown) {
  try {
    // 1️⃣ Validate payload
    const parsed = GetExplanationSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error("Invalid request payload")
    }

    const { attemptId, questionId } = parsed.data

    // 2️⃣ Auth
    const user = await requireAuth()
    const userId = Number(user.id)

    // 3️⃣ Verify attempt ownership & is submitted
    const attemptRows = await sql`
      SELECT id, status
      FROM quiz_attempts
      WHERE id = ${attemptId} AND user_id = ${userId}
      LIMIT 1
    `

    if (attemptRows.length === 0) {
      throw new Error("Quiz attempt not found")
    }

    const attempt = attemptRows[0]
    if (attempt.status !== "submitted") {
      throw new Error("Quiz must be submitted before viewing explanations")
    }

    // 4️⃣ Get question details from question_bank
    const questionRows = await sql`
      SELECT 
        id,
        question_text,
        explanation,
        type,
        options,
        correct_answer,
        category_id
      FROM question_bank
      WHERE id = ${questionId} AND is_deleted = FALSE
      LIMIT 1
    `

    if (questionRows.length === 0) {
      throw new Error("Question not found")
    }

    const question = questionRows[0]

    // 5️⃣ Import & call generateAIExplanation from gemini service
    const { generateAIExplanation } = await import("@/service/gemini.service")

    // 6️⃣ Get category name if available
    let categoryName = ""
    if (question.category_id) {
      const categoryRows = await sql`
        SELECT name FROM categories WHERE id = ${question.category_id} LIMIT 1
      `
      if (categoryRows.length > 0) {
        categoryName = categoryRows[0].name
      }
    }

    // 7️⃣ Get user's answer from attempt_answers
    let userAnswer = ""
    const answerRows = await sql`
      SELECT selected_answer
      FROM attempt_answers
      WHERE attempt_id = ${attemptId} AND question_id = ${questionId}
      LIMIT 1
    `
    if (answerRows.length > 0) {
      userAnswer = String(answerRows[0].selected_answer)
    }

    // 8️⃣ Parse options if it's JSON
    let optionsArray = []
    if (question.options && typeof question.options === "object") {
      optionsArray = Array.isArray(question.options)
        ? question.options
        : Object.values(question.options)
    }

    // 9️⃣ Format correct answer for display
    let correctAnswerDisplay = ""
    if (question.correct_answer) {
      if (typeof question.correct_answer === "object") {
        correctAnswerDisplay = Array.isArray(question.correct_answer)
          ? question.correct_answer.join(", ")
          : JSON.stringify(question.correct_answer)
      } else {
        correctAnswerDisplay = String(question.correct_answer)
      }
    }

    // 🔟 Generate AI explanation
    const explanation = await generateAIExplanation({
      questionText: question.question_text,
      explanation: question.explanation || "",
      correctAnswer: correctAnswerDisplay,
      questionType: question.type,
      options: optionsArray,
      userAnswer: userAnswer,
      category: categoryName,
    })

    return {
      success: true,
      explanation,
      questionId,
      questionText: question.question_text,
    }
  } catch (error: any) {
    console.error("❌ Error getting question explanation:", error)
    return {
      success: false,
      error: error?.message || "Failed to generate explanation",
    }
  }
}
