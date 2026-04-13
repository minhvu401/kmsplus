"use server"

import { sql } from "@/lib/database"

export type Department = {
  id: number
  name: string
}

export type DepartmentWithHead = {
  id: number
  name: string
  head_of_department_id: number | null
  head_name: string | null
  head_avatar_url: string | null
}

export type EligibleDepartmentHead = {
  id: number
  full_name: string
  avatar_url: string | null
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

/**
 * Lấy danh sách phòng ban kèm trưởng phòng hiện tại
 */
export async function getDepartmentsWithHeadsAction(): Promise<DepartmentWithHead[]> {
  try {
    const rows = await sql`
      SELECT
        d.id,
        d.name,
        d.head_of_department_id,
        u.full_name AS head_name,
        u.avatar_url AS head_avatar_url
      FROM department d
      LEFT JOIN users u ON d.head_of_department_id = u.id
      WHERE d.is_deleted = FALSE
      ORDER BY d.name ASC
    `

    return rows as DepartmentWithHead[]
  } catch (error) {
    console.error("getDepartmentsWithHeadsAction error:", error)
    throw new Error("Failed to fetch departments with head assignments")
  }
}

/**
 * Gán hoặc đổi trưởng phòng cho một phòng ban
 */
export async function assignDepartmentHeadAction(
  departmentId: number,
  headUserId: number
): Promise<{ success: boolean; message: string }> {
  try {
    await sql`
      UPDATE department
      SET head_of_department_id = ${headUserId}
      WHERE id = ${departmentId} AND is_deleted = FALSE
    `

    return {
      success: true,
      message: "Head of department updated successfully",
    }
  } catch (error) {
    console.error("assignDepartmentHeadAction error:", error)
    return {
      success: false,
      message: "Failed to update head of department",
    }
  }
}

/**
 * Lấy danh sách ứng viên trưởng phòng theo điều kiện:
 * - Thuộc đúng phòng ban
 * - Có role Training Manager
 */
export async function getEligibleHeadsForDepartmentAction(
  departmentId: number
): Promise<EligibleDepartmentHead[]> {
  try {
    const rows = await sql`
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.avatar_url
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE u.department_id = ${departmentId}
        AND u.status = 'active'
        AND r.name = 'Training Manager'
      ORDER BY u.full_name ASC
    `

    return rows as EligibleDepartmentHead[]
  } catch (error) {
    console.error("getEligibleHeadsForDepartmentAction error:", error)
    throw new Error("Failed to fetch eligible heads for department")
  }
}
