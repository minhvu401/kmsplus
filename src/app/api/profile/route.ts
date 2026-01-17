import { requireAuth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import {
  getCurrentUserInforAction,
  updateUserProfileAction,
  updateUserPasswordAction,
} from "@/service/user.service"

/**
 * GET /api/profile - Get current user profile
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const user = await getCurrentUserInforAction()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profile - Update user profile
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    const { full_name, avatar_url, department } = body

    if (!full_name && !avatar_url && !department) {
      return NextResponse.json(
        { success: false, message: "No data to update" },
        { status: 400 }
      )
    }

    const user = await getCurrentUserInforAction()
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    const result = await updateUserProfileAction({
      full_name,
      avatar_url,
      department,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    )
  }
}
