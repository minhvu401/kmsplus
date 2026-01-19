import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"

/**
 * Mapping quyền cho từng role
 * Dựa trên bảng role_permissions trong database
 */
export const rolePermissionsMap: Record<Role, Permission[]> = {
  [Role.EMPLOYEE]: [
    Permission.READ_ARTICLE,
    Permission.READ_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.VOTE_ANSWER,
    Permission.READ_COURSE,
    Permission.ENROLL_COURSE,
  ],
  [Role.CONTRIBUTOR]: [
    Permission.READ_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.DELETE_ARTICLE,
    Permission.APPROVE_ARTICLE,
    Permission.READ_QUESTION,
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.VOTE_ANSWER,
    Permission.READ_COURSE,
    Permission.ENROLL_COURSE,
    Permission.MANAGE_USERS,
  ],
  [Role.TRAINING_MANAGER]: [
    Permission.READ_ARTICLE,
    Permission.READ_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.VOTE_ANSWER,
    Permission.READ_COURSE,
  ],
  [Role.ADMIN]: [
    Permission.READ_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.DELETE_ARTICLE,
    Permission.APPROVE_ARTICLE,
    Permission.READ_QUESTION,
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.VOTE_ANSWER,
    Permission.READ_COURSE,
    Permission.CREATE_COURSE,
    Permission.ENROLL_COURSE,
    Permission.MANAGE_USERS,
  ],
  [Role.DASHBOARD_VIEWER]: [
    Permission.READ_ARTICLE,
    Permission.READ_QUESTION,
    Permission.READ_COURSE,
  ],
}

/**
 * Kiểm tra user có role được cấp không
 */
export function hasRole(
  userRole: Role | undefined,
  requiredRole: Role
): boolean {
  return userRole === requiredRole
}

/**
 * Kiểm tra user có quyền được cấp không
 */
export function hasPermission(
  userRole: Role | undefined,
  requiredPermission: Permission
): boolean {
  if (!userRole) return false
  const permissions = rolePermissionsMap[userRole]
  return permissions.includes(requiredPermission)
}

/**
 * Kiểm tra user có tất cả quyền được cấp không
 */
export function hasAllPermissions(
  userRole: Role | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!userRole) return false
  const userPermissions = rolePermissionsMap[userRole]
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  )
}

/**
 * Kiểm tra user có ít nhất một trong các quyền được cấp không
 */
export function hasAnyPermission(
  userRole: Role | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!userRole) return false
  const userPermissions = rolePermissionsMap[userRole]
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  )
}
