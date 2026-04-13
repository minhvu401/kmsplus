import { requirePermission } from "@/lib/requirePermission"
import { NextRequest, NextResponse } from "next/server"
import { Permission } from "@/enum/permission.enum"
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
    await requirePermission(Permission.VIEW_PROFILE)
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
  } catch (error: any) {
    console.error("Error fetching profile:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      )
    }
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
    await requirePermission(Permission.VIEW_PROFILE)
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
  } catch (error: any) {
    console.error("Error updating profile:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    )
  }
}
