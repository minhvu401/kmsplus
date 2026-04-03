import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"

export const rolePermissionsMap: Record<Role, Permission[]> = {
  // EMPLOYEE: 29 permissions (read, comment, enroll)
  [Role.EMPLOYEE]: [
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.SHARE_QUESTION,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.ENROLL_COURSE,
    Permission.REVIEW_COURSE,
    Permission.VIEW_QUIZ,
    Permission.VIEW_QUIZ_LIST,
    Permission.PARTICIPATE_QUIZ,
    Permission.VIEW_QUIZ_RESULT,
    Permission.VIEW_PERSONAL_PROGRESS,
    Permission.LANGUAGE_SETTING,
  ],

  // CONTRIBUTOR: 26 permissions (article write + Q&A read/create focus)
  [Role.CONTRIBUTOR]: [
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Articles - Full CRUD
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.DELETE_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    // Q&A - Similar to Employee
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.SHARE_QUESTION,
    Permission.LANGUAGE_SETTING,
  ],

  // TRAINING_MANAGER: 67 permissions (full training management)
  [Role.TRAINING_MANAGER]: [
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.APPROVE_ARTICLE,
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.OPEN_QUESTION,
    Permission.CLOSE_QUESTION,
    Permission.SHARE_QUESTION,
    Permission.CREATE_COURSE,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.APPROVE_COURSE,
    Permission.VIEW_COURSE_STATISTICS,
    Permission.CREATE_QUIZ,
    Permission.VIEW_QUIZ,
    Permission.UPDATE_QUIZ,
    Permission.DELETE_QUIZ,
    Permission.CREATE_QUIZ_QUESTION,
    Permission.EDIT_QUIZ_QUESTION,
    Permission.DELETE_QUIZ_QUESTION,
    Permission.VIEW_QUIZ_QUESTION,
    Permission.VIEW_QUIZ_LIST,
    Permission.VIEW_QUESTION_BANK,
    Permission.ENROLL_COURSE,
    Permission.PARTICIPATE_QUIZ,
    Permission.VIEW_PERSONAL_PROGRESS,
    Permission.VIEW_QUIZ_RESULT,
    Permission.REVIEW_COURSE,
    Permission.VIEW_ACCOUNT_LIST,
    Permission.SEARCH_ACCOUNT,
    Permission.CREATE_CATEGORY,
    Permission.VIEW_CATEGORY_LIST,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.SEARCH_CATEGORY,
    Permission.LANGUAGE_SETTING,
    Permission.VIEW_STATISTICS,
    Permission.VIEW_ROLE_PERMISSION,
    Permission.MODERATE_CONTENT,
    Permission.AI_RECOMMENDATION,
    Permission.AI_EXPLANATION,
  ],

  // DASHBOARD_VIEWER: 20 permissions (read-only access)
  [Role.DASHBOARD_VIEWER]: [
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.VIEW_QUIZ,
    Permission.VIEW_QUIZ_LIST,
    Permission.VIEW_QUESTION_BANK,
    Permission.VIEW_PERSONAL_PROGRESS,
    Permission.VIEW_QUIZ_RESULT,
    Permission.LANGUAGE_SETTING,
    Permission.VIEW_STATISTICS,
  ],

  // DIRECTOR: 20 permissions (read-only access - same as DASHBOARD_VIEWER)
  [Role.DIRECTOR]: [
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.VIEW_QUIZ,
    Permission.VIEW_QUIZ_LIST,
    Permission.VIEW_QUESTION_BANK,
    Permission.VIEW_PERSONAL_PROGRESS,
    Permission.VIEW_QUIZ_RESULT,
    Permission.LANGUAGE_SETTING,
    Permission.VIEW_STATISTICS,
  ],

  // ADMIN: 68 permissions (all permissions)
  [Role.ADMIN]: [
    // Authentication
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Articles
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.DELETE_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    Permission.APPROVE_ARTICLE,
    // Questions
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.OPEN_QUESTION,
    Permission.CLOSE_QUESTION,
    Permission.SHARE_QUESTION,
    // Courses
    Permission.CREATE_COURSE,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.ENROLL_COURSE,
    Permission.REVIEW_COURSE,
    Permission.APPROVE_COURSE,
    Permission.VIEW_COURSE_STATISTICS,
    // Quizzes
    Permission.CREATE_QUIZ,
    Permission.VIEW_QUIZ,
    Permission.UPDATE_QUIZ,
    Permission.DELETE_QUIZ,
    Permission.CREATE_QUIZ_QUESTION,
    Permission.EDIT_QUIZ_QUESTION,
    Permission.DELETE_QUIZ_QUESTION,
    Permission.VIEW_QUIZ_QUESTION,
    Permission.VIEW_QUIZ_LIST,
    Permission.PARTICIPATE_QUIZ,
    Permission.VIEW_QUIZ_RESULT,
    // Enrollment & Progress
    Permission.VIEW_QUESTION_BANK,
    Permission.VIEW_PERSONAL_PROGRESS,
    // User Management
    Permission.CREATE_ACCOUNT,
    Permission.VIEW_ACCOUNT_LIST,
    Permission.UPDATE_ACCOUNT,
    Permission.DEACTIVATE_ACCOUNT,
    Permission.SEARCH_ACCOUNT,
    Permission.MANAGE_USERS,
    // Categories
    Permission.CREATE_CATEGORY,
    Permission.VIEW_CATEGORY_LIST,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.SEARCH_CATEGORY,
    // System Administration
    Permission.MONITOR_ACTIVITY,
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_DATA,
    // System Settings
    Permission.LANGUAGE_SETTING,
    Permission.VIEW_ROLE_PERMISSION,
    Permission.EDIT_ROLE_PERMISSION,
    Permission.MODERATE_CONTENT,
    Permission.AI_EXPLANATION,
    Permission.AI_RECOMMENDATION,
    Permission.MANAGE_SYSTEM,
  ],
}

export function hasRole(
  userRole: Role | undefined,
  requiredRole: Role
): boolean {
  return userRole === requiredRole
}

/**
 * @deprecated Use hasPermissionDynamic from rolePermission.service instead
 * This is a synchronous fallback using hardcoded permissions
 * For critical authorization checks, use the dynamic version from the service
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
 * @deprecated Use hasAllPermissionsDynamic from rolePermission.service instead
 * This is a synchronous fallback using hardcoded permissions
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
 * @deprecated Use hasAnyPermissionDynamic from rolePermission.service instead
 * This is a synchronous fallback using hardcoded permissions
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
