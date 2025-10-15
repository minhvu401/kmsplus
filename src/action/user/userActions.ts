"use server"

import { requireAuth } from "@/lib/serverAuth"
import { getAllUsersAction, getUserByEmailAction } from "@/service/user.service"

/**
 * Get all users (protected)
 */
export async function getAllUsers() {
  await requireAuth()
  return getAllUsersAction()
}

/**
 * Get user by email (protected)
 */
export async function getUserByEmail(email: string) {
  await requireAuth()
  return getUserByEmailAction(email)
}
