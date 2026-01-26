// Quiz Actions
"use server"

import { sql } from "@/lib/database"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import {
  getAllQuizzesAction,
  getQuizByIdAction,
  createQuizAction,
  updateQuizAction,
  deleteQuizAction,
  getQuizQuestionsAction,
  updateQuizQuestionsAction,
  startQuizAttemptAction,
  submitQuizAttemptAction,
  saveAttemptAnswerAction
} from "@/service/quiz.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"
import { QuizMetadataDto, QuizCreateDto, parseAndValidateQuizFormData } from "./quizHelper"
// ============================================
// SERVER ACTIONS
// ============================================

type GetAllQuizzesParams = {
  query?: string
  page?: number
  limit?: number
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

/**
 * Tạo mới một bài thi từ FormData gửi lên.
 * 
 * Functional Requirements:
 * - FR-01: Quiz Identity Form
 * - Sanitization: Input text cần được làm sạch để chống XSS
 * - Validation độ dài (Max 255 ký tự cho Title, 1000 cho Description)
 * 
 * Pre-conditions: Người dùng đã đăng nhập với quyền Manager/Admin
 * Post-conditions: Dữ liệu Title và Description được lưu trong DB
 * 
 * - FormData expected fields: course_id, title, description, status
 * - Kiểm tra các trường bắt buộc và chuyển đổi kiểu
 * - Validate với Zod schema
 * - Sanitize input để chống XSS
 * - Sau khi tạo xong sẽ revalidate /quizzes và redirect về /quizzes
 * - Yêu cầu xác thực (requireAuth)
 */
export async function createQuiz(formData: FormData) {
  await requireAuth()

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

  console.log("[createQuiz] Quiz created successfully, revalidating and redirecting...")
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
export async function updateQuizQuestions(quizId: number, questionIds: number[]) {
  await requireAuth()
  await updateQuizQuestionsAction(quizId, questionIds)
  revalidatePath(`/quizzes/${quizId}`)
  revalidatePath("/quizzes")
}

export async function startQuizAttempt(quizId: number) {
  const user = await requireAuth();

  // totalQuestions should come from DB, not frontend
  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM question_bank qb
    JOIN quiz_questions qq ON qb.id = qq.question_id
    WHERE qq.quiz_id = ${quizId} AND qb.deleted_at IS NULL;
  `;

  const totalQuestions = result[0].count;

  return startQuizAttemptAction(quizId, Number(user.id), totalQuestions);
}

export async function submitQuizAttempt(attemptId: number) {
  const user = await requireAuth();

  return submitQuizAttemptAction(attemptId, Number(user.id));
}

const SaveAnswerSchema = z.object({
  attemptId: z.coerce.number().int(),
  questionId: z.coerce.number().int(),
  selectedAnswer: z.union([
    z.coerce.number().int(),
    z.array(z.coerce.number().int()),
  ]),
});
export async function saveAttemptAnswer(input: unknown) {
  // 1️⃣ Validate payload
  const parsed = SaveAnswerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Invalid answer payload');
  }

  const { attemptId, questionId, selectedAnswer } = parsed.data;

  // 2️⃣ Auth
  const user = await requireAuth();

  // 3️⃣ Save answer
  await saveAttemptAnswerAction(
    attemptId,
    Number(user.id),
    questionId,
    selectedAnswer
  );

  // 4️⃣ Minimal response
  return { success: true };
}