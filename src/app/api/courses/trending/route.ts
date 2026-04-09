import { getCurrentUser } from "@/lib/auth"
import { getTrendingCoursesService } from "@/service/course.service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/courses/trending
 * Returns trending courses based on enrollment count
 */
export async function GET() {
  try {
    await getCurrentUser()
    const result = await getTrendingCoursesService(12)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/courses/trending:", error)
    return NextResponse.json(
      { error: "Failed to fetch trending courses" },
      { status: 500 }
    )
  }
}
