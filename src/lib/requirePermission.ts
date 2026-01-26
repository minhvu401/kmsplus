/**
 * Permission & Role validation utilities for Server Actions
 */
import { requireAuth, getUserRole } from "@/lib/auth"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "@/config/RolePermission.config"
import { AuthUser } from "./auth"

export async function requirePermission(
  permission: Permission
): Promise<AuthUser> {
  const user = await requireAuth()
  const userRole = user.role as Role

  if (!hasPermission(userRole, permission)) {
    throw new Error(`Unauthorized: Missing permission '${permission}'`)
  }

  return user
}

export async function requireAllPermissions(
  permissions: Permission[]
): Promise<AuthUser> {
  const user = await requireAuth()
  const userRole = user.role as Role

  if (!hasAllPermissions(userRole, permissions)) {
    throw new Error(
      `Unauthorized: Missing required permissions [${permissions.join(", ")}]`
    )
  }

  return user
}

export async function requireAnyPermission(
  permissions: Permission[]
): Promise<AuthUser> {
  const user = await requireAuth()
  const userRole = user.role as Role

  if (!hasAnyPermission(userRole, permissions)) {
    throw new Error(
      `Unauthorized: Must have at least one of these permissions [${permissions.join(", ")}]`
    )
  }

  return user
}

export async function requireRole(role: Role): Promise<AuthUser> {
  const user = await requireAuth()
  const userRole = user.role as Role

  if (userRole !== role) {
    throw new Error(`Unauthorized: Required role '${role}'`)
  }

  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(Role.ADMIN)
}
