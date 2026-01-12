"use server"
import { Permission } from "@/enum/permission.enum"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import * as service from "@/service/questionbank.service"

export async function getQuestions(page: number = 1, limit: number = 10) {
  await requirePermission(Permission.CREATE_QUESTION)
  // await requireAuth()
  return service.getQuestionsAction(page, limit)
}

export async function getCategories() {
  // await requireAuth()
  return service.getCategoriesAction()
}

export async function createQuestion(questionData: any) {
  // await requireAuth()
  return service.createQuestionAction(questionData)
}

export async function getQuestionById(id: string) {
  // await requireAuth()
  return service.getQuestionByIdAction(id)
}

export async function updateQuestionAction(id: string, questionData: any) {
  // await requireAuth()
  return service.updateQuestionAction(id, questionData)
}

export async function deleteQuestion(id: string) {
  // await requireAuth()
  return service.deleteQuestionAction(id)
}
