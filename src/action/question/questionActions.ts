"use server"

import { requireAuth } from "@/lib/auth"
import * as service from "@/service/question.service"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export type State = {
  message: string | null;
  errors: {
    title?: string[];
    content?: string[];
    category_id?: string[];
    user_id?: string[];
  };
};

/**
 * Get all users (protected)
 */
export async function getAllQuestions() {
  // await requireAuth()
  return service.getAllQuestionsAction()
}

export async function getQuestionDetails(id: string) {
  // await requireAuth()
  return service.getQuestionDetailsAction(id)
}

export async function createQuestion(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const result = await service.createQuestionAction(formData);

  // If DB/service returned validation errors → show in form
  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions");
    redirect("/questions");
  }

  return { message: null, errors: {} };
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

export async function fetchQuestionsPages(
  query: string,
  category: string,
  status: string
) {
  //await requireAuth()
  return service.fetchQuestionPagesAction(query, category, status)
}

export async function fetchFilteredQuestions(
  query: string,
  category: string,
  status: string,
  sort: string,
  currentPage: number) {
  // await requireAuth()
  return service.fetchFilteredQuestionsAction(query, category, status, sort, currentPage)
}



// createCommnet, editComment, voteComment
