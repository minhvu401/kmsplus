// src/service/review.service.ts
// Review (feedback) service for managing course reviews
// Handles CRUD operations on the `feedback` table and keeps courses.average_rating in sync

"use server"

import { sql } from "../lib/database"

// --- TYPES ---
export type Review = {
  id: number
  course_id: number
  user_id: number
  rating: number
  content: string | null
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export type ReviewWithUser = Review & {
  user_name: string
  user_email: string
  user_avatar: string | null
}

export type CreateReviewPayload = {
  course_id: number
  user_id: number
  rating: number
  content?: string | null
}

export type UpdateReviewPayload = {
  id: number
  user_id: number
  rating?: number
  content?: string | null
}

type GetAllReviewsParams = {
  course_id?: number
  page?: number
  limit?: number
}

// --- HELPER ---

/**
 * Recalculates the average rating from the feedback table
 * and updates the courses.average_rating column.
 * Called after any create / update / delete operation.
 */
async function syncAverageRating(courseId: number): Promise<void> {
  await sql`
    UPDATE courses
    SET
      average_rating = COALESCE(
        (
          SELECT ROUND(AVG(rating))::smallint
          FROM feedback
          WHERE course_id = ${courseId}
            AND is_deleted = false
        ),
        0
      ),
      updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
    WHERE id = ${courseId}
  `
}

// --- READ ---

export async function getAllReviewsAction({
  course_id,
  page = 1,
  limit = 10,
}: GetAllReviewsParams): Promise<{ reviews: ReviewWithUser[]; totalCount: number }> {
  const offset = (page - 1) * limit

  const courseCondition = course_id ? sql`AND f.course_id = ${course_id}` : sql``

  const rows = await sql`
    SELECT
      f.id,
      f.course_id,
      f.user_id,
      f.rating,
      f.content,
      f.is_deleted,
      f.deleted_at,
      f.created_at,
      f.updated_at,
      u.full_name AS user_name,
      u.email     AS user_email,
      u.avatar_url AS user_avatar
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.is_deleted = false
      ${courseCondition}
    ORDER BY f.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `

  const totalResult = await sql`
    SELECT COUNT(*)
    FROM feedback f
    WHERE f.is_deleted = false
      ${courseCondition}
  `

  return {
    reviews: rows as ReviewWithUser[],
    totalCount: parseInt(totalResult[0].count as string, 10),
  }
}

export async function getReviewByIdAction(id: number): Promise<ReviewWithUser | null> {
  const rows = await sql`
    SELECT
      f.id,
      f.course_id,
      f.user_id,
      f.rating,
      f.content,
      f.is_deleted,
      f.deleted_at,
      f.created_at,
      f.updated_at,
      u.full_name  AS user_name,
      u.email      AS user_email,
      u.avatar_url AS user_avatar
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.id = ${id}
      AND f.is_deleted = false
  `
  return rows.length > 0 ? (rows[0] as ReviewWithUser) : null
}

export async function createReviewAction(
  payload: CreateReviewPayload,
): Promise<{ success: boolean; reviewId?: number; error?: string }> {
  try {
    const { course_id, user_id, rating, content } = payload

    const result = await sql`
      INSERT INTO feedback (course_id, user_id, rating, content)
      VALUES (${course_id}, ${user_id}, ${rating}, ${content ?? null})
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, error: "Failed to create review" }
    }

    await syncAverageRating(course_id)

    return { success: true, reviewId: Number(result[0].id) }
  } catch (error: any) {
    // Unique constraint violation — user has already reviewed this course
    if (error?.code === "23505") {
      return { success: false, error: "You have already reviewed this course" }
    }
    console.error("Service Error - createReview:", error)
    return { success: false, error: error?.message ?? "Failed to create review" }
  }
}

export async function updateReviewAction(
  payload: UpdateReviewPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, user_id, rating, content } = payload

    // Verify ownership before updating
    const existing = await sql`
      SELECT id, course_id FROM feedback
      WHERE id = ${id} AND user_id = ${user_id} AND is_deleted = false
    `

    if (existing.length === 0) {
      return { success: false, error: "Review not found or access denied" }
    }

    const courseId = Number(existing[0].course_id)

    await sql`
      UPDATE feedback
      SET
        rating     = COALESCE(${rating ?? null}, rating),
        content    = COALESCE(${content ?? null}, content),
        updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      WHERE id = ${id}
        AND user_id = ${user_id}
        AND is_deleted = false
    `

    await syncAverageRating(courseId)

    return { success: true }
  } catch (error: any) {
    console.error("Service Error - updateReview:", error)
    return { success: false, error: error?.message ?? "Failed to update review" }
  }
}

export async function deleteReviewAction(
  id: number,
  userId: number,
  isAdmin = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Admins may delete any review; regular users may only delete their own
    const ownerCondition = isAdmin ? sql`` : sql`AND user_id = ${userId}`

    const existing = await sql`
      SELECT id, course_id FROM feedback
      WHERE id = ${id}
        AND is_deleted = false
        ${ownerCondition}
    `

    if (existing.length === 0) {
      return { success: false, error: "Review not found or access denied" }
    }

    const courseId = Number(existing[0].course_id)

    await sql`
      UPDATE feedback
      SET
        is_deleted = true,
        deleted_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'),
        updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      WHERE id = ${id}
    `

    await syncAverageRating(courseId)

    return { success: true }
  } catch (error: any) {
    console.error("Service Error - deleteReview:", error)
    return { success: false, error: error?.message ?? "Failed to delete review" }
  }
}
