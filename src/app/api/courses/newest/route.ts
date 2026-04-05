import { getCurrentUser } from "@/lib/auth"
import { getNewestCoursesService } from "@/service/course.service"
import { NextResponse } from "next/server"

/**
 * GET /api/courses/newest
 * Returns newest courses sorted by created_at DESC
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    const userId = user ? Number(user.id) : 0

    const result = await getNewestCoursesService(userId, 12)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/courses/newest:", error)
    return NextResponse.json(
      { error: "Failed to fetch newest courses" },
      { status: 500 }
    )
  }
}
