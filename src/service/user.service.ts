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
  role?: string
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
    WHERE status = 'active'
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
    SELECT 
      u.id, 
      u.email, 
      u.full_name, 
      u.avatar_url,
      u.created_at,
      r.name as role
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email = ${email} AND u.status = 'active'
    LIMIT 1
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
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.avatar_url, 
        u.created_at,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ${id} AND u.status = 'active'
      LIMIT 1
    `
    return users.length > 0 ? (users[0] as User) : null
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export async function getUserDetail(id: string): Promise<User | null> {
  const users = await sql`
    SELECT id, email, full_name, avatar_url, created_at 
    FROM users 
    WHERE id = ${id} AND status = 'active'
  `
  return users.length > 0 ? (users[0] as User) : null
}

/**
 * Get current user profile with full details
 */
export async function getCurrentUserProfileAction(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = await verifyToken(token)
    const id = decoded.id

    const users = await sql`
      SELECT id, email, full_name, avatar_url, created_at 
      FROM users 
      WHERE id = ${id} AND status = 'active'
    `
    return users.length > 0 ? (users[0] as User) : null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
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
 * Update user profile (PATCH)
 */
export async function updateUserProfileAction(updateData: {
  full_name?: string
  avatar_url?: string
  department?: string
}): Promise<ServiceResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return {
      success: false,
      message: "Unauthorized",
    }
  }

  try {
    const decoded = await verifyToken(token)
    const id = decoded.id

    const users = await sql`
      SELECT full_name, avatar_url
      FROM users 
      WHERE id = ${id} AND status = 'active'
    `

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      }
    }

    const user = users[0]

    // Update only provided fields
    const updatedUser = {
      full_name: updateData.full_name ?? user.full_name,
      avatar_url: updateData.avatar_url ?? user.avatar_url,
    }

    await sql`
      UPDATE users 
      SET full_name = ${updatedUser.full_name}, 
          avatar_url = ${updatedUser.avatar_url}
      WHERE id = ${id}
    `

    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      message: "Failed to update profile",
    }
  }
}

/**
 * Update user password with verification of current password
 */
export async function updateUserPasswordAction(passwordData: {
  currentPassword: string
  newPassword: string
}): Promise<ServiceResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return {
      success: false,
      message: "Unauthorized",
    }
  }

  try {
    const decoded = await verifyToken(token)
    const id = decoded.id

    // Get user with password hash
    const users = await sql`
      SELECT id, email, password_hash
      FROM users 
      WHERE id = ${id} AND status = 'active'
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
      user.password_hash
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
      SET password_hash = ${hashedNewPassword}
      WHERE id = ${id}
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
      SET status = 'inactive'
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
