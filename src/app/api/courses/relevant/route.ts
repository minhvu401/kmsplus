import { getCurrentUser } from "@/lib/auth"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { getPersonalizedCoursesService } from "@/service/course.service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/courses/relevant
 * Returns relevant courses based on current user's department
 */
export async function GET() {
  try {
    const { auth } = NextAuth(authConfig)
    const session = await auth()

    let userId = Number(session?.user?.id)

    if (!Number.isFinite(userId) || userId <= 0) {
      const user = await getCurrentUser()
      userId = Number(user?.id)
    }

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json(
        { courses: [], departmentName: null },
        { status: 200 }
      )
    }

    const result = await getPersonalizedCoursesService(userId, 8)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/courses/relevant:", error)
    return NextResponse.json(
      { error: "Failed to fetch relevant courses" },
      { status: 500 }
    )
  }
}
