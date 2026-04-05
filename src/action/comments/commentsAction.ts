"use server"

import { requireAuth } from "@/lib/auth"
import {
  getCommentsByArticleId,
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "@/service/comments.service"

export async function getComments(articleId: number) {
  await requireAuth()
  return getCommentsByArticleId(articleId)
}

export async function createComment(formData: FormData) {
  try {
    const currentUser = await requireAuth()

    const article_id = parseInt(formData.get("article_id") as string)
    const content = formData.get("content") as string
    const parent_id = formData.get("parent_id") as string

    if (!content || content.trim().length === 0) {
      return { success: false, message: "Comment content is required" }
    }

    const result = await createCommentAction({
      article_id,
      user_id: parseInt(currentUser.id),
      content: content.trim(),
      parent_id: parent_id ? parseInt(parent_id) : null,
    })

    return result
  } catch (error: any) {
    console.error("Error in createComment action:", error)
    return {
      success: false,
      message: error?.message || "Failed to create comment",
    }
  }
}

export async function updateComment(formData: FormData) {
  try {
    const currentUser = await requireAuth()

    const id = parseInt(formData.get("id") as string)
    const content = formData.get("content") as string

    if (!content || content.trim().length === 0) {
      return { success: false, message: "Comment content is required" }
    }

    const result = await updateCommentAction({
      id,
      user_id: parseInt(currentUser.id),
      content: content.trim(),
    })

    return result
  } catch (error: any) {
    console.error("Error in updateComment action:", error)
    return {
      success: false,
      message: error?.message || "Failed to update comment",
    }
  }
}

export async function deleteComment(commentId: number) {
  try {
    const currentUser = await requireAuth()
    return await deleteCommentAction(commentId, parseInt(currentUser.id))
  } catch (error: any) {
    console.error("Error in deleteComment action:", error)
    return {
      success: false,
      message: error?.message || "Failed to delete comment",
    }
  }
}
