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
    redirect("/questions?created=1");
  }

  return { message: null, errors: {} };
}

export async function updateQuestion(_prevState: State,
  formData: FormData
): Promise<State> {
  const result = await service.updateQuestionAction(formData);
  const id = formData.get("id");

  // If DB/service returned validation errors → show in form
  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + id);
    redirect("/questions/" + id + "?updated=1");
  }

  return { message: null, errors: {} };
}

export async function deleteQuestion(id: string) {
  //await requireAuth()
  const result = await service.deleteQuestionAction(id);

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions");
    redirect("/questions?deleted=1");
  }

  return { message: null, errors: {} };
}

export async function closeQuestion(id: string) {
  //await requireAuth()
  const result = await service.closeQuestionAction(id);

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + id);
    redirect("/questions/" + id + "?closed=1");
  }

  return { message: null, errors: {} };
}

export async function openQuestion(id: string) {
  //await requireAuth()
  const result = await service.openQuestionAction(id);

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + id);
    redirect("/questions/" + id + "?opened=1");
  }

  return { message: null, errors: {} };
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

export async function getAnswersForQuestion(id: number) {
  // await requireAuth()
  return service.getAnswersForQuestionAction(id);
}

export async function getAnswerDetails (id: number) {
  // await requireAuth()
  return service.getAnswerDetailsAction(id);
}

export async function createAnswer(
  _prevState: State,
  formData: FormData
): Promise<State> {

  const result = await service.createAnswerAction(formData);
  const id = formData.get("question_id");

  // If DB/service returned validation errors → show in form
  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + id);
    redirect("/questions/" + id + "?answerCreated=1");
  }

  return { message: null, errors: {} };
}

export async function deleteAnswer(asnwerId: number, questionId: number) {
  //await requireAuth()
  const result = await service.deleteAnswerAction(asnwerId);

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + questionId);
    redirect("/questions/" + questionId + "?answerDeleted=1");
  }

  return { message: null, errors: {} };
}

export async function updateAnswer(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const result = await service.updateAnswerAction(formData);
  const questionId = formData.get("question_id");

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + questionId);
    redirect("/questions/" + questionId + "?answerUpdated=1");
  }

  return { message: null, errors: {} };
}

export async function fetchFilteredAnswers (
  currentPage: number,
  questionId: number,
){
  //await requireAuth()
  return service.fetchFilteredAnswersAction(currentPage, questionId);
}
