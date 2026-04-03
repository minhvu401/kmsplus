/**
 * Static Role-Permission Service
 * Uses hardcoded config from RolePermission.config.ts instead of database
 */

import { rolePermissionsMap } from "@/config/RolePermission.config"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"

/**
 * Get all role permissions from static config
 * Returns a map of Role -> Permission[]
 */
export async function getRolePermissionsMap(): Promise<
  Map<Role, Permission[]>
> {
  // Convert the static config to Map format
  const permissionsMap = new Map<Role, Permission[]>()

  for (const [role, permissions] of Object.entries(rolePermissionsMap)) {
    permissionsMap.set(role as Role, permissions as Permission[])
  }

  return permissionsMap
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(role: Role): Promise<Permission[]> {
  return rolePermissionsMap[role] || []
}

/**
 * Check if a role has a specific permission
 */
export async function hasPermissionDynamic(
  userRole: Role | undefined,
  requiredPermission: Permission
): Promise<boolean> {
  if (!userRole) return false

  try {
    const permissions = await getRolePermissions(userRole)
    return permissions.includes(requiredPermission)
  } catch (error) {
    console.error("❌ Error checking permission:", error)
    return false
  }
}

/**
 * Check if a role has all specified permissions
 */
export async function hasAllPermissionsDynamic(
  userRole: Role | undefined,
  requiredPermissions: Permission[]
): Promise<boolean> {
  if (!userRole) return false

  try {
    const userPermissions = await getRolePermissions(userRole)
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    )
  } catch (error) {
    console.error("❌ Error checking permissions:", error)
    return false
  }
}

/**
 * Check if a role has at least one of the specified permissions
 */
export async function hasAnyPermissionDynamic(
  userRole: Role | undefined,
  requiredPermissions: Permission[]
): Promise<boolean> {
  if (!userRole) return false

  try {
    const userPermissions = await getRolePermissions(userRole)
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    )
  } catch (error) {
    console.error("❌ Error checking permissions:", error)
    return false
  }
}
