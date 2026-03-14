"use server"

import { requireAuth, getCurrentUser, verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import {
  getAllUsersAction,
  getUserByEmailAction,
  updateUserAction,
  deleteUserAction,
  createUserAction,
  updateUserPasswordAction,
  getCurrentUserInforAction,
} from "@/service/user.service"
import { revalidatePath } from "next/cache"

type AuthPayload = {
  email?: string
  user?: {
    email?: string
  }
} | null

function getAuthenticatedEmail(payload: AuthPayload): string | null {
  return payload?.user?.email ?? payload?.email ?? null
}

/**
 * Get current logged in user
 * Works with both NextAuth and JWT token authentication
 */
export async function getCurrentUserInfor() {
  try {
    // Try current auth session first
    const authPayload = (await getCurrentUser()) as AuthPayload
    const email = getAuthenticatedEmail(authPayload)
    if (email) {
      try {
        const user = await getUserByEmailAction(email)
        if (user) {
          return user
        }
        // If user not found in DB, don't fall back to JWT - just return null
        console.warn("User email from auth session not found in database:", email)
        return null
      } catch (error) {
        console.error("Error fetching user by email from auth session:", error)
        // If auth session exists, don't try JWT fallback
        // Return null instead of throwing
        return null
      }
    }
    
    // Only try JWT token if NO NextAuth session exists
    try {
      await requireAuth()
      const user = await getCurrentUserInforAction()
      return user
    } catch (error) {
      console.error("Error in JWT auth fallback:", error)
      // If JWT also fails, return null instead of throwing
      return null
    }
  } catch (error) {
    console.error("Error in getCurrentUserInfor:", error)
    return null
  }
}

/**
 * Get current user role
 * Works with both NextAuth and JWT authentication
 */
export async function getUserRoleAction(): Promise<string | null> {
  try {
    // Try current auth session first
    const authPayload = (await getCurrentUser()) as AuthPayload
    const email = getAuthenticatedEmail(authPayload)
    if (email) {
      const user = await getUserByEmailAction(email)
      if (user) {
        // Get user's role from database
        // This would typically join with user_roles table
        return user.role ?? null
      }
    }
    
    // Fallback to JWT token
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return null
    }

    const decoded = await verifyToken(token)
    return decoded.role ?? null
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

/**
 * Get all users (protected)
 */
export async function getAllUsers() {
  await requireAuth()
  return getAllUsersAction()
}

/**
 * Get user by email (protected)
 */
export async function getUserByEmail(email: string) {
  await requireAuth()
  return getUserByEmailAction(email)
}

/**
 * Create new user (protected)
 */
export async function createUser(formData: FormData) {
  await requireAuth()

  const userData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
    role: (formData.get("role") as string) || "USER",
  }

  const result = await createUserAction(userData)

  if (result.success) {
    revalidatePath("/dashboard/users")
  }

  return result
}

/**
 * Update user information by email (protected)
 */
export async function updateUser(email: string, formData: FormData) {
  await requireAuth()

  const updateData = {
    name: formData.get("name") as string,
    role: formData.get("role") as string,
    isActive: formData.get("isActive") === "true",
  }

  const result = await updateUserAction(email, updateData)

  if (result.success) {
    revalidatePath("/dashboard/users")
    revalidatePath("/profile")
  }

  return result
}

/**
 * Update user password (protected)
 */
export async function updateUserPassword(email: string, formData: FormData) {
  await requireAuth()

  const passwordData = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
  }

  const result = await updateUserPasswordAction(passwordData)

  if (result.success) {
    revalidatePath("/profile")
  }

  return result
}

/**
 * Delete user by email (protected)
 */
export async function deleteUser(email: string) {
  await requireAuth()

  const result = await deleteUserAction(email)

  if (result.success) {
    revalidatePath("/dashboard/users")
  }

  return result
}
