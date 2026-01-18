"use server"

import { sql } from "@/lib/database"

export type Department = {
  id: number
  name: string
}

/**
 * Lấy danh sách tất cả phòng ban
 */
export async function getAllDepartmentsAction(): Promise<Department[]> {
  try {
    const rows = await sql`
      SELECT id, name
      FROM department
      WHERE is_deleted = FALSE
      ORDER BY name ASC
    `
    return rows as Department[]
  } catch (error) {
    console.error("getAllDepartmentsAction error:", error)
    throw new Error("Failed to fetch departments")
  }
}
