// @/service/progress.service.ts

import { sql } from "../lib/database"

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
      FROM course_enrollments e
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

export async function updateProgressService(
  userId: number,
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  try {
    const enrollmentRes = await sql`
        SELECT id FROM course_enrollments
        WHERE user_id = ${userId} AND course_id = ${courseId}
    `
    if (enrollmentRes.length === 0)
      return { success: false, error: "Not enrolled" }
    const enrollmentId = enrollmentRes[0].id

    await sql`
      INSERT INTO course_progress (enrollment_id, item_id, item_type, is_completed, completed_at)
      VALUES (${enrollmentId}, ${itemId}, ${itemType}, TRUE, NOW())
      ON CONFLICT (enrollment_id, item_id, item_type) DO NOTHING
    `

    const totalRes = await sql`
        SELECT COUNT(*) as total
        FROM curriculum_items ci
        JOIN sections s ON ci.section_id = s.id
        WHERE s.course_id = ${courseId}
    `
    const totalItems = Number(totalRes[0].total) || 1

    const completedRes = await sql`
        SELECT COUNT(*) as completed
        FROM course_progress
        WHERE enrollment_id = ${enrollmentId} AND is_completed = TRUE
    `
    const completedItems = Number(completedRes[0].completed)

    let newPercent = Math.round((completedItems / totalItems) * 100)
    if (newPercent > 100) newPercent = 100

    const newStatus = newPercent === 100 ? "completed" : "in_progress"

    await sql`
        UPDATE course_enrollments
        SET
            progress_percentage = ${newPercent},
            status = CASE
                WHEN ${newPercent} = 100 THEN 'completed'::varchar
                ELSE 'in_progress'::varchar
            END,
            completed_at = CASE
                WHEN ${newPercent} = 100 AND completed_at IS NULL THEN NOW()
                ELSE completed_at
            END
        WHERE id = ${enrollmentId}
    `

    return { success: true, progress: newPercent, status: newStatus }
  } catch (error) {
    console.error("Service Error - updateProgress:", error)
    return { success: false, error: "Database error" }
  }
}

export async function checkItemCompletionService(
  userId: number,
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  try {
    const result = await sql`
      SELECT cp.is_completed
      FROM course_progress cp
      JOIN course_enrollments ce ON cp.enrollment_id = ce.id
      WHERE ce.user_id = ${userId}
        AND ce.course_id = ${courseId}
        AND cp.item_id = ${itemId}
        AND cp.item_type = ${itemType}
    `
    return result.length > 0 && result[0].is_completed === true
  } catch (error) {
    console.error("Service Error - checkItemCompletion:", error)
    return false
  }
}
