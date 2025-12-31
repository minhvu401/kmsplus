"use server"

import { requireAuth } from "@/lib/auth"
import {
  createQuizQuestionAction,
  getAllQuizQuestionsAction,
  updateQuizQuestionAction,
  deleteQuizQuestionAction,
} from "@/service/questionbank.service"
import type { Option } from "@/service/questionbank.service"
import { th } from "zod/locales"
// 1 kiểu type cho tham số luôn, đỡ bị nhiều
type getAllQuizQuestionsParams = {
  query?: string
  categoryId?: string | null
  page?: number
  limit?: number
}

export async function getAllQuizQuestions(params: getAllQuizQuestionsParams) {
  // await requireAuth()
  return getAllQuizQuestionsAction(params)
}

export async function createQuizQuestion(
  question_text: string,
  question_type: "multiple_choice" | "checkboxes",
  difficulty_level: string,
  category_id: string,
  options: Option[]
) {
  if (!options || options.length !== 4) {
    throw new Error("Question must have exactly 4 options.")
  }

  const user = await requireAuth()
  const creator_id = user.id
  return createQuizQuestionAction(
    creator_id,
    question_text,
    question_type,
    difficulty_level,
    category_id,
    options
  )
}

export async function updateQuizQuestion(
  id: string,
  question_text: string,
  question_type: string,
  difficulty_level: string,
  category_id: string
) {
  await requireAuth()
  return updateQuizQuestionAction(
    id,
    question_text,
    question_type,
    difficulty_level,
    category_id
  )
}

export async function deleteQuizQuestion(id: string) {
  await requireAuth()
  return deleteQuizQuestionAction(id)
}
