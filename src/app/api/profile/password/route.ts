import { requireAuth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { updateUserPasswordAction } from "@/service/user.service"

/**
 * PATCH /api/profile/password - Update password
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    const { currentPassword, newPassword, confirmPassword } = body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Please fill in all password fields" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const result = await updateUserPasswordAction({
      currentPassword,
      newPassword,
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
    })
  } catch (error) {
    console.error("Error updating password:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update password" },
      { status: 500 }
    )
  }
}
