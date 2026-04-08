"use server"

import { requireAuth } from "@/lib/auth"
import {
  getCurrentUserProfileAction,
  updateUserProfileAction,
  updateUserPasswordAction,
} from "@/service/user.service"
import { isValidFullName } from "@/utils/validation"

export type ProfileActionState = {
  success: boolean
  message: string
  data?: any
}

/**
 * Get current user profile
 */
export async function getProfileAction(): Promise<ProfileActionState> {
  try {
    await requireAuth()
    const user = await getCurrentUserProfileAction()

    if (!user) {
      return {
        success: false,
        message: "User not found",
      }
    }

    return {
      success: true,
      message: "Profile fetched successfully",
      data: user,
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return {
      success: false,
      message: "Failed to fetch profile",
    }
  }
}

/**
 * Update user profile information
 */
export async function updateProfileAction(
  formData: FormData
): Promise<ProfileActionState> {
  try {
    await requireAuth()

    const full_name = formData.get("full_name") as string
    const avatar_url = formData.get("avatar_url") as string

    if (!full_name && !avatar_url) {
      return {
        success: false,
        message: "Please provide at least one field to update",
      }
    }

    // Validate full_name format if provided
    if (full_name && !isValidFullName(full_name)) {
      return {
        success: false,
        message: "Full name must contain only letters, spaces, hyphens, and apostrophes",
      }
    }

    const result = await updateUserProfileAction({
      full_name: full_name || undefined,
      avatar_url: avatar_url || undefined,
    })

    return result
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      message: "Failed to update profile",
    }
  }
}

/**
 * Update user password
 */
export async function updatePasswordAction(
  formData: FormData
): Promise<ProfileActionState> {
  try {
    await requireAuth()

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        message: "Please fill in all password fields",
      }
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "New passwords do not match",
      }
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
      }
    }

    const result = await updateUserPasswordAction({
      currentPassword,
      newPassword,
    })

    return result
  } catch (error) {
    console.error("Error updating password:", error)
    return {
      success: false,
      message: "Failed to update password",
    }
  }
}
