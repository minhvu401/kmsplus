/**
 * Dashboard Metrics Server Actions
 * Server-side functions that can be called from Client Components
 * Handles all database queries for metrics
 */

"use server"

import {
  fetchActiveUsersMetrics,
  fetchAdoptionRateMetrics,
  fetchCourseCompletionRateMetrics,
  fetchTopCategoriesMetrics,
  fetchContentRatingMetrics,
  getCurrentAverageRating,
  type ActiveUsersData,
  type AdoptionRateData,
  type CourseCompletionRateData,
  type TopCategoryData,
  type ContentRatingData,
} from "@/service/metrics.service"

/**
 * Get active users metrics with error handling
 */
export async function getActiveUsersMetrics(): Promise<ActiveUsersData[]> {
  try {
    const data = await fetchActiveUsersMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch active users metrics:", error)
    return []
  }
}

/**
 * Get adoption rate metrics with error handling
 */
export async function getAdoptionRateMetrics(): Promise<AdoptionRateData> {
  try {
    const data = await fetchAdoptionRateMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch adoption rate metrics:", error)
    return {
      adoptionRate: 0,
      activeUsers: 0,
      totalUsers: 0,
    }
  }
}

/**
 * Get course completion rate metrics with error handling
 */
export async function getCourseCompletionRateMetrics(): Promise<CourseCompletionRateData> {
  try {
    const data = await fetchCourseCompletionRateMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch course completion rate metrics:", error)
    return {
      completionRate: 0,
      previousMonthRate: 0,
      change: 0,
    }
  }
}

/**
 * Get top categories metrics with error handling
 */
export async function getTopCategoriesMetrics(): Promise<TopCategoryData[]> {
  try {
    const data = await fetchTopCategoriesMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch top categories metrics:", error)
    return []
  }
}

/**
 * Get content rating metrics with error handling
 */
export async function getContentRatingMetrics(): Promise<ContentRatingData[]> {
  try {
    const data = await fetchContentRatingMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch content rating metrics:", error)
    return []
  }
}

/**
 * Get current average rating
 */
export async function getCurrentAverageRatingAction(data: ContentRatingData[]): Promise<number> {
  return getCurrentAverageRating(data)
}
