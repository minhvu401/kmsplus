"use server"

import { getAllDepartmentsAction } from "@/service/department.service"

/**
 * Get all departments
 */
export async function getAllDepartments() {
  return getAllDepartmentsAction()
}
