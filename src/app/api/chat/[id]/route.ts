import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getRedisClient } from "@/lib/redis"
import {
  getConversation,
  getMessagesByConversationId,
  deleteConversation,
  updateConversationTitle,
} from "@/service/chat.service"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user from HTTP-only cookie
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id

    const { id } = await params
    const conversationId = parseInt(id)

    // Verify conversation belongs to user
    const conversation = await getConversation(conversationId, userId)
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Try to get from Redis cache first
    const redisClient = await getRedisClient()

    let cachedData = null
    if (redisClient) {
      try {
        const cacheKey = `conversation:${conversationId}`
        cachedData = await redisClient.get(cacheKey)

        if (cachedData) {
          // Handle both string and object responses from Redis
          const data =
            typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData
          return NextResponse.json(data)
        }
      } catch (cacheErr) {
        console.warn("Could not get from Redis cache:", cacheErr)
      }
    }

    // If not in cache, get from database
    const messages = await getMessagesByConversationId(conversationId)

    const conversationData = {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    }

    // Cache for future requests
    if (redisClient) {
      try {
        await redisClient.set(
          `conversation:${conversationId}`,
          JSON.stringify(conversationData),
          { ex: 86400 }
        )
      } catch (cacheErr) {
        console.warn("Could not cache to Redis:", cacheErr)
      }
    }

    return NextResponse.json(conversationData)
  } catch (error: any) {
    console.error("❌ Get conversation error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user from HTTP-only cookie
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id

    const { id } = await params
    const conversationId = parseInt(id)

    // Verify conversation belongs to user before deleting
    const conversation = await getConversation(conversationId, userId)
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Delete conversation and associated messages
    await deleteConversation(conversationId)

    // Clear Redis cache
    const redisClient = await getRedisClient()
    if (redisClient) {
      try {
        await redisClient.del(`conversation:${conversationId}`)
      } catch (cacheErr) {
        console.warn("Could not clear Redis cache:", cacheErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    })
  } catch (error: any) {
    console.error("❌ Delete conversation error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user from HTTP-only cookie
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id

    const { id } = await params
    const conversationId = parseInt(id)

    // Verify conversation belongs to user before updating
    const conversation = await getConversation(conversationId, userId)
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required and must be a string" },
        { status: 400 }
      )
    }

    // Update conversation title
    const updatedConversation = await updateConversationTitle(
      conversationId,
      userId,
      title
    )

    // Clear Redis cache
    const redisClient = await getRedisClient()
    if (redisClient) {
      try {
        await redisClient.del(`conversation:${conversationId}`)
      } catch (cacheErr) {
        console.warn("Could not clear Redis cache:", cacheErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        createdAt: updatedConversation.created_at,
        updatedAt: updatedConversation.updated_at,
      },
    })
  } catch (error: any) {
    console.error("❌ Update conversation error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
