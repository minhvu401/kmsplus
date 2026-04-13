import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { updateArticlesStatusConstraint } from "@/service/articles.service"

export async function POST(request: Request) {
  try {
    // Require MANAGE_SYSTEM permission
    await requirePermission(Permission.MANAGE_SYSTEM)
    const result = await updateArticlesStatusConstraint()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Setup error:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to setup articles constraint",
      },
      { status: 500 }
    )
  }
}
