import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getRedisClient } from "@/lib/redis"
import {
  createConversation,
  getConversation,
  addMessage,
  getMessagesByConversationId,
} from "@/service/chat.service"
import { generateAIResponse } from "@/service/gemini.service"

export async function POST(request: Request) {
  try {
    // Get authenticated user from HTTP-only cookie
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id

    // Parse request body
    const { conversationId, message } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    let conversation
    const redisClient = await getRedisClient()

    // Check or create conversation
    if (!conversationId) {
      // Create new conversation with title generated from first message
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message
      conversation = await createConversation(userId, title)
    } else {
      // Ensure conversationId is a number
      const convId =
        typeof conversationId === "string"
          ? parseInt(conversationId)
          : conversationId
      // Verify conversation belongs to user
      conversation = await getConversation(convId, userId)
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found or unauthorized" },
          { status: 404 }
        )
      }
    }

    // Add user message to database
    const userMessage = await addMessage(conversation.id, "user", message)

    // Get conversation history from database
    const messageHistory = await getMessagesByConversationId(conversation.id)

    // Build context for Gemini from conversation history
    let conversationContext = messageHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    // Prepare final prompt with history if this is follow-up message
    let finalPrompt = message
    if (conversationContext) {
      finalPrompt = `Previous conversation:\n${conversationContext}\n\nNew question/statement: ${message}`
    }

    // Generate AI response (without exposing database schema)
    const aiResponse = await generateAIResponse(finalPrompt)

    // Add AI message to database
    const assistantMessage = await addMessage(
      conversation.id,
      "assistant",
      aiResponse
    )

    // Save to Redis cache (conversation history)
    if (redisClient) {
      try {
        const cacheKey = `conversation:${conversation.id}`
        const conversationData = {
          id: conversation.id,
          userId: conversation.user_id,
          title: conversation.title,
          messages: [...messageHistory, userMessage, assistantMessage],
          updatedAt: new Date().toISOString(),
        }

        await redisClient.set(
          cacheKey,
          JSON.stringify(conversationData),
          { ex: 86400 } // 24 hours TTL
        )
      } catch (cacheErr) {
        console.warn("Could not cache conversation to Redis:", cacheErr)
        // Continue anyway, data is already in database
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      },
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.created_at,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.created_at,
      },
    })
  } catch (error: any) {
    console.error("❌ Chat API error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
