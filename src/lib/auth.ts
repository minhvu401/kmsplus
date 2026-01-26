/**
 * Authentication utilities for server-side operations
 * Combines JWT handling and server authentication helpers
 */

import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { env } from "./config"

export type AuthUser = {
  id: string
  email: string
  role?: string // Role của user
  iat?: number
  exp?: number
}

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(env.JWT_SECRET)

/**
 * JWT Token utilities
 */
export async function signToken(payload: { id: string; email: string; role?: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret)
  return token
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as AuthUser
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

    const decoded = await verifyToken(token)
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

/**
 * Get user's role từ current session
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.role || null
}