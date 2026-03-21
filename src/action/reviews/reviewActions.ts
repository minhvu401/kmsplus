// src/action/reviews/reviewActions.ts
// Action layer for course reviews (feedback table)
// Validates input, authenticates the caller, then delegates to the service layer

"use server"

import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { revalidatePath } from "next/cache"
import {
  getAllReviewsAction,
  getReviewByIdAction,
  createReviewAction,
  updateReviewAction,
  deleteReviewAction,
  getCourseReviewsForManagementAction,
} from "@/service/review.service"

function isHalfStepRating(value: number) {
  return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < 1e-9
}

// --- FETCH ACTIONS ---

/**
 * Get all reviews, optionally filtered by course.
 * Safe to call from any authenticated user.
 */
export async function getAllReviews(params: {
  course_id?: number
  page?: number
  limit?: number
}) {
  await requireAuth()
  return getAllReviewsAction(params)
}

/**
 * Get a single review by its ID.
 */
export async function getReviewById(id: number) {
  await requireAuth()
  return getReviewByIdAction(id)
}

export async function getCourseReviewsForManagement(params: {
  course_id: number
  page?: number
  limit?: number
}) {
  await requirePermission(Permission.UPDATE_COURSE)
  return getCourseReviewsForManagementAction(params)
}

// --- MUTATION ACTIONS ---

/**
 * Create a new review for a course.
 * A user may only submit one review per course (enforced by DB unique constraint).
 *
 * Expected FormData keys: course_id, rating, content (optional)
 */
export async function createReview(formData: FormData) {
  try {
    const currentUser = await requireAuth()

    const course_id = parseInt(formData.get("course_id") as string, 10)
    const rating = parseFloat(formData.get("rating") as string)
    const content = (formData.get("content") as string | null)?.trim() || null

    if (!course_id || isNaN(course_id)) {
      return { success: false, error: "Invalid course ID" }
    }

    if (
      isNaN(rating) ||
      rating < 0.5 ||
      rating > 5 ||
      !isHalfStepRating(rating)
    ) {
      return { success: false, error: "Rating must be 0.5-step between 0.5 and 5" }
    }

    const result = await createReviewAction({
      course_id,
      user_id: parseInt(currentUser.id, 10),
      rating,
      content,
    })

    if (result.success) {
      revalidatePath(`/courses/${course_id}`)
    }

    return result
  } catch (error: any) {
    console.error("Action Error - createReview:", error)
    return { success: false, error: error?.message ?? "Failed to create review" }
  }
}

/**
 * Update an existing review belonging to the current user.
 *
 * Expected FormData keys: id, rating (optional), content (optional)
 */
export async function updateReview(formData: FormData) {
  try {
    const currentUser = await requireAuth()

    const id = parseInt(formData.get("id") as string, 10)
    const ratingRaw = formData.get("rating") as string | null
    const content = (formData.get("content") as string | null)?.trim() || null

    if (!id || isNaN(id)) {
      return { success: false, error: "Invalid review ID" }
    }

    let rating: number | undefined
    if (ratingRaw !== null && ratingRaw !== "") {
      rating = parseFloat(ratingRaw)
      if (
        isNaN(rating) ||
        rating < 0.5 ||
        rating > 5 ||
        !isHalfStepRating(rating)
      ) {
        return { success: false, error: "Rating must be 0.5-step between 0.5 and 5" }
      }
    }

    // Must update at least one field
    if (rating === undefined && content === null) {
      return { success: false, error: "Nothing to update" }
    }

    const result = await updateReviewAction({
      id,
      user_id: parseInt(currentUser.id, 10),
      rating,
      content,
    })

    if (result.success) {
      // Fetch the review to get course_id for path revalidation
      const review = await getReviewByIdAction(id)
      if (review) revalidatePath(`/courses/${review.course_id}`)
    }

    return result
  } catch (error: any) {
    console.error("Action Error - updateReview:", error)
    return { success: false, error: error?.message ?? "Failed to update review" }
  }
}

/**
 * Soft-delete a review.
 * Regular users may only delete their own reviews.
 * Users with the "admin" role may delete any review.
 *
 * Expected FormData keys: id, course_id (used for path revalidation)
 */
export async function deleteReview(formData: FormData) {
  try {
    const currentUser = await requireAuth()

    const id = parseInt(formData.get("id") as string, 10)
    const course_id = parseInt(formData.get("course_id") as string, 10)

    if (!id || isNaN(id)) {
      return { success: false, error: "Invalid review ID" }
    }

    const isAdmin = currentUser.role === "admin"

    const result = await deleteReviewAction(
      id,
      parseInt(currentUser.id, 10),
      isAdmin,
    )

    if (result.success && course_id) {
      revalidatePath(`/courses/${course_id}`)
    }

    return result
  } catch (error: any) {
    console.error("Action Error - deleteReview:", error)
    return { success: false, error: error?.message ?? "Failed to delete review" }
  }
}

export async function deactivateReviewByManager(payload: {
  id: number
  course_id: number
}) {
  try {
    const currentUser = await requirePermission(Permission.UPDATE_COURSE)

    if (!payload.id || Number.isNaN(payload.id)) {
      return { success: false, error: "Invalid review ID" }
    }

    if (!payload.course_id || Number.isNaN(payload.course_id)) {
      return { success: false, error: "Invalid course ID" }
    }

    const result = await deleteReviewAction(
      payload.id,
      parseInt(currentUser.id, 10),
      true,
    )

    if (result.success) {
      revalidatePath(`/courses/${payload.course_id}`)
      revalidatePath(`/courses/manage/${payload.course_id}`)
    }

    return result
  } catch (error: any) {
    console.error("Action Error - deactivateReviewByManager:", error)
    return {
      success: false,
      error: error?.message ?? "Failed to deactivate review",
    }
  }
}
