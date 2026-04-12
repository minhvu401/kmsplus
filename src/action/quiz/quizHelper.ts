/**
 * Quiz Helper Functions (không có "use server")
 * Dùng cho API routes và server actions
 */

import { z } from "zod"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const QuizMetadataDto = z.object({
  title: z
    .string()
    .min(1, "Vui lòng nhập tên bài thi")
    .max(255, "Tên bài thi không vượt quá 255 ký tự"),
  description: z
    .string()
    .max(1000, "Mô tả không vượt quá 1000 ký tự")
    .optional()
    .default(""),
})

export const QuizCreateDto = z.object({
  title: z
    .string()
    .min(1, "Vui lòng nhập tên bài thi")
    .max(255, "Tên bài thi không vượt quá 255 ký tự"),
  description: z
    .string()
    .max(1000, "Mô tả không vượt quá 1000 ký tự")
    .optional()
    .default(""),
  category_id: z.number().positive("Invalid category ID"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  time_limit_minutes: z.number().positive().optional(),
  passing_score: z.number().min(0).max(100).default(70),
  max_attempts: z.number().positive().default(3),
})

export type QuizCreateDtoType = z.infer<typeof QuizCreateDto>

// ============================================
// PARSE & VALIDATE FORMDATA
// ============================================

export interface ParsedQuizData {
  category_id: number
  title: string
  description: string
  status: string
  time_limit_minutes?: number
  passing_score: number
  max_attempts: number
  questionIds: number[]
}

/**
 * Parse FormData và validate dữ liệu quiz
 * Dùng cho cả API route và server action
 */
export function parseAndValidateQuizFormData(formData: FormData): ParsedQuizData {
  const category_id = Number(formData.get("category_id"))
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

  // Extract question IDs from FormData
  let questionIds: number[] = []
  const questionIdsStr = formData.get("question_ids")
  if (questionIdsStr) {
    try {
      const parsed = JSON.parse(questionIdsStr as string)
      questionIds = Array.isArray(parsed) ? parsed.map((id) => Number(id)) : []
    } catch (error) {
      console.error("Failed to parse question_ids:", error)
      throw new Error("Invalid question_ids format")
    }
  }

  if (!category_id) {
    throw new Error("Category ID is required")
  }

  // Sanitize inputs
  const sanitizedTitle = sanitizeTitle(title)
  const sanitizedDescription = sanitizeDescription(description)

  // Validate với Zod
  const validationResult = QuizCreateDto.safeParse({
    title: sanitizedTitle,
    description: sanitizedDescription,
    category_id,
    status,
    time_limit_minutes,
    passing_score,
    max_attempts,
  })

  if (!validationResult.success) {
    throw new Error(validationResult.error.issues.map((e) => e.message).join(", "))
  }

  return {
    category_id: validationResult.data.category_id,
    title: validationResult.data.title,
    description: validationResult.data.description,
    status: validationResult.data.status,
    time_limit_minutes: validationResult.data.time_limit_minutes,
    passing_score: validationResult.data.passing_score,
    max_attempts: validationResult.data.max_attempts,
    questionIds: questionIds,
  }
}
