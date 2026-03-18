/**
 * Metrics Service
 * Provides data fetching for dashboard metrics
 * Uses real database queries instead of mock data
 */

import { sql } from "@/lib/database"

export interface ActiveUsersData {
  month: string
  activeUsers: number
}

export interface AdoptionRateData {
  adoptionRate: number
  activeUsers: number
  totalUsers: number
}

export interface CourseCompletionRateData {
  completionRate: number
  previousMonthRate: number
  change: number
}

export interface TopCategoryData {
  category: string
  value: number
}

export interface ContentRatingData {
  month: string
  rating: number
}

/**
 * Fetch active users data (MAU/DAU) - Last 12 months
 */
export async function fetchActiveUsersMetrics(): Promise<ActiveUsersData[]> {
  try {
    // Get active users for the last 12 months
    // Active user = user who has logged in or participated in the last 30 days of that month
    const result = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', u.created_at), 'MMM YY') as month,
        COUNT(DISTINCT u.id) as activeUsers
      FROM users u
      WHERE u.is_active = true
        AND u.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
      GROUP BY DATE_TRUNC('month', u.created_at)
      ORDER BY DATE_TRUNC('month', u.created_at) ASC
    `

    // If no data, return empty array
    if (!result || result.length === 0) {
      return []
    }

    return result.map((row: any) => ({
      month: row.month,
      activeUsers: parseInt(row.activeUsers) || 0,
    }))
  } catch (error) {
    console.error("Error fetching active users metrics:", error)
    // Return empty array instead of throwing to prevent page crash
    return []
  }
}

/**
 * Fetch system adoption rate
 * Percentage of active users vs total users
 */
export async function fetchAdoptionRateMetrics(): Promise<AdoptionRateData> {
  try {
    // Get total users count
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM users WHERE is_active = true
    `
    const totalUsers = parseInt(totalResult[0]?.total) || 0

    // Get active users (users with at least 1 enrollment or action in last 30 days)
    const activeResult = await sql`
      SELECT COUNT(DISTINCT u.id) as active
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id
      WHERE u.is_active = true
        AND (e.enrolled_at >= CURRENT_DATE - INTERVAL '30 days' 
             OR u.created_at >= CURRENT_DATE - INTERVAL '30 days')
    `
    const activeUsers = parseInt(activeResult[0]?.active) || 0

    const adoptionRate = totalUsers > 0 
      ? Math.round((activeUsers / totalUsers) * 100) 
      : 0

    return {
      adoptionRate,
      activeUsers,
      totalUsers,
    }
  } catch (error) {
    console.error("Error fetching adoption rate metrics:", error)
    return {
      adoptionRate: 0,
      activeUsers: 0,
      totalUsers: 0,
    }
  }
}

/**
 * Fetch overall course completion rate
 * Current month vs previous month
 */
export async function fetchCourseCompletionRateMetrics(): Promise<CourseCompletionRateData> {
  try {
    // Current month completion rate
    const currentMonthResult = await sql`
      SELECT 
        (COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / 
         NULLIF(COUNT(*), 0)) * 100 as completion_rate
      FROM enrollments
      WHERE enrolled_at >= DATE_TRUNC('month', CURRENT_DATE)
    `
    const completionRate = Math.round(
      parseFloat(currentMonthResult[0]?.completion_rate) || 0
    )

    // Previous month completion rate
    const previousMonthResult = await sql`
      SELECT 
        (COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / 
         NULLIF(COUNT(*), 0)) * 100 as completion_rate
      FROM enrollments
      WHERE enrolled_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND enrolled_at < DATE_TRUNC('month', CURRENT_DATE)
    `
    const previousMonthRate = Math.round(
      parseFloat(previousMonthResult[0]?.completion_rate) || 0
    )

    const change = completionRate - previousMonthRate

    return {
      completionRate,
      previousMonthRate,
      change,
    }
  } catch (error) {
    console.error("Error fetching course completion rate:", error)
    return {
      completionRate: 0,
      previousMonthRate: 0,
      change: 0,
    }
  }
}

/**
 * Fetch top performing categories
 * Based on enrollment count
 */
export async function fetchTopCategoriesMetrics(): Promise<TopCategoryData[]> {
  try {
    const result = await sql`
      SELECT 
        COALESCE(cat.name, 'Uncategorized') as category,
        COUNT(e.id) as value
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.status = 'published'
      GROUP BY cat.id, cat.name
      ORDER BY COUNT(e.id) DESC
      LIMIT 5
    `

    if (!result || result.length === 0) {
      return []
    }

    return result.map((row: any) => ({
      category: row.category,
      value: parseInt(row.value) || 0,
    }))
  } catch (error) {
    console.error("Error fetching top categories:", error)
    return []
  }
}

/**
 * Fetch average content rating
 * Based on comments/reviews for the last 12 months
 */
export async function fetchContentRatingMetrics(): Promise<ContentRatingData[]> {
  try {
    const result = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', c.created_at), 'MMM YY') as month,
        ROUND(AVG(COALESCE(c.rating, 0))::numeric, 2) as rating
      FROM comments c
      WHERE c.created_at >= CURRENT_DATE - INTERVAL '1 year'
        AND c.rating IS NOT NULL
      GROUP BY DATE_TRUNC('month', c.created_at)
      ORDER BY DATE_TRUNC('month', c.created_at) ASC
    `

    if (!result || result.length === 0) {
      return []
    }

    return result.map((row: any) => ({
      month: row.month,
      rating: parseFloat(row.rating) || 0,
    }))
  } catch (error) {
    console.error("Error fetching content rating metrics:", error)
    return []
  }
}

/**
 * Get current average rating
 */
export function getCurrentAverageRating(data: ContentRatingData[]): number {
  if (!data || data.length === 0) return 0
  const sum = data.reduce((acc, item) => acc + item.rating, 0)
  return parseFloat((sum / data.length).toFixed(2))
}
