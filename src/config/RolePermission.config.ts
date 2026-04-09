import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"

export const rolePermissionsMap: Record<Role, Permission[]> = {
  // EMPLOYEE: 31 perms - xem, bình luận, tham gia (không tạo nội dung)
  [Role.EMPLOYEE]: [
    // Access
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Articles - read only + comment
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    // Questions - read + answer
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.OPEN_QUESTION,
    Permission.CLOSE_QUESTION,
    Permission.SHARE_QUESTION,
    // Courses & Quizzes
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.ENROLL_COURSE,
    Permission.REVIEW_COURSE,
    Permission.VIEW_QUIZ,
    Permission.VIEW_QUIZ_LIST,
    Permission.VIEW_QUIZ_QUESTION,
    Permission.PARTICIPATE_QUIZ,
    Permission.VIEW_QUIZ_RESULT,
    Permission.VIEW_PERSONAL_PROGRESS,
    // Settings
    Permission.LANGUAGE_SETTING,
    Permission.AI_RECOMMENDATION,
    Permission.AI_EXPLANATION,
  ],

  // CONTRIBUTOR: 33 perms - tạo bài viết + câu hỏi (không phê duyệt)
  [Role.CONTRIBUTOR]: [
    // Access
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Articles - full CRUD (không approve)
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    // Questions - full CRUD (không delete articles)
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.OPEN_QUESTION,
    Permission.CLOSE_QUESTION,
    Permission.SHARE_QUESTION,
    // Courses & Quizzes
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.ENROLL_COURSE,
    Permission.REVIEW_COURSE,
    Permission.VIEW_QUIZ,
    Permission.VIEW_QUIZ_LIST,
    Permission.VIEW_QUIZ_QUESTION,
    Permission.PARTICIPATE_QUIZ,
    Permission.VIEW_QUIZ_RESULT,
    Permission.VIEW_PERSONAL_PROGRESS,
    // Settings
    Permission.LANGUAGE_SETTING,
    Permission.AI_RECOMMENDATION,
    Permission.AI_EXPLANATION,
  ],

  // TRAINING_MANAGER: 54 perms - quản lý khóa học, quiz, phê duyệt bài viết
  [Role.TRAINING_MANAGER]: [
    // Access
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Articles - read + approve (không delete)
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    Permission.APPROVE_ARTICLE,
    // Questions - full CRUD
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
    // Courses - Full CRUD
    Permission.CREATE_COURSE,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.APPROVE_COURSE,
    Permission.VIEW_COURSE_STATISTICS,
    Permission.ENROLL_COURSE,
    Permission.REVIEW_COURSE,
    // Quizzes - Full CRUD
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
    Permission.VIEW_QUESTION_BANK,
    Permission.VIEW_PERSONAL_PROGRESS,
    // Accounts
    Permission.VIEW_ACCOUNT_LIST,
    Permission.UPDATE_ACCOUNT,
    Permission.SEARCH_ACCOUNT,
    // Categories
    Permission.CREATE_CATEGORY,
    Permission.VIEW_CATEGORY_LIST,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.SEARCH_CATEGORY,
    // Settings
    Permission.LANGUAGE_SETTING,
    Permission.MODERATE_CONTENT,
    Permission.AI_RECOMMENDATION,
    Permission.AI_EXPLANATION,
  ],

  // DIRECTOR: 14 perms - phê duyệt khóa học, xem thống kê
  [Role.DIRECTOR]: [
    // Access
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Questions - View
    Permission.VIEW_QUESTION_LIST,
    Permission.SEARCH_QUESTION,
    Permission.READ_QUESTION,
    Permission.CREATE_ANSWER,
    Permission.EDIT_ANSWER,
    Permission.DELETE_ANSWER,
    Permission.OPEN_QUESTION,
    Permission.CLOSE_QUESTION,
    Permission.SHARE_QUESTION,
    // Articles 
    Permission.VIEW_ARTICLE_LIST,
    Permission.SEARCH_ARTICLE,
    Permission.READ_ARTICLE,
    Permission.COMMENT_ARTICLE,
    Permission.EDIT_ARTICLE_COMMENT,
    Permission.DELETE_ARTICLE_COMMENT,
    // Courses - approve only
    Permission.VIEW_QUIZ,
    Permission.VIEW_QUIZ_LIST,
    Permission.VIEW_QUIZ_QUESTION,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    // Permission.APPROVE_COURSE,
    Permission.VIEW_COURSE_STATISTICS,
    // System
    Permission.MONITOR_ACTIVITY,
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_DATA,
    // Settings
    Permission.LANGUAGE_SETTING,
  ],

  // ADMIN: 69 perms - toàn quyền
  [Role.ADMIN]: [
    // Authentication
    Permission.LOGIN,
    Permission.LOGOUT,
    Permission.VIEW_PROFILE,
    // Articles - Full CRUD + Approve
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
    // Questions - Full CRUD
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
    // Courses - Full CRUD + Approve
    Permission.CREATE_COURSE,
    Permission.VIEW_COURSE_LIST,
    Permission.SEARCH_COURSE,
    Permission.READ_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.APPROVE_COURSE,
    Permission.VIEW_COURSE_STATISTICS,
    Permission.ENROLL_COURSE,
    Permission.REVIEW_COURSE,
    // Quizzes - Full CRUD
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
    Permission.VIEW_QUESTION_BANK,
    Permission.VIEW_PERSONAL_PROGRESS,
    // User Management - Full
    Permission.CREATE_ACCOUNT,
    Permission.VIEW_ACCOUNT_LIST,
    Permission.UPDATE_ACCOUNT,
    Permission.DEACTIVATE_ACCOUNT,
    Permission.SEARCH_ACCOUNT,
    Permission.MANAGE_USERS,
    // Categories - Full CRUD
    Permission.CREATE_CATEGORY,
    Permission.VIEW_CATEGORY_LIST,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.SEARCH_CATEGORY,
    // System - Full
    Permission.MONITOR_ACTIVITY,
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_DATA,
    // Settings - All
    Permission.LANGUAGE_SETTING,
    Permission.VIEW_ROLE_PERMISSION,
    Permission.EDIT_ROLE_PERMISSION,
    Permission.MODERATE_CONTENT,
    Permission.AI_RECOMMENDATION,
    Permission.AI_EXPLANATION,
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
