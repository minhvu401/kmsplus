/**
 * Authentication utilities for server-side operations
 * Combines JWT handling and server authentication helpers
 */

import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { env } from "./config"

export type AuthUser = {
  id: string
  email: string
  iat?: number
  exp?: number
}

/**
 * JWT Token utilities
 */
export function signToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "2h" })
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET)
}

/**
 * Get current authenticated user from cookies
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
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Require authentication - throw error if not authenticated
 * Dùng trong Server Actions
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}
