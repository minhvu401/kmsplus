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

/**
 * Get current logged in user
 */
export async function getCurrentUserInfor() {
  await requireAuth()
  const user = await getCurrentUserInforAction()
  return user
}

/**
 * Get current user role
 */
export async function getUserRoleAction(): Promise<string | null> {
  try {
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
