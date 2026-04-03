import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { Permission } from "@/enum/permission.enum"
import { Role } from "@/enum/role.enum"
import { hasPermissionDynamic } from "@/service/rolePermission.service"
import { initializeDefaultPrompts } from "@/service/aiPrompt.service"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

/**
 * POST /api/setup/ai-prompts
 * Initialize AI prompts table with default values
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
        { error: "Forbidden: You don't have permission to setup AI prompts" },
        { status: 403 }
      )
    }

    await initializeDefaultPrompts()

    return NextResponse.json({
      success: true,
      message: "AI prompts initialized successfully",
    })
  } catch (error: any) {
    console.error("Error initializing AI prompts:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to initialize AI prompts" },
      { status: 500 }
    )
  }
}
