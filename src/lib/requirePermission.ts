/**
 * Permission & Role validation utilities for Server Actions
 * Dùng để validate quyền của user trước khi thực hiện action
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

/**
 * Require user có quyền cụ thể
 * @param permission - Permission cần check
 * @example
 * export async function createArticleAction(data: any) {
 *   const user = await requirePermission(Permission.CREATE_ARTICLE)
 *   // ... thực hiện logic
 * }
 */
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

/**
 * Require user có TẤT CẢ quyền được yêu cầu
 * @param permissions - Danh sách permissions cần check
 * @example
 * export async function updateArticleAction(data: any) {
 *   const user = await requireAllPermissions([
 *     Permission.UPDATE_ARTICLE,
 *     Permission.APPROVE_ARTICLE
 *   ])
 *   // ...
 * }
 */
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

/**
 * Require user có ÍT NHẤT MỘT trong các quyền được yêu cầu
 * @param permissions - Danh sách permissions để check
 * @example
 * export async function moderateArticleAction(data: any) {
 *   const user = await requireAnyPermission([
 *     Permission.APPROVE_ARTICLE,
 *     Permission.DELETE_ARTICLE
 *   ])
 *   // ...
 * }
 */
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

/**
 * Require user có role cụ thể
 * @param role - Role cần check
 * @example
 * export async function deleteUserAction(id: string) {
 *   const user = await requireRole(Role.ADMIN)
 *   // ...
 * }
 */
export async function requireRole(role: Role): Promise<AuthUser> {
  const user = await requireAuth()
  const userRole = user.role as Role

  if (userRole !== role) {
    throw new Error(`Unauthorized: Required role '${role}'`)
  }

  return user
}

/**
 * Require user là ADMIN
 * @example
 * export async function deleteUserAction(id: string) {
 *   const user = await requireAdmin()
 *   // ...
 * }
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(Role.ADMIN)
}
