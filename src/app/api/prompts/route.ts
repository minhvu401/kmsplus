import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { Permission } from "@/enum/permission.enum"
import { Role } from "@/enum/role.enum"
import { hasPermissionDynamic } from "@/service/rolePermission.service"
import {
  getAllAIPrompts,
  getAIPromptByKey,
  upsertAIPrompt,
} from "@/service/aiPrompt.service"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

/**
 * GET /api/prompts
 * Get all AI prompts
 */
export async function GET() {
  try {
    // Verify admin access
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userRole = decoded.role as Role | undefined

    const hasPermissionFlag = await hasPermissionDynamic(
      userRole,
      Permission.MANAGE_SYSTEM
    )
    if (!hasPermissionFlag) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view prompts" },
        { status: 403 }
      )
    }

    const prompts = await getAllAIPrompts()

    return NextResponse.json({
      success: true,
      data: prompts,
    })
  } catch (error: any) {
    console.error("Error fetching prompts:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/prompts
 * Create or update AI prompt
 */
export async function POST(request: Request) {
  try {
    // Verify admin access
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userRole = decoded.role as Role | undefined

    const hasPermissionFlag = await hasPermissionDynamic(
      userRole,
      Permission.MANAGE_SYSTEM
    )
    if (!hasPermissionFlag) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to manage prompts" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { promptKey, title, description, content } = body

    if (!promptKey || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: promptKey, title, content" },
        { status: 400 }
      )
    }

    const result = await upsertAIPrompt(
      promptKey,
      title,
      description || "",
      content
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
      })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error saving prompt:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to save prompt" },
      { status: 500 }
    )
  }
}
