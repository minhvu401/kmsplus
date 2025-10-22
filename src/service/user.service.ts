"use server"

import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

/**
 * Type cho User response
 */
export type User = {
  id: string
  email: string
  full_name: string | null
  role?: string
  is_active?: boolean
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
    SELECT id, email, full_name, role, is_active, created_at 
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
    SELECT id, email, full_name, role, is_active, created_at 
    FROM users 
    WHERE email = ${email} AND (is_deleted = false OR is_deleted IS NULL)
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
  role: string
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
      INSERT INTO users (email, password, full_name, role, is_active)
      VALUES (${userData.email}, ${hashedPassword}, ${userData.name}, ${userData.role}, true)
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
    role?: string
    isActive?: boolean
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

    if (updateData.role !== undefined) {
      updates.push(`role = '${updateData.role}'`)
    }

    if (updateData.isActive !== undefined) {
      updates.push(`is_active = ${updateData.isActive}`)
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

    // Soft delete user - set is_deleted = true and deleted_at timestamp
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
