"use server"

import { sql } from "@/lib/neonClient"

/**
 * Type cho User response
 */
export type User = {
  id: string
  email: string
  full_name: string | null
  created_at?: Date
}

/**
 * Get all users từ database
 * Hàm này sẽ được wrap bởi withAuth trong userActions.ts
 */
export async function getAllUsersAction(): Promise<User[]> {
  const users = await sql`
    SELECT id, email, full_name, created_at 
    FROM users 
    ORDER BY created_at DESC
  `
  console.log("Fetched users:", users) // Debug log
  return users as User[]
}

/**
 * Get user by email
 * Hàm này sẽ được wrap bởi withAuth trong userActions.ts
 */
export async function getUserByEmailAction(
  email: string
): Promise<User | null> {
  const users = await sql`
    SELECT id, email, full_name, created_at 
    FROM users 
    WHERE email = ${email}
  `
  return users.length > 0 ? (users[0] as User) : null
}
