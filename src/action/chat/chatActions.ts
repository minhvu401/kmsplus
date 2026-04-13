"use server"

import {
  createConversation,
  getConversation,
  getConversationsByUserId,
  addMessage,
  getMessagesByConversationId,
  updateConversationTitle,
} from "@/service/chat.service"
import { requireAuth } from "@/lib/auth"

/**
 * Server action: Create new conversation
 */
export async function createNewConversation(title?: string) {
  try {
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id
    const conversation = await createConversation(userId, title)
    return {
      success: true,
      data: conversation,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create conversation",
    }
  }
}

/**
 * Server action: Get conversation details
 */
export async function getConversationDetails(conversationId: number) {
  try {
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id
    const [conversation, messages] = await Promise.all([
      getConversation(conversationId, userId),
      getMessagesByConversationId(conversationId),
    ])

    if (!conversation) {
      return {
        success: false,
        error: "Conversation not found",
      }
    }

    return {
      success: true,
      data: {
        conversation,
        messages,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to get conversation",
    }
  }
}

/**
 * Server action: Get all conversations for user
 */
export async function getMyConversations(limit = 20, offset = 0) {
  try {
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id
    const conversations = await getConversationsByUserId(userId, limit, offset)
    return {
      success: true,
      data: conversations,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to get conversations",
    }
  }
}

/**
 * Server action: Update conversation title
 */
export async function updateConvTitle(conversationId: number, title: string) {
  try {
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id
    const conversation = await updateConversationTitle(
      conversationId,
      userId,
      title
    )
    return {
      success: true,
      data: conversation,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update conversation",
    }
  }
}
