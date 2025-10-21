"use server"

import { requireAuth } from "@/lib/serverAuth"
import { getAllQuestionsAction, createQuestionAction, updateQuestionAction, deleteQuestionAction, closeQuestionAction, openQuestionAction, getActiveCategoriesAction } from "@/service/question.service"

/**
 * Get all users (protected)
 */
export async function getAllQuestions() {
  // await requireAuth()
  return getAllQuestionsAction()
}

export async function createQuestion(formData: FormData) {
  // await requireAuth()
  return await createQuestionAction(formData)
}

export async function updateQuestion(formData: FormData) {
  // await requireAuth();
  return updateQuestionAction(formData)
}

export async function deleteQuestion(id: string) {
  //await requireAuth()
  return deleteQuestionAction(id)
}

export async function closeQuestion(id: string){
  //await requireAuth()
  return closeQuestionAction(id)
}

export async function openQuestion(id: string){
  //await requireAuth()
  return openQuestionAction(id)
}

export async function getActiveCategories(){
  //await requierAuth()
  return getActiveCategoriesAction()
}
