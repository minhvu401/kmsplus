"use server"

import { requireAuth } from "@/lib/auth"
import * as service from "@/service/question.service"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  CreateAnswerDto,
  CreateQuestionDto,
  UpdateAnswerDto,
  UpdateQuestionDto,
} from "./dto/question.dto"

export type State = {
  message: string | null;
  errors: Record<string, string[] | undefined>;
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
  const validated = CreateQuestionDto.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category_id: formData.get("category_id"),
    user_id: formData.get("user_id"),
  })

  if (!validated.success) {
    return {
      message: "Missing or invalid fields. Failed to create question.",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const result = await service.createQuestionAction(validated.data);

  const returnToRaw = formData.get("returnTo")
  const returnTo =
    typeof returnToRaw === "string" && returnToRaw.startsWith("/")
      ? returnToRaw
      : null

  // If DB/service returned validation errors → show in form
  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath(returnTo ?? "/questions")
    redirect(`${returnTo ?? "/questions"}?created=1`)
  }

  return { message: null, errors: {} };
}

export async function updateQuestion(_prevState: State,
  formData: FormData
): Promise<State> {
  const validated = UpdateQuestionDto.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category_id: formData.get("category_id"),
    id: formData.get("id"),
  })

  if (!validated.success) {
    return {
      message: "Invalid or missing fields. Failed to update question.",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const result = await service.updateQuestionAction(validated.data);
  const id = validated.data.id;

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

export async function updateQuestionForManagement(
  formData: FormData
): Promise<{
  success: boolean
  message: string
  errors?: Record<string, string[] | undefined>
}> {
  const validated = UpdateQuestionDto.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category_id: formData.get("category_id"),
    id: formData.get("id"),
  })

  if (!validated.success) {
    return {
      success: false,
      message: "Invalid or missing fields. Failed to update question.",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const result = await service.updateQuestionAction(validated.data)

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      success: false,
      message: result.message ?? "Validation failed",
      errors: result.errors,
    }
  }

  if (result?.success) {
    revalidatePath("/questions")
    revalidatePath("/questions/management")
    revalidatePath(`/questions/${validated.data.id}`)
    return {
      success: true,
      message: result.message ?? "Question updated successfully",
    }
  }

  return {
    success: false,
    message: result?.message ?? "Failed to update question",
  }
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

export async function deleteQuestionForManagement(id: string): Promise<{
  success: boolean
  message: string
}> {
  const result = await service.deleteQuestionAction(id)

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      success: false,
      message: result.message ?? "Validation failed",
    }
  }

  if (result?.success) {
    revalidatePath("/questions")
    revalidatePath("/questions/management")
    return {
      success: true,
      message: result.message ?? "Question deleted successfully",
    }
  }

  return {
    success: false,
    message: result?.message ?? "Failed to delete question",
  }
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

export async function closeQuestionForManagement(id: string): Promise<{
  success: boolean
  message: string
}> {
  const result = await service.closeQuestionAction(id)

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      success: false,
      message: result.message ?? "Validation failed",
    }
  }

  if (result?.success) {
    revalidatePath("/questions")
    revalidatePath("/questions/management")
    revalidatePath(`/questions/${id}`)
    return {
      success: true,
      message: result.message ?? "Question closed successfully",
    }
  }

  return {
    success: false,
    message: result?.message ?? "Failed to close question",
  }
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

export async function openQuestionForManagement(id: string): Promise<{
  success: boolean
  message: string
}> {
  const result = await service.openQuestionAction(id)

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      success: false,
      message: result.message ?? "Validation failed",
    }
  }

  if (result?.success) {
    revalidatePath("/questions")
    revalidatePath("/questions/management")
    revalidatePath(`/questions/${id}`)
    return {
      success: true,
      message: result.message ?? "Question opened successfully",
    }
  }

  return {
    success: false,
    message: result?.message ?? "Failed to open question",
  }
}

export async function getActiveCategories() {
  //await requireAuth()
  return service.getActiveCategoriesAction()
}

export async function fetchQuestionsPages(
  query: string,
  category: string,
  status: string,
  limit?: number
) {
  //await requireAuth()
  return service.fetchQuestionPagesAction(query, category, status, limit)
}

export async function fetchFilteredQuestions(
  query: string,
  category: string,
  status: string,
  sort: string,
  currentPage: number,
  limit?: number
) {
  // await requireAuth()
  return service.fetchFilteredQuestionsAction(
    query,
    category,
    status,
    sort,
    currentPage,
    limit
  )
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
  const validated = CreateAnswerDto.safeParse({
    content: formData.get("content"),
    user_id: formData.get("user_id"),
    question_id: formData.get("question_id"),
    parent_id: null, // Top-level answers only
  })

  if (!validated.success) {
    return {
      message: "Missing or invalid fields. Failed to create answer.",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const result = await service.createAnswerAction(validated.data);
  const id = validated.data.question_id;

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

// Function for creating replies (nested answers with parent_id)
export async function createReply(formData: FormData): Promise<State> {
  const parentId = Number(formData.get("parent_id"));

  if (!parentId) {
    return {
      message: "parent_id is required for replies.",
      errors: { parent_id: ["parent_id is required"] },
    };
  }

  const validated = CreateAnswerDto.safeParse({
    content: formData.get("content"),
    user_id: formData.get("user_id"),
    question_id: formData.get("question_id"),
    parent_id: parentId,
  })

  if (!validated.success) {
    return {
      message: "Missing or invalid fields. Failed to create reply.",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const result = await service.createAnswerAction(validated.data);
  const id = validated.data.question_id;

  if (result?.errors && Object.keys(result.errors).length > 0) {
    return {
      message: result.message ?? "Validation failed",
      errors: result.errors,
    };
  }

  if (result?.success) {
    revalidatePath("/questions/" + id);
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
  const validated = UpdateAnswerDto.safeParse({
    content: formData.get("content"),
    answer_id: formData.get("answer_id"),
    question_id: formData.get("question_id"),
  })

  if (!validated.success) {
    return {
      message: "Invalid or missing fields. Failed to update answer.",
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const result = await service.updateAnswerAction(validated.data);
  const questionId = validated.data.question_id;

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
  limit?: number,
){
  //await requireAuth()
  return service.fetchFilteredAnswersAction(currentPage, questionId, limit);
}

export async function fetchAnswerPages(
  questionId: number,
  limit?: number,
) {
  //await requireAuth()
  return service.fetchAnswerPagesAction(questionId, limit);
}

export async function fetchFullDiscussionThread(answerId: number) {
  //await requireAuth()
  return service.fetchFullDiscussionThreadAction(answerId);
}

export async function getTopKnowledgeSharers(limit: number = 5) {
  return service.getTopKnowledgeSharers(limit);
}
