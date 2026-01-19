"use server"

import { sql } from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import { hasPermission } from "@/config/RolePermission.config"

export type UserManagementState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: any
}

/**
 * Check if user has MANAGE_USERS permission
 */
async function verifyUserManagementPermission(): Promise<{
  valid: boolean
  role?: Role
}> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return { valid: false }
    }

    const decoded = await verifyToken(token)
    const userRole = decoded.role as Role

    // Check if user has permission to manage users
    if (!hasPermission(userRole, Permission.MANAGE_USERS)) {
      return { valid: false }
    }

    return { valid: true, role: userRole }
  } catch (error) {
    console.error("Error verifying permission:", error)
    return { valid: false }
  }
}

/**
 * Create user by admin
 */
export async function createUserByAdminAction(
  prevState: UserManagementState,
  formData: FormData
): Promise<UserManagementState> {
  const { valid, role } = await verifyUserManagementPermission()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: You do not have permission to create users",
    }
  }

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const roleId = formData.get("roleId") as string

  // Validate inputs
  const errors: Record<string, string[]> = {}

  if (!email || !email.includes("@")) {
    errors.email = ["Email is required and must be valid"]
  }

  if (!password || password.length < 6) {
    errors.password = ["Password must be at least 6 characters"]
  }

  if (!fullName || fullName.trim().length === 0) {
    errors.fullName = ["Full name is required"]
  }

  if (!roleId) {
    errors.roleId = ["Role is required"]
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Validation failed",
      errors,
    }
  }

  try {
    // Check if user already exists (including soft deleted users)
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return {
        success: false,
        message: "User with this email already exists",
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const createUserResult = await sql`
      INSERT INTO users (email, password_hash, full_name, created_at)
      VALUES (${email}, ${hashedPassword}, ${fullName}, NOW())
      RETURNING id
    `

    const userId = createUserResult[0]?.id

    if (!userId) {
      return {
        success: false,
        message: "Failed to create user",
      }
    }

    // Assign role to user
    try {
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${userId}, ${roleId})
      `
    } catch (roleError) {
      // If role already exists, update it
      if ((roleError as any)?.code === "23505") {
        // Unique violation
        await sql`
          UPDATE user_roles SET role_id = ${roleId}
          WHERE user_id = ${userId}
        `
      } else {
        throw roleError
      }
    }

    return {
      success: true,
      message: `User ${email} created successfully with role assigned`,
      data: { userId, email, fullName },
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
 * Get all users (for admin management)
 */
export async function getAllUsersForManagementAction(): Promise<UserManagementState> {
  const { valid } = await verifyUserManagementPermission()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: You do not have permission to view users",
    }
  }

  try {
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.avatar_url,
        u.created_at,
        u.is_active,
        r.name as role_name,
        ur.role_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.is_deleted = false OR u.is_deleted IS NULL
      ORDER BY u.created_at DESC
    `

    return {
      success: true,
      message: "Users retrieved successfully",
      data: users,
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return {
      success: false,
      message: "Failed to fetch users",
    }
  }
}

/**
 * Update user role
 */
export async function updateUserRoleAction(
  prevState: UserManagementState,
  formData: FormData
): Promise<UserManagementState> {
  const { valid } = await verifyUserManagementPermission()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: You do not have permission to update users",
    }
  }

  const userId = formData.get("userId") as string
  const roleId = formData.get("roleId") as string

  if (!userId || !roleId) {
    return {
      success: false,
      message: "User ID and Role ID are required",
    }
  }

  try {
    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      }
    }

    // Check if user role exists
    const existingRoles = await sql`
      SELECT user_id FROM user_roles WHERE user_id = ${userId}
    `

    if (existingRoles.length > 0) {
      // Update existing role
      await sql`
        UPDATE user_roles SET role_id = ${roleId}
        WHERE user_id = ${userId}
      `
    } else {
      // Insert new role
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${userId}, ${roleId})
      `
    }

    return {
      success: true,
      message: "User role updated successfully",
      data: { userId, roleId },
    }
  } catch (error) {
    console.error("Error updating user role:", error)
    return {
      success: false,
      message: "Failed to update user role",
    }
  }
}
/**
 * Update user information
 */
export async function updateUserInfoAction(
  prevState: UserManagementState,
  formData: FormData
): Promise<UserManagementState> {
  const { valid } = await verifyUserManagementPermission()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: You do not have permission to update users",
    }
  }

  const userId = formData.get("userId") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string

  console.log("Update request:", { userId, fullName, email })

  if (!userId) {
    return {
      success: false,
      message: "User ID is required",
    }
  }

  const errors: Record<string, string[]> = {}

  if (email && !email.includes("@")) {
    errors.email = ["Email must be valid"]
  }

  if (fullName && fullName.trim().length === 0) {
    errors.fullName = ["Full name cannot be empty"]
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Validation failed",
      errors,
    }
  }

  try {
    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      }
    }

    // Check if new email already exists (if changing email)
    if (email) {
      const existingEmails = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId}
      `

      if (existingEmails.length > 0) {
        return {
          success: false,
          message: "Email already exists",
        }
      }
    }

    // Update user - use parameterized queries
    if (email && fullName) {
      await sql`
        UPDATE users 
        SET email = ${email}, full_name = ${fullName}
        WHERE id = ${userId}
      `
    } else if (email) {
      await sql`
        UPDATE users 
        SET email = ${email}
        WHERE id = ${userId}
      `
    } else if (fullName) {
      await sql`
        UPDATE users 
        SET full_name = ${fullName}
        WHERE id = ${userId}
      `
    }

    console.log("User updated successfully:", userId)

    return {
      success: true,
      message: "User information updated successfully",
      data: { userId, email, fullName },
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
 * Deactivate/Activate user (Ban/Unban)
 */
export async function banUserAction(
  prevState: UserManagementState,
  formData: FormData
): Promise<UserManagementState> {
  const { valid } = await verifyUserManagementPermission()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: You do not have permission to deactivate users",
    }
  }

  const userId = formData.get("userId") as string
  const currentStatus = formData.get("currentStatus") as string // "active" or "inactive"

  if (!userId) {
    return {
      success: false,
      message: "User ID is required",
    }
  }

  try {
    // Check if user exists
    const users = await sql`
      SELECT id, is_active FROM users WHERE id = ${userId}
    `

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      }
    }

    // Toggle active status - convert string to opposite
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    await sql`
      UPDATE users 
      SET is_active = ${newStatus}
      WHERE id = ${userId}
    `

    return {
      success: true,
      message:
        newStatus === "active"
          ? "User activated successfully"
          : "User deactivated successfully",
      data: { userId, isActive: newStatus },
    }
  } catch (error) {
    console.error("Error deactivating user:", error)
    return {
      success: false,
      message: "Failed to deactivate/activate user",
    }
  }
}
