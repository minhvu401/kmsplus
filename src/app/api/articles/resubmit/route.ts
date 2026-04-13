import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { resubmitArticleAction } from "@/service/articles.service"

export async function POST(request: Request) {
  try {
    const user = await requirePermission(Permission.UPDATE_ARTICLE)
    const { id, title, content, tags, category_id, image_url, thumbnail_url } =
      await request.json()

    const articleId = Number(id)
    if (!articleId) {
      return NextResponse.json(
        { success: false, message: "Invalid article id" },
        { status: 400 }
      )
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 }
      )
    }

    const result = await resubmitArticleAction(
      articleId,
      title,
      content,
      tags,
      category_id,
      image_url,
      thumbnail_url
    )
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Resubmit article error:", error)
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
        message: error?.message || "Failed to resubmit article",
      },
      { status: 500 }
    )
  }
}
