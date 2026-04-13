import { NextRequest, NextResponse } from "next/server"
import { hasPermissionDynamic } from "@/service/rolePermission.service"
import { getCurrentUser } from "@/lib/auth"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import * as service from "@/service/ai-suggestion.service"

/**
 * GET /api/ai-suggestion
 * Get latest pending suggestion or all suggestions (with query params)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check AI_RECOMMENDATION permission for reading suggestions
    const hasPermission = await hasPermissionDynamic(
      user.role as Role,
      Permission.AI_RECOMMENDATION
    )
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden - Permission denied" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") // "pending" or "topics"
    const days = parseInt(searchParams.get("days") || "30")

    if (type === "topics") {
      // Analyze topics
      const topics = await service.analyzeTopic(days)
      return NextResponse.json({
        success: true,
        data: topics,
      })
    }

    // Default: get latest pending suggestion
    const suggestion = await service.getLatestSuggestion()
    return NextResponse.json({
      success: true,
      data: suggestion,
    })
  } catch (error: any) {
    console.error("Error in GET /api/ai-suggestion:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to fetch suggestion" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai-suggestion
 * Create a new suggestion (requires AI_RECOMMENDATION permission)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check AI_RECOMMENDATION permission
    const hasPermission = await hasPermissionDynamic(
      user.role as Role,
      Permission.AI_RECOMMENDATION
    )
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden - Admin permission required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { days = 30 } = body

    // Check if should create new suggestion
    const shouldCreate = await service.shouldCreateNewSuggestion(days)
    if (!shouldCreate) {
      return NextResponse.json(
        { error: "A similar suggestion already exists" },
        { status: 400 }
      )
    }

    // Get top topic
    const topTopic = await service.getTopTopic(days)
    if (!topTopic) {
      return NextResponse.json(
        { error: "No topics found in Q&A" },
        { status: 400 }
      )
    }

    // Save suggestion
    const suggestion = await service.saveSuggestion(
      topTopic.topic,
      topTopic.count,
      days
    )

    return NextResponse.json({
      success: true,
      data: suggestion,
      message: `Created suggestion for topic: "${topTopic.topic}"`,
    })
  } catch (error: any) {
    console.error("Error in POST /api/ai-suggestion:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to create suggestion" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ai-suggestion/:id
 * Update suggestion status (requires AI_RECOMMENDATION permission)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check AI_RECOMMENDATION permission
    const hasPermission = await hasPermissionDynamic(
      user.role as Role,
      Permission.AI_RECOMMENDATION
    )
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden - Permission denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !["approved", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid id or status" },
        { status: 400 }
      )
    }

    const updated = await service.updateSuggestionStatus(
      id,
      status,
      user.id as any
    )

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error: any) {
    console.error("Error in PATCH /api/ai-suggestion:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json(
      { error: "Failed to update suggestion" },
      { status: 500 }
    )
  }
}
