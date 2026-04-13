import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { rejectArticleAction } from "@/service/articles.service"

export async function POST(request: Request) {
  try {
    const user = await requirePermission(Permission.APPROVE_ARTICLE)
    const { id, reason } = await request.json()
    const articleId = Number(id)
    if (!articleId) {
      return NextResponse.json(
        { success: false, message: "Invalid article id" },
        { status: 400 }
      )
    }

    const result = await rejectArticleAction(
      articleId,
      reason || "",
      Number(user.id)
    )
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Reject article error:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to reject article" },
      { status: 500 }
    )
  }
}
