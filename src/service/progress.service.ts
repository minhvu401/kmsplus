// @/service/progress.service.ts

import { sql } from "@/lib/database"

// 1. Hàm lấy danh sách bài đã học (Dùng để hiển thị khi vào trang)
export async function getCompletedItemIds(enrollmentId: number) {
  try {
    ;`🔍 [GET] Đang lấy progress cho Enrollment ID: ${enrollmentId}`

    const result = await sql`
      SELECT completed_item_ids 
      FROM enrollments 
      WHERE id = ${enrollmentId}
    `

    if (result.length > 0) {
      const data = result[0].completed_item_ids

      // Đảm bảo luôn trả về mảng số (nếu DB trả về null thì trả về [])
      if (Array.isArray(data)) {
        // Chuyển tất cả về number để so sánh chính xác
        return data.map((id) => Number(id))
      }
      // Nếu DB trả về string JSON (do driver), parse ra rồi chuyển về number
      if (typeof data === "string") {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed.map((id) => Number(id)) : []
      }

      return []
    }

    ;`⚠️ [GET] Không tìm thấy enrollment hoặc chưa có bài học nào.`
    return []
  } catch (error) {
    console.error("❌ [GET] Lỗi khi lấy danh sách bài học:", error)
    return []
  }
}

// 2. Hàm cập nhật tiến độ (Khi bấm nút Mark as Complete)
export async function updateProgressService(
  userId: number,
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  ;`🚀 [UPDATE] Bắt đầu update: User ${userId}, Course ${courseId}, Item ${itemId}`

  try {
    // A. Lấy dữ liệu cũ + thông tin course để tính progress
    const existing = await sql`
      SELECT e.id, e.completed_item_ids, e.progress_percentage, e.completed_at,
             (SELECT COUNT(*) FROM curriculum_items ci 
              JOIN sections s ON ci.section_id = s.id 
              WHERE s.course_id = ${courseId}) as total_items
      FROM enrollments e
      WHERE e.user_id = ${userId} AND e.course_id = ${courseId}
    `

    if (!existing || existing.length === 0) {
      console.error("❌ [UPDATE] Không tìm thấy Enrollment!")
      throw new Error("Enrollment not found")
    }

    const enrollment = existing[0]
    let completedIds: number[] = []

    // Xử lý dữ liệu cũ từ DB (có thể là null, array, hoặc string json)
    if (Array.isArray(enrollment.completed_item_ids)) {
      completedIds = enrollment.completed_item_ids.map((id) => Number(id))
    } else if (typeof enrollment.completed_item_ids === "string") {
      const parsed = JSON.parse(enrollment.completed_item_ids)
      completedIds = Array.isArray(parsed) ? parsed.map((id) => Number(id)) : []
    }

    // Chuẩn hóa về curriculum_items.id để theo dõi tiến độ thống nhất cho lesson/quiz.
    const resolvedItemRows = await sql`
      SELECT ci.id
      FROM curriculum_items ci
      JOIN sections s ON s.id = ci.section_id
      WHERE s.course_id = ${courseId}
        AND ${
          itemType === "lesson"
            ? sql`(ci.id = ${itemId} OR ci.lesson_id = ${itemId})`
            : sql`(ci.id = ${itemId} OR ci.quiz_id = ${itemId})`
        }
      ORDER BY CASE WHEN ci.id = ${itemId} THEN 0 ELSE 1 END
      LIMIT 1
    `

    const normalizedItemId =
      resolvedItemRows.length > 0
        ? Number(resolvedItemRows[0].id)
        : Number(itemId)

    // B. Thêm bài mới vào mảng
    if (!completedIds.includes(normalizedItemId)) {
      completedIds.push(normalizedItemId)
    } else {
      console.warn(
        `⚠️ [UPDATE] Item ID ${normalizedItemId} đã tồn tại trong completed_item_ids.`
      )
    }

    // C. Tính toán progress percentage mới
    const totalItems = Number(enrollment.total_items) || 0
    const newProgressPercentage: number =
      totalItems > 0 ? Math.round((completedIds.length / totalItems) * 100) : 0

    // D. Xác định status mới
    const newStatus = newProgressPercentage >= 100 ? "completed" : "in_progress"
    const completedAtValue =
      newStatus === "completed" ? (enrollment.completed_at ?? new Date()) : null

    // E. Cập nhật xuống DB
    // Lưu ý: Ép kiểu ::jsonb để Postgres hiểu đây là JSON
    await sql`
      UPDATE enrollments 
      SET 
        completed_item_ids = ${JSON.stringify(completedIds)}::jsonb,
        progress_percentage = ${newProgressPercentage},
        status = ${newStatus},
        completed_at = ${completedAtValue}
      WHERE id = ${enrollment.id}
    `
    return { success: true, progressPercentage: newProgressPercentage }
  } catch (error) {
    console.error("❌ [UPDATE] Lỗi Database:", error)
    return { success: false, error: "Database error" }
  }
}

// 3. Hàm kiểm tra từng item (Optional - giữ cho code không bị lỗi import)
export async function checkItemCompletionService(
  userId: number,
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  // Logic cũ hoặc cập nhật sau
  return false
}

export async function getPersonalHistoryService(userId: number) {
  try {
    const history = await sql`
      WITH user_info AS (
        SELECT u.id, u.department_id, ur.role_id
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = ${userId}
        LIMIT 1
      )
      -- 🟢 TẬP 1: ĐÃ GHI DANH
      SELECT
        e.id as enrollment_id,
        e.enrolled_at,
        e.progress_percentage,
        e.status,
        e.completed_at,
        e.deadline, -- Cột mới thêm
        c.id as course_id,
        c.title as course_name,
        c.thumbnail_url,
        'enrolled' as source
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ${userId} AND c.deleted_at IS NULL

      UNION ALL

      -- 🔴 TẬP 2: BỊ ÉP HỌC (NHƯNG CHƯA ENROLL)
      SELECT
        0 as enrollment_id, -- Mặc định là 0 vì chưa enroll
        NULL as enrolled_at,
        0 as progress_percentage,
        'assigned' as status, -- ✅ Trạng thái giả lập để UI nhận diện
        NULL as completed_at,
        ar.due_date as deadline,
        c.id as course_id,
        c.title as course_name,
        c.thumbnail_url,
        'assigned' as source
      FROM assignment_rules ar
      JOIN courses c ON ar.course_id = c.id
      CROSS JOIN user_info ui
      WHERE c.status = 'published' AND c.deleted_at IS NULL
        AND (
          ar.target_type = 'all_employees'
          OR (ar.target_type = 'department' AND ar.department_id = ui.department_id)
          OR (ar.target_type = 'role' AND ar.role_id = ui.role_id)
          OR (ar.target_type = 'user' AND ar.user_id = ui.id)
        )
        AND NOT EXISTS (
          SELECT 1 FROM enrollments e2
          WHERE e2.course_id = c.id AND e2.user_id = ${userId}
        )
      ORDER BY enrolled_at DESC NULLS LAST
    `
    return { success: true, data: history }
  } catch (error) {
    console.error("Service Error - getPersonalHistory:", error)
    return { success: false, error: "Database error" }
  }
}
