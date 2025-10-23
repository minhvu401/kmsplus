"use server"

import { requireAuth } from "@/lib/serverAuth"
import * as service from "@/service/question.service"

/**
 * Get all users (protected)
 */
export async function getAllQuestions() {
  // await requireAuth()
  return service.getAllQuestionsAction()
}

export async function createQuestion(formData: FormData) {
  // await requireAuth()
  return await service.createQuestionAction(formData)
}

export async function updateQuestion(formData: FormData) {
  // await requireAuth();
  return service.updateQuestionAction(formData)
}

export async function deleteQuestion(id: string) {
  //await requireAuth()
  return service.deleteQuestionAction(id)
}

export async function closeQuestion(id: string) {
  //await requireAuth()
  return service.closeQuestionAction(id)
}

export async function openQuestion(id: string) {
  //await requireAuth()
  return service.openQuestionAction(id)
}

export async function getActiveCategories() {
  //await requireAuth()
  return service.getActiveCategoriesAction()
}

export async function fetchQuestionsPages(query: string, category: string, status: string) {
  //await requireAuth()
  return service.fetchQuestionPagesAction(query, category, status)
}

// createCommnet, editComment, getQuestionDetails, voteComment
