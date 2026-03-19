// @/src/action/enrollment/enrollmentAction.ts
// This file contains server actions for enrollment operations
"use server"

import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { getEnrollmentOverviewService } from "@/service/enrollment.service"

export async function enrollCourseAction(courseId: number) {
  try {
    const user = await getCurrentUser()
    if (!user?.id)
      return { success: false, error: "Vui lòng đăng nhập để ghi danh" }

    // 1. Kiểm tra đã ghi danh chưa (Dựa trên UNIQUE CONSTRAINT của bạn)
    const existing = await sql`
      SELECT id FROM enrollments 
      WHERE user_id = ${user.id} AND course_id = ${courseId}
    `

    if (existing.length > 0) {
      return { success: false, error: "Bạn đã ghi danh khóa học này rồi." }
    }

    // 2. Thực hiện INSERT (Sử dụng đúng tên cột progress_percentage)
    // Lưu ý: Tôi bỏ qua cột completed_by vì nó gây lỗi nếu không có giá trị
    await sql`
      INSERT INTO enrollments (
        course_id, 
        user_id, 
        status, 
        progress_percentage, 
        enrolled_at
      ) VALUES (
        ${courseId}, 
        ${user.id}, 
        'enrolled', 
        0.00, 
        NOW()
      )
    `

    revalidatePath(`/courses/${courseId}`)
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
        completed_lesson_ids,
        EXISTS(
          SELECT 1
          FROM feedback f
          WHERE f.user_id = ${userId}
            AND f.course_id = ${courseId}
            AND f.is_deleted = false
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
    console.log(
      "🔐 [SERVER] getEnrollmentOverview called with courseId:",
      courseId
    )
    await requireAuth() // Chỉ cho phép user đã đăng nhập
    console.log("🔐 [SERVER] Auth passed")
    const result = await getEnrollmentOverviewService(courseId)
    console.log("🔐 [SERVER] Service result:", result)
    return result
  } catch (error: any) {
    console.error("🔐 [SERVER] Error in getEnrollmentOverview:", error)
    return {
      success: false,
      error: error.message || "Authentication failed",
    }
  }
}
