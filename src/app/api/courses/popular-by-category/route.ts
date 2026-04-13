import { getCurrentUser } from "@/lib/auth"
import { getPopularCoursesByCategoryService } from "@/service/course.service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/courses/popular-by-category
 * Returns popular courses grouped by category (top 3 per category, max 12 total)
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    const userId = user ? Number(user.id) : 0

    const result = await getPopularCoursesByCategoryService(userId, 12, 3)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/courses/popular-by-category:", error)
    return NextResponse.json(
      { error: "Failed to fetch popular courses" },
      { status: 500 }
    )
  }
}
