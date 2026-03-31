import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { updateArticlesStatusConstraint } from "@/service/articles.service"

export async function POST(request: Request) {
  try {
    // Require authentication
    await requireAuth()
    const result = await updateArticlesStatusConstraint()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to setup articles constraint",
      },
      { status: 500 }
    )
  }
}
