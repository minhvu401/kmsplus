import { getCurrentUser } from "@/lib/auth"
import { getPersonalizedCoursesService } from "@/service/course.service"
import { NextResponse } from "next/server"

/**
 * GET /api/courses/personalized
 * Returns personalized courses based on user's department
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ courses: [] }, { status: 200 })
    }

    const result = await getPersonalizedCoursesService(Number(user.id), 8)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/courses/personalized:", error)
    return NextResponse.json(
      { error: "Failed to fetch personalized courses" },
      { status: 500 }
    )
  }
}
