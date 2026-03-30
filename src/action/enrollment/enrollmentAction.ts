// @/src/action/enrollment/enrollmentAction.ts
// This file contains server actions for enrollment operations
"use server"

import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import {
  getEnrollmentOverviewService,
  getCourseLearnerEnrollmentsService,
  getCourseLearnerEnrollmentDetailService,
} from "@/service/enrollment.service"

export async function enrollCourseAction(courseId: number) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) return { success: false, error: "Vui lòng đăng nhập" }
    const userId = Number(user.id)

    // 1. Kiểm tra đã ghi danh chưa
    const existing =
      await sql`SELECT id FROM enrollments WHERE user_id = ${userId} AND course_id = ${courseId}`
    if (existing.length > 0) return { success: false, error: "Đã ghi danh" }

    // 2. Kéo Rule ra tính Deadline (Dùng CTE lấy info user hiện tại)
    const rules = await sql`
      WITH user_info AS (
        SELECT u.id, u.department_id, ur.role_id FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = ${userId} LIMIT 1
      )
      SELECT ar.* FROM assignment_rules ar CROSS JOIN user_info ui
      WHERE ar.course_id = ${courseId}
        AND (
          ar.target_type = 'all_employees'
          OR (ar.target_type = 'department' AND ar.department_id = ui.department_id)
          OR (ar.target_type = 'role' AND ar.role_id = ui.role_id)
          OR (ar.target_type = 'user' AND ar.user_id = ui.id)
        )
      LIMIT 1
    `

    let finalDeadline = null
    if (rules.length > 0) {
      const rule = rules[0]
      if (rule.due_type === "fixed") {
        finalDeadline = rule.due_date
      } else if (rule.due_type === "relative" && rule.due_days) {
        const target = new Date()
        target.setDate(target.getDate() + rule.due_days)
        finalDeadline = target.toISOString()
      }
    }

    // 3. Thực hiện INSERT kèm Deadline
    await sql`
      INSERT INTO enrollments (course_id, user_id, status, progress_percentage, enrolled_at, deadline)
      VALUES (${courseId}, ${userId}, 'in_progress', 0.00, NOW(), ${finalDeadline})
    `

    revalidatePath(`/courses/${courseId}`)
    revalidatePath("/history") // Load lại tab My Courses
    return { success: true }
  } catch (error: any) {
    console.error("Enroll Error:", error)
    return { success: false, error: "Lỗi hệ thống: " + error.message }
  }
}

/**
 * Kiểm tra trạng thái để hiển thị UI
 */
export async function checkEnrollmentStatus(courseId: number, userId: number) {
  try {
    // ⚠️ QUAN TRỌNG: Phải select cả cột 'id'
    const result = await sql`
      SELECT
        id,
        status,
        progress_percentage,
        completed_item_ids,
        EXISTS(
          SELECT 1
          FROM feedback f
          WHERE f.user_id = ${userId}
            AND f.course_id = ${courseId}
            AND f.deleted_at IS NULL
        ) AS has_submitted_feedback
      FROM enrollments 
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `

    // Nếu tìm thấy, trả về phần tử đầu tiên (Object)
    if (result && result.length > 0) {
      return result[0]
    }

    return null // Không tìm thấy
  } catch (error) {
    console.error("Error checking enrollment:", error)
    return null
  }
}

// 👇 HÀM MỚI
export async function getEnrollmentOverview(courseId?: number) {
  try {
    ;("🔐 [SERVER] getEnrollmentOverview called with courseId:", courseId)
    await requireAuth()(
      // Chỉ cho phép user đã đăng nhập
      "🔐 [SERVER] Auth passed"
    )
    const result = await getEnrollmentOverviewService(courseId)(
      "🔐 [SERVER] Service result:",
      result
    )
    return result
  } catch (error: any) {
    console.error("🔐 [SERVER] Error in getEnrollmentOverview:", error)
    return {
      success: false,
      error: error.message || "Authentication failed",
    }
  }
}

export async function getCourseLearnerEnrollments(params: {
  courseId: number
  query?: string
  status?: string
  department?: string
  sort?: string
  page?: number
  limit?: number
}) {
  try {
    await requireAuth()
    return await getCourseLearnerEnrollmentsService(params)
  } catch (error: any) {
    console.error("🔐 [SERVER] Error in getCourseLearnerEnrollments:", error)
    return {
      success: false,
      learners: [],
      totalItems: 0,
      departments: [],
      page: params.page || 1,
      limit: params.limit || 10,
      error: error.message || "Authentication failed",
    }
  }
}

export async function getCourseLearnerEnrollmentDetail(params: {
  courseId: number
  userId: number
}) {
  try {
    await requireAuth()
    return await getCourseLearnerEnrollmentDetailService(params)
  } catch (error: any) {
    console.error(
      "🔐 [SERVER] Error in getCourseLearnerEnrollmentDetail:",
      error
    )
    return {
      success: false,
      error: error.message || "Authentication failed",
    }
  }
}
