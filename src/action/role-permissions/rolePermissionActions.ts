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
    return { valid: false }
  }
}

/**
 * Get table schema info for debugging
 */
export async function getTableSchemaAction(): Promise<RolePermissionState> {
  try {
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'role_permissions'
      ORDER BY ordinal_position
    `

    return {
      success: true,
      message: "Schema fetched",
      data: tableInfo,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Get all role permissions from database
 */
export async function getRolePermissionsAction(): Promise<RolePermissionState> {
  try {
    const rolePermissions = await sql`
      SELECT 
        r.name as role,
        p.name as permission
      FROM role_permissions rp
      INNER JOIN roles r ON rp.role_id = r.id
      INNER JOIN permissions p ON rp.permission_id = p.id
      ORDER BY r.name, p.name
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
  const { valid, role } = await verifyRolePermissionManagement()

  if (!valid) {
    return {
      success: false,
      message: "Unauthorized: Only admins can manage role permissions",
    }
  }

  try {
    // Start transaction - delete all existing role_permissions and insert new ones
    // The role_permissions table uses role_id and permission_id (foreign keys)
    await sql.transaction((txn) => [
      txn`DELETE FROM role_permissions`,
      ...Object.entries(permissions).flatMap(([roleName, permissionNames]) =>
        permissionNames.map(
          (permissionName) =>
            txn`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            SELECT r.id, p.id, NOW()
            FROM roles r, permissions p
            WHERE r.name = ${roleName}
            AND p.name = ${permissionName}
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
    return {
      success: false,
      message: `Failed to update role permissions: ${error instanceof Error ? error.message : String(error)}`,
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
      SELECT p.name as permission
      FROM role_permissions rp
      INNER JOIN roles r ON rp.role_id = r.id
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = ${role}
      ORDER BY p.name
    `

    const permissions = rolePermissions.map((row: any) => row.permission)

    return {
      success: true,
      message: `Permissions for role ${role} fetched successfully`,
      data: permissions,
    }
  } catch (error) {
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
    // Get role_id and permission_ids, then delete and insert
    await sql.transaction((txn) => [
      txn`
        DELETE FROM role_permissions
        WHERE role_id = (SELECT id FROM roles WHERE name = ${role})
      `,
      ...permissions.map(
        (permissionName) =>
          txn`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          SELECT r.id, p.id, NOW()
          FROM roles r, permissions p
          WHERE r.name = ${role}
          AND p.name = ${permissionName}
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
