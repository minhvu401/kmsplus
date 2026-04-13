import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getConversationsByUserId } from "@/service/chat.service"

export async function GET(request: Request) {
  try {
    // Get authenticated user from HTTP-only cookie
    const user = await requireAuth()
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const conversations = await getConversationsByUserId(userId, limit, offset)

    return NextResponse.json({
      success: true,
      data: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      })),
    })
  } catch (error: any) {
    console.error("❌ List conversations error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
