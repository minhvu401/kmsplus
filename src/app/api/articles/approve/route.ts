import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { approveArticleAction } from "@/service/articles.service"

export async function POST(request: Request) {
  try {
    const user = await requirePermission(Permission.APPROVE_ARTICLE)
    const { id } = await request.json()
    const articleId = Number(id)
    if (!articleId) {
      return NextResponse.json(
        { success: false, message: "Invalid article id" },
        { status: 400 }
      )
    }

    const result = await approveArticleAction(articleId, Number(user.id))
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Approve article error:", error)
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
      {
        success: false,
        message: error?.message || "Failed to approve article",
      },
      { status: 500 }
    )
  }
}
