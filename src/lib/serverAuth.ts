/**
 * Server-side authentication helpers
 * Chỉ được dùng trong Server Actions/Components (có "use server")
 */

import { cookies } from "next/headers"
import { verifyToken } from "./jwt"

export type AuthUser = {
  id: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Get current authenticated user
 * @returns AuthUser nếu authenticated, null nếu không
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Require authentication - throw error nếu không authenticated
 * Dùng trong Server Actions để protect
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required. Please login first.")
  }

  return user
}
