import { getCurrentUser } from "@/lib/auth"
import { getUserEnrolledCoursesService } from "@/service/course.service"
import { NextResponse } from "next/server"

/**
 * GET /api/courses/resume
 * Returns courses the user is enrolled in and actively taking (not completed)
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ courses: [] }, { status: 200 })
    }

    const result = await getUserEnrolledCoursesService(Number(user.id), 4)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/courses/resume:", error)
    return NextResponse.json(
      { error: "Failed to fetch resume courses" },
      { status: 500 }
    )
  }
}
