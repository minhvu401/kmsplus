// src/action/role/rolePermissionActions.ts
"use server"

import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import { rolePermissionsMap } from "@/config/RolePermission.config"

export type RolePermissionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: any
}

/**
 * Get all role permissions from static config
 * @deprecated Use rolePermissionsMap from RolePermission.config directly
 */
export async function getRolePermissionsAction(): Promise<RolePermissionState> {
  try {
    // Convert static rolePermissionsMap to the expected format
    const grouped: Record<string, Permission[]> = {}

    for (const [role, permissions] of Object.entries(rolePermissionsMap)) {
      grouped[role] = permissions
    }

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
 * Update role permissions - NO LONGER SUPPORTED
 * Role permissions are now static and defined in RolePermission.config.ts
 * To change permissions, edit the config file directly.
 * @deprecated This action is no longer supported. Edit RolePermission.config.ts instead.
 */
export async function updateRolePermissionsAction(
  permissions: Record<string, string[]>
): Promise<RolePermissionState> {
  return {
    success: false,
    message:
      "This action is no longer supported. Role permissions are now static. Edit RolePermission.config.ts to change permissions.",
  }
}

/**
 * Get permissions for a specific role - NO LONGER USED
 * @deprecated Use rolePermissionsMap from RolePermission.config directly
 */
export async function getRolePermissionsByRoleAction(
  role: Role
): Promise<RolePermissionState> {
  try {
    const permissions = rolePermissionsMap[role] || []
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
 * Update permissions for a specific role - NO LONGER SUPPORTED
 * @deprecated This action is no longer supported. Edit RolePermission.config.ts instead.
 */
export async function updateRolePermissionsByRoleAction(
  role: Role,
  permissions: Permission[]
): Promise<RolePermissionState> {
  return {
    success: false,
    message:
      "This action is no longer supported. Role permissions are now static. Edit RolePermission.config.ts to change permissions.",
  }
}
