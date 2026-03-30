"use server"

import {
  getAllDepartmentsAction,
  getDepartmentsWithHeadsAction,
  assignDepartmentHeadAction,
  getEligibleHeadsForDepartmentAction,
} from "@/service/department.service"

/**
 * Get all departments
 */
export async function getAllDepartments() {
  return getAllDepartmentsAction()
}

/**
 * Get all departments with assigned head of department
 */
export async function getDepartmentsWithHeads() {
  return getDepartmentsWithHeadsAction()
}

/**
 * Assign or reassign a head of department
 */
export async function assignHeadOfDepartment(
  departmentId: number,
  headUserId: number
) {
  return assignDepartmentHeadAction(departmentId, headUserId)
}

/**
 * Get eligible users for head assignment in a department
 */
export async function getEligibleHeadsForDepartment(departmentId: number) {
  return getEligibleHeadsForDepartmentAction(departmentId)
}
