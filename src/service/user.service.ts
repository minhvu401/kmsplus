"use server"

import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

/**
 * Type cho User response
 */
export type User = {
  id: string
  email: string
  full_name: string | null
  // role?: string
  department?: string
  avatar_url?: string
  created_at?: Date
}

/**
 * Type cho Service Response
 */
export type ServiceResponse = {
  success: boolean
  message: string
  data?: any
}

/**
 * Get all users từ database (excluding soft deleted users)
 * Hàm này sẽ được wrap bởi withAuth trong userActions.ts
 */
export async function getAllUsersAction(): Promise<User[]> {
  const users = await sql`
    SELECT id, email, full_name
    FROM users 
    WHERE is_deleted = false OR is_deleted IS NULL
    ORDER BY created_at DESC
  `
  console.log("Fetched users:", users) // Debug log
  return users as User[]
}

/**
 * Get user by email (excluding soft deleted users)
 * Hàm này sẽ được wrap bởi withAuth trong userActions.ts
 */
export async function getUserByEmailAction(
  email: string
): Promise<User | null> {
  const users = await sql`
    SELECT id, email, full_name, created_at 
    FROM users 
    WHERE email = ${email} AND (is_deleted = false OR is_deleted IS NULL)
  `
  return users.length > 0 ? (users[0] as User) : null
}

export async function getCurrentUserInforAction(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = await verifyToken(token)
    const id = decoded.id

    const users = await sql`
      SELECT email, full_name, avatar_url, department, created_at 
      FROM users 
      WHERE id = ${id} AND (is_deleted = false OR is_deleted IS NULL)
    `
    return users.length > 0 ? (users[0] as User) : null
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export async function getUserDetail(id: string): Promise<User | null> {
  const users = await sql`
    SELECT  email, full_name, avatar_url, department, created_at 
    FROM users 
    WHERE id = ${id} AND (is_deleted = false OR is_deleted IS NULL)
  `
  return users.length > 0 ? (users[0] as User) : null
}

/**
 * Create new user
 */
export async function createUserAction(userData: {
  email: string
  password: string
  name: string
}): Promise<ServiceResponse> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmailAction(userData.email)
    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create user
    await sql`
      INSERT INTO users (email, hash_password, full_name, created_at)
      VALUES (${userData.email}, ${hashedPassword}, ${userData.name}, NOW())
    `

    return {
      success: true,
      message: "User created successfully",
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return {
      success: false,
      message: "Failed to create user",
    }
  }
}

/**
 * Update user information
 */
export async function updateUserAction(
  email: string,
  updateData: {
    name?: string
  }
): Promise<ServiceResponse> {
  try {
    // Check if user exists
    const user = await getUserByEmailAction(email)
    if (!user) {
      return {
        success: false,
        message: "User not found",
      }
    }

    // Build update query dynamically
    const updates: string[] = []

    if (updateData.name !== undefined) {
      updates.push(`full_name = '${updateData.name}'`)
    }

    if (updates.length === 0) {
      return {
        success: false,
        message: "No data to update",
      }
    }

    await sql`
      UPDATE users 
      SET ${sql.unsafe(updates.join(", "))} 
      WHERE email = ${email}
    `

    return {
      success: true,
      message: "User updated successfully",
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return {
      success: false,
      message: "Failed to update user",
    }
  }
}

/**
 * Update user password
 */
export async function updateUserPasswordAction(
  email: string,
  passwordData: {
    currentPassword: string
    newPassword: string
  }
): Promise<ServiceResponse> {
  try {
    // Get user with password
    const users = await sql`
      SELECT id, email, password
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      }
    }

    const user = users[0]

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      passwordData.currentPassword,
      user.password
    )

    if (!isValidPassword) {
      return {
        success: false,
        message: "Current password is incorrect",
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10)

    // Update password
    await sql`
      UPDATE users 
      SET password = ${hashedNewPassword}
      WHERE email = ${email}
    `

    return {
      success: true,
      message: "Password updated successfully",
    }
  } catch (error) {
    console.error("Error updating password:", error)
    return {
      success: false,
      message: "Failed to update password",
    }
  }
}

/**
 * Delete user by email (Soft delete)
 */
export async function deleteUserAction(
  email: string
): Promise<ServiceResponse> {
  try {
    // Check if user exists
    const user = await getUserByEmailAction(email)
    if (!user) {
      return {
        success: false,
        message: "User not found",
      }
    }

    await sql`
      UPDATE users 
      SET is_deleted = true, deleted_at = NOW()
      WHERE email = ${email}
    `

    return {
      success: true,
      message: "User deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    return {
      success: false,
      message: "Failed to delete user",
    }
  }
}
