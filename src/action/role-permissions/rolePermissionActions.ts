// src/action/role/rolePermissionActions.ts
"use server"

import { sql } from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import { hasPermission } from "@/config/RolePermission.config"

export type RolePermissionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: any
}

/**
 * Verify that user has MANAGE_USERS permission (admin only)
 */
async function verifyRolePermissionManagement(): Promise<{
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

    // Only ADMIN can manage role permissions
    if (userRole !== Role.ADMIN) {
      return { valid: false }
    }

    return { valid: true, role: userRole }
  } catch (error) {
    console.error("Error verifying permission:", error)
    return { valid: false }
  }
}

/**
 * Get all role permissions from database
 */
export async function getRolePermissionsAction(): Promise<RolePermissionState> {
  try {
    // Get all role permissions
    const rolePermissions = await sql`
      SELECT 
        rp.role,
        rp.permission,
        r.name as role_name
      FROM role_permissions rp
      LEFT JOIN roles r ON rp.role = r.name
      ORDER BY rp.role, rp.permission
    `

    // Group by role
    const grouped: Record<string, string[]> = {}
    rolePermissions.forEach((row: any) => {
      if (!grouped[row.role]) {
        grouped[row.role] = []
      }
      grouped[row.role].push(row.permission)
    })

    return {
      success: true,
      message: "Role permissions fetched successfully",
      data: grouped,
    }
  } catch (error) {
    console.error("Error fetching role permissions:", error)
    return {
      success: false,
      message: "Failed to fetch role permissions",
    }
  }
}

/**
 * Update role permissions
 * Takes a mapping of Role -> Permission[]
 */
export async function updateRolePermissionsAction(
  permissions: Record<string, string[]>
): Promise<RolePermissionState> {
  const { valid } = await verifyRolePermissionManagement()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: Only admins can manage role permissions",
    }
  }

  try {
    // Start transaction - delete all existing role_permissions and insert new ones
    await sql.transaction((txn) => [
      txn`DELETE FROM role_permissions`,
      ...Object.entries(permissions).flatMap(([role, perms]) =>
        perms.map((permission) =>
          txn`
            INSERT INTO role_permissions (role, permission, created_at, updated_at)
            VALUES (${role}, ${permission}, NOW(), NOW())
          `
        )
      ),
    ])

    return {
      success: true,
      message: "Role permissions updated successfully",
      data: permissions,
    }
  } catch (error) {
    console.error("Error updating role permissions:", error)
    return {
      success: false,
      message: "Failed to update role permissions",
    }
  }
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissionsByRoleAction(
  role: Role
): Promise<RolePermissionState> {
  try {
    const rolePermissions = await sql`
      SELECT permission
      FROM role_permissions
      WHERE role = ${role}
      ORDER BY permission
    `

    const permissions = rolePermissions.map((row: any) => row.permission)

    return {
      success: true,
      message: `Permissions for role ${role} fetched successfully`,
      data: permissions,
    }
  } catch (error) {
    console.error("Error fetching role permissions:", error)
    return {
      success: false,
      message: "Failed to fetch role permissions",
    }
  }
}

/**
 * Update permissions for a specific role
 */
export async function updateRolePermissionsByRoleAction(
  role: Role,
  permissions: Permission[]
): Promise<RolePermissionState> {
  const { valid } = await verifyRolePermissionManagement()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: Only admins can manage role permissions",
    }
  }

  try {
    await sql.transaction((txn) => [
      txn`DELETE FROM role_permissions WHERE role = ${role}`,
      ...permissions.map((permission) =>
        txn`
          INSERT INTO role_permissions (role, permission, created_at, updated_at)
          VALUES (${role}, ${permission}, NOW(), NOW())
        `
      ),
    ])

    return {
      success: true,
      message: `Permissions for role ${role} updated successfully`,
      data: { role, permissions },
    }
  } catch (error) {
    console.error("Error updating role permissions:", error)
    return {
      success: false,
      message: "Failed to update role permissions",
    }
  }
}