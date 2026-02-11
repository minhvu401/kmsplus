// @/service/progress.service.ts

import { sql } from "@/lib/database"

// 1. Hàm lấy danh sách bài đã học (Dùng để hiển thị khi vào trang)
export async function getCompletedItemIds(enrollmentId: number) {
  try {
    console.log(`🔍 [GET] Đang lấy progress cho Enrollment ID: ${enrollmentId}`)

    const result = await sql`
      SELECT completed_lesson_ids 
      FROM enrollments 
      WHERE id = ${enrollmentId}
    `

    if (result.length > 0) {
      const data = result[0].completed_lesson_ids
      console.log(`✅ [GET] Kết quả từ DB:`, data)

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

    console.log(`⚠️ [GET] Không tìm thấy enrollment hoặc chưa có bài học nào.`)
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
  console.log(
    `🚀 [UPDATE] Bắt đầu update: User ${userId}, Course ${courseId}, Item ${itemId}`
  )

  try {
    // A. Lấy dữ liệu cũ + thông tin course để tính progress
    const existing = await sql`
      SELECT e.id, e.completed_lesson_ids, e.progress_percentage,
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
    if (Array.isArray(enrollment.completed_lesson_ids)) {
      completedIds = enrollment.completed_lesson_ids.map((id) => Number(id))
    } else if (typeof enrollment.completed_lesson_ids === "string") {
      const parsed = JSON.parse(enrollment.completed_lesson_ids)
      completedIds = Array.isArray(parsed) ? parsed.map((id) => Number(id)) : []
    }

    console.log("📝 [UPDATE] Danh sách cũ:", completedIds)

    // B. Thêm bài mới vào mảng
    if (!completedIds.includes(itemId)) {
      completedIds.push(itemId)
    } else {
      console.log("⚠️ [UPDATE] Bài học này đã có trong danh sách rồi.")
    }

    console.log("💾 [UPDATE] Danh sách mới sắp lưu:", completedIds)

    // C. Tính toán progress percentage mới
    const totalItems = enrollment.total_items || 0
    const newProgressPercentage =
      totalItems > 0 ? Math.round((completedIds.length / totalItems) * 100) : 0

    console.log(
      `📊 [UPDATE] Progress mới: ${newProgressPercentage}% (${completedIds.length}/${totalItems} items)`
    )

    // D. Xác định status mới
    const newStatus = newProgressPercentage >= 100 ? "completed" : "in_progress"

    // E. Cập nhật xuống DB
    // Lưu ý: Ép kiểu ::jsonb để Postgres hiểu đây là JSON
    await sql`
      UPDATE enrollments 
      SET 
        completed_lesson_ids = ${JSON.stringify(completedIds)}::jsonb,
        progress_percentage = ${newProgressPercentage},
        status = ${newStatus},
        completed_at = ${newStatus === "completed" ? new Date() : null}
      WHERE id = ${enrollment.id}
    `

    console.log("✅ [UPDATE] Lưu vào DB thành công!")
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
      SELECT
        e.id as enrollment_id,
        e.enrolled_at,
        e.progress_percentage,
        e.status,
        e.completed_at,
        c.id as course_id,
        c.title as course_name,
        c.thumbnail_url
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ${userId}
      ORDER BY e.enrolled_at DESC
    `
    return { success: true, data: history }
  } catch (error) {
    console.error("Service Error - getPersonalHistory:", error)
    return { success: false, error: "Database error" }
  }
}
