/**
 * Mapping Routes với Permissions yêu cầu
 * Định nghĩa quyền truy cập cho từng route
 */

import { Permission } from "@/enum/permission.enum"

/**
 * Map các route với permissions yêu cầu
 * - Key: Route path string
 * - Value: Permission[] - permissions yêu cầu (user phải có ít nhất 1 permission trong array)
 */
export const routePermissionMap: Record<string, Permission[]> = {
  // Dashboard - Tất cả authenticated users đều có thể xem (nội dung sẽ khác nhau dựa vào role)
  // Empty array = không cần check permission cụ thể, chỉ cần authentication
  "/dashboard-metrics": [],

  // Profile
  "/profile": [Permission.VIEW_PROFILE],
  // Articles Management
  "/articles": [Permission.READ_ARTICLE],
  "/articles/management": [
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ARTICLE,
    Permission.DELETE_ARTICLE,
    Permission.APPROVE_ARTICLE,
  ],

  // Questions Management
  "/questions": [Permission.READ_QUESTION],
  "/questions/management": [
    Permission.CREATE_QUESTION,
    Permission.UPDATE_QUESTION,
    Permission.DELETE_QUESTION,
  ],

  // Courses Management
  "/courses": [Permission.READ_COURSE],
  "/courses/management": [
    Permission.CREATE_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.APPROVE_COURSE,
  ],

  // Quiz Management
  "/quizzes": [
    Permission.CREATE_QUIZ,
    Permission.UPDATE_QUIZ,
    Permission.DELETE_QUIZ,
    Permission.VIEW_QUIZ_LIST,
  ],

  // Question Bank
  "/question-bank": [Permission.VIEW_QUESTION_BANK],

  // Categories Management
  "/categories/management": [
    Permission.CREATE_CATEGORY,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
  ],

  // User Management
  "/user-management": [Permission.MANAGE_USERS],

  // Role Permissions
  "/role-permissions": [Permission.EDIT_ROLE_PERMISSION],

  // Settings
  "/settings": [Permission.LANGUAGE_SETTING],
}

/**
 * Helper function để lấy permissions yêu cầu cho một route
 *
 * @param pathname - Full pathname (e.g., "/quizzes", "/articles/management")
 * @returns Array of required permissions, hoặc empty array nếu route không cần check
 */
export function getRequiredPermissionsForRoute(pathname: string): Permission[] {
  // Exact match
  if (routePermissionMap[pathname]) {
    return routePermissionMap[pathname]
  }

  // Check for route prefixes
  for (const [route, permissions] of Object.entries(routePermissionMap)) {
    if (pathname.startsWith(route)) {
      return permissions
    }
  }

  return []
}

/**
 * Check nếu một route cần permission check
 */
export function routeRequiresPermissionCheck(pathname: string): boolean {
  return getRequiredPermissionsForRoute(pathname).length > 0
}
