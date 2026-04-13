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

// ============== TRAINING MANAGER METRICS ==============

export interface KnowledgeGapData {
  keyword: string
  searchCount: number
  resultCount: number
}

export interface TrendingKeywordData {
  keyword: string
  frequency: number
}

export interface CourseDropoffRateData {
  courseTitle: string
  enrollmentCount: number
  dropoffRate: number
}

export interface UnansweredQuestionData {
  resolved: number
  unresolved: number
  resolutionRate: number
}

export interface ContributorData {
  id: string
  name: string
  avatar?: string
  contributions: number
  type: "contributor" | "learner"
}

export interface QuestionBankHealthData {
  difficulty: "Dễ" | "TB" | "Khó"
  count: number
}

// ============== SYSTEM ADMIN METRICS ==============

export interface PendingItemsData {
  articles: number
  courses: number
}

export type TimePeriodType = "day" | "week" | "month" | "year"

export interface NewUsersGrowthData {
  period: string
  newUsers: number
}

// ============== EMPLOYEE METRICS ==============

export interface MandatoryCourseData {
  id: string
  title: string
  dueDate: string
  daysUntilDue: number
  isOverdue: boolean
  status: "pending" | "in-progress" | "completed"
}

export interface PersonalLearningProgressData {
  courseId: string
  courseTitle: string
  progressPercentage: number
  lastUpdated: string
}

export interface ContributionStatsData {
  articles: number
  questions: number
  answers: number
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
      WHERE u.status = 'active'
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
      SELECT COUNT(*) as total FROM users WHERE status = 'active'
    `
    const totalUsers = parseInt(totalResult[0]?.total) || 0

    // Get active users (users with at least 1 enrollment or action in last 30 days)
    const activeResult = await sql`
      SELECT COUNT(DISTINCT u.id) as active
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id
      WHERE u.status = 'active'
        AND (e.enrolled_at >= CURRENT_DATE - INTERVAL '30 days' 
             OR u.created_at >= CURRENT_DATE - INTERVAL '30 days')
    `
    const activeUsers = parseInt(activeResult[0]?.active) || 0

    const adoptionRate =
      totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

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
 * Based on course reviews (feedback table) for the last 12 months
 * Shows monthly trends of course ratings
 */
export async function fetchContentRatingMetrics(): Promise<
  ContentRatingData[]
> {
  try {
    // Query from feedback table (course reviews) - monthly average
    const result = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', f.created_at), 'MMM YY') as month,
        ROUND(AVG(f.rating)::numeric, 2) as rating
      FROM feedback f
      WHERE f.created_at >= CURRENT_DATE - INTERVAL '1 year'
        AND f.deleted_at IS NULL
      GROUP BY DATE_TRUNC('month', f.created_at)
      ORDER BY DATE_TRUNC('month', f.created_at) ASC
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

// ============== TRAINING MANAGER FUNCTIONS ==============

/**
 * Fetch knowledge gaps - searches with zero results
 * TRAINING MANAGER needs to know what to create content for
 * Note: Requires search_logs table with columns: keyword, created_at, result_count
 */
export async function fetchKnowledgeGapMetrics(): Promise<KnowledgeGapData[]> {
  try {
    const result = await sql`
      SELECT 
        search_query as keyword,
        COUNT(*) as searchCount,
        SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) as zeroResultCount
      FROM search_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND result_count = 0
      GROUP BY search_query
      ORDER BY searchCount DESC
      LIMIT 10
    `

    return (
      result.map((row: any) => ({
        keyword: row.keyword,
        searchCount: parseInt(row.searchCount) || 0,
        resultCount: 0,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching knowledge gap metrics:", error)
    return []
  }
}

/**
 * Fetch trending keywords from search and Q&A
 * Note: Requires search_logs table with columns: search_query, created_at
 */
export async function fetchTrendingKeywordsMetrics(): Promise<
  TrendingKeywordData[]
> {
  try {
    const result = await sql`
      SELECT 
        keyword,
        COUNT(*) as frequency
      FROM (
        SELECT LOWER(search_query) as keyword FROM search_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT LOWER(title) as keyword FROM questions
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      ) combined
      GROUP BY keyword
      ORDER BY frequency DESC
      LIMIT 15
    `

    return (
      result.map((row: any) => ({
        keyword: row.keyword,
        frequency: parseInt(row.frequency) || 0,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching trending keywords:", error)
    return []
  }
}

/**
 * Fetch course drop-off rate
 * Shows which courses have high abandonment
 */
export async function fetchCourseDropoffRateMetrics(): Promise<
  CourseDropoffRateData[]
> {
  try {
    const result = await sql`
      SELECT 
        c.id,
        c.title as courseTitle,
        COUNT(e.id) as enrollmentCount,
        ROUND(
          100.0 * SUM(CASE WHEN e.status = 'in_progress' THEN 1 ELSE 0 END) / 
          NULLIF(COUNT(e.id), 0)
        ) as dropoffRate
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.status = 'published'
      GROUP BY c.id, c.title
      HAVING COUNT(e.id) > 0
      ORDER BY dropoffRate DESC
      LIMIT 10
    `

    return (
      result.map((row: any) => ({
        courseTitle: row.courseTitle,
        enrollmentCount: parseInt(row.enrollmentCount) || 0,
        dropoffRate: parseInt(row.dropoffRate) || 0,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching course dropoff rate:", error)
    return []
  }
}

/**
 * Fetch unanswered questions rate
 * For Q&A Forum health monitoring
 */
export async function fetchUnansweredQuestionsMetrics(): Promise<UnansweredQuestionData> {
  try {
    const result = await sql`
      SELECT 
        COUNT(CASE WHEN answer_count > 0 THEN 1 END) as resolved,
        COUNT(CASE WHEN answer_count = 0 THEN 1 END) as unresolved
      FROM questions
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `

    const resolved = parseInt(result[0]?.resolved) || 0
    const unresolved = parseInt(result[0]?.unresolved) || 0
    const total = resolved + unresolved

    return {
      resolved,
      unresolved,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    }
  } catch (error) {
    console.error("Error fetching unanswered questions:", error)
    return {
      resolved: 0,
      unresolved: 0,
      resolutionRate: 0,
    }
  }
}

/**
 * Fetch top contributors and learners
 * For recognition and rewards
 */
export async function fetchTopContributorsMetrics(): Promise<
  ContributorData[]
> {
  try {
    // Get top contributors (article/question/answer creators)
    const contributors = await sql`
      SELECT 
        u.id,
        u.full_name,
        u.avatar_url,
        (
          COALESCE((SELECT COUNT(*) FROM articles WHERE created_by = u.id), 0) +
          COALESCE((SELECT COUNT(*) FROM questions WHERE created_by = u.id), 0) +
          COALESCE((SELECT COUNT(*) FROM answers WHERE created_by = u.id), 0)
        ) as total_contributions
      FROM users u
      WHERE u.status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = u.id AND r.name ILIKE '%admin%'
        )
      ORDER BY total_contributions DESC
      LIMIT 5
    `

    return (
      contributors.map((row: any) => ({
        id: row.id,
        name: row.full_name,
        avatar: row.avatar_url,
        contributions: parseInt(row.total_contributions) || 0,
        type: "contributor",
      })) || []
    )
  } catch (error) {
    console.error("Error fetching top contributors:", error)
    return []
  }
}

/**
 * Fetch top learners
 */
export async function fetchTopLearnersMetrics(): Promise<ContributorData[]> {
  try {
    const result = await sql`
      SELECT 
        u.id,
        u.full_name,
        u.avatar_url,
        COUNT(DISTINCT e.id) as completed_courses
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'completed'
      WHERE u.status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = u.id AND r.name ILIKE '%admin%'
        )
      GROUP BY u.id, u.full_name, u.avatar_url
      ORDER BY completed_courses DESC
      LIMIT 5
    `

    return (
      result.map((row: any) => ({
        id: row.id,
        name: row.full_name,
        avatar: row.avatar_url,
        contributions: parseInt(row.completed_courses) || 0,
        type: "learner",
      })) || []
    )
  } catch (error) {
    console.error("Error fetching top learners:", error)
    return []
  }
}

/**
 * Fetch question bank health
 * Shows distribution of questions by difficulty
 */
export async function fetchQuestionBankHealthMetrics(): Promise<
  QuestionBankHealthData[]
> {
  try {
    const result = await sql`
      SELECT 
        COALESCE(difficulty, 'TB') as difficulty,
        COUNT(*) as count
      FROM questions
      WHERE is_published = true
      GROUP BY difficulty
      ORDER BY 
        CASE 
          WHEN difficulty = 'Dễ' THEN 1
          WHEN difficulty = 'TB' THEN 2
          WHEN difficulty = 'Khó' THEN 3
          ELSE 4
        END
    `

    return (
      result.map((row: any) => ({
        difficulty: row.difficulty || "TB",
        count: parseInt(row.count) || 0,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching question bank health:", error)
    return [
      { difficulty: "Dễ", count: 0 },
      { difficulty: "TB", count: 0 },
      { difficulty: "Khó", count: 0 },
    ]
  }
}

// ============== SYSTEM ADMIN FUNCTIONS ==============

/**
 * Fetch pending items (articles and courses awaiting approval)
 */
export async function fetchPendingItemsMetrics(): Promise<PendingItemsData> {
  try {
    const articlesResult = await sql`
      SELECT COUNT(*) as count FROM articles WHERE status = 'pending'
    `
    const coursesResult = await sql`
      SELECT COUNT(*) as count FROM courses WHERE status = 'pending'
    `

    return {
      articles: parseInt(articlesResult[0]?.count) || 0,
      courses: parseInt(coursesResult[0]?.count) || 0,
    }
  } catch (error) {
    console.error("Error fetching pending items:", error)
    return {
      articles: 0,
      courses: 0,
    }
  }
}

/**
 * Fetch new users growth by time period (day/week/month/year)
 * - day: Hiển thị 24 giờ của ngày được chọn (0h-23h)
 * - week: Hiển thị 7 ngày của tuần được chọn trong tháng
 * - month: Hiển thị 1-31 ngày của tháng được chọn
 * - year: Hiển thị 12 tháng của năm được chọn
 */
export async function fetchNewUsersGrowthMetrics(
  timePeriod: TimePeriodType = "week",
  selectedValue: string = ""
): Promise<NewUsersGrowthData[]> {
  try {
    let result: any[] = []
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    let targetDate = today
    let targetYear = currentYear
    let targetMonth = currentMonth

    // Parse selectedValue based on timePeriod
    if (selectedValue) {
      if (timePeriod === "day") {
        // selectedValue is a date string (YYYY-MM-DD)
        targetDate = new Date(selectedValue)
      } else if (timePeriod === "month") {
        // selectedValue is month number (1-12)
        targetMonth = parseInt(selectedValue) || currentMonth
      } else if (timePeriod === "year") {
        // selectedValue is year string
        targetYear = parseInt(selectedValue) || currentYear
      }
    }

    switch (timePeriod) {
      case "day": {
        // Get hourly data for selected day
        const dateStr = targetDate.toISOString().split("T")[0]
        const data = await sql`
          SELECT 
            EXTRACT(HOUR FROM users.created_at) as hour,
            COUNT(*) as newUsers
          FROM users
          WHERE DATE(users.created_at) = ${dateStr}::date
          GROUP BY EXTRACT(HOUR FROM users.created_at)
          ORDER BY EXTRACT(HOUR FROM users.created_at) ASC
        `
        result = data
        break
      }
      case "week": {
        // Get daily data for current week
        const data = await sql`
          SELECT 
            DATE(users.created_at)::date as date,
            COUNT(*) as newUsers
          FROM users
          WHERE DATE_TRUNC('week', users.created_at) = DATE_TRUNC('week', CURRENT_DATE)
          GROUP BY DATE(users.created_at)
          ORDER BY DATE(users.created_at) ASC
        `
        result = data
        break
      }
      case "month": {
        // Get daily data for selected month
        const data = await sql`
          SELECT 
            DATE(users.created_at)::date as date,
            COUNT(*) as newUsers
          FROM users
          WHERE EXTRACT(MONTH FROM users.created_at) = ${targetMonth}
            AND EXTRACT(YEAR FROM users.created_at) = ${currentYear}
          GROUP BY DATE(users.created_at)
          ORDER BY DATE(users.created_at) ASC
        `
        result = data
        break
      }
      case "year": {
        // Get monthly data for selected year
        const data = await sql`
          SELECT 
            DATE_TRUNC('month', users.created_at)::date as date,
            COUNT(*) as newUsers
          FROM users
          WHERE EXTRACT(YEAR FROM users.created_at) = ${targetYear}
          GROUP BY DATE_TRUNC('month', users.created_at)
          ORDER BY DATE_TRUNC('month', users.created_at) ASC
        `
        result = data
        break
      }
      default: {
        // Default: current week
        const data = await sql`
          SELECT 
            DATE(users.created_at)::date as date,
            COUNT(*) as newUsers
          FROM users
          WHERE DATE_TRUNC('week', users.created_at) = DATE_TRUNC('week', CURRENT_DATE)
          GROUP BY DATE(users.created_at)
          ORDER BY DATE(users.created_at) ASC
        `
        result = data
        break
      }
    }

    // Generate complete time series for current period
    let fullSeries: any[] = []

    if (timePeriod === "day") {
      // Generate 24 hours (0h-23h) for selected day
      for (let h = 0; h < 24; h++) {
        const period = `${h}h`
        fullSeries.push({
          period,
          date: h.toString(),
          newUsers: 0,
        })
      }
    } else if (timePeriod === "week") {
      // Generate 7 days of current week (Mon-Sun)
      const first = today.getDate() - today.getDay() + 1 // Monday
      for (let i = 0; i < 7; i++) {
        const day = new Date(today)
        day.setDate(first + i)
        const dayNames = [
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "CN",
        ]
        const period = `${dayNames[i]} (${day.getDate()}/${day.getMonth() + 1})`
        const dateStr = day.toISOString().split("T")[0]
        fullSeries.push({
          period,
          date: dateStr,
          newUsers: 0,
        })
      }
    } else if (timePeriod === "month") {
      // Generate days of selected month
      const daysInMonth = new Date(currentYear, targetMonth, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const period = `${d}/${targetMonth}`
        const dateStr = `${currentYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        fullSeries.push({
          period,
          date: dateStr,
          newUsers: 0,
        })
      }
    } else if (timePeriod === "year") {
      // Generate 12 months for selected year
      const monthNames = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ]
      for (let m = 1; m <= 12; m++) {
        const period = monthNames[m - 1]
        const dateStr = `${targetYear}-${String(m).padStart(2, "0")}-01`
        fullSeries.push({
          period,
          date: dateStr,
          newUsers: 0,
        })
      }
    }

    // Merge with DB results
    if (timePeriod === "day") {
      // For day, map by hour
      const dbMap = new Map(result.map((row: any) => [Number(row.hour), row]))
      const mappedResult = fullSeries.map((timeSlot, index) => {
        const dbRow = dbMap.get(index)
        return {
          period: timeSlot.period,
          newUsers: dbRow ? parseInt(dbRow.newusers) || 0 : 0,
        }
      })
      return mappedResult
    } else if (timePeriod === "year") {
      // For year, map by month extracted from date
      const dbMap = new Map(
        result.map((row: any) => {
          const monthFromDate = new Date(row.date).getMonth() + 1
          return [monthFromDate, row]
        })
      )
      const mappedResult = fullSeries.map((timeSlot, index) => {
        const dbRow = dbMap.get(index + 1)
        return {
          period: timeSlot.period,
          newUsers: dbRow ? parseInt(dbRow.newusers) || 0 : 0,
        }
      })
      return mappedResult
    } else {
      // For week/month, map by date
      const dbMap = new Map(
        result.map((row: any) => {
          // Convert ISO date with timezone to YYYY-MM-DD format
          const dateOnly =
            row.date instanceof Date
              ? row.date.toISOString().split("T")[0]
              : String(row.date).split("T")[0]
          return [dateOnly, row]
        })
      )

      const mappedResult = fullSeries.map((timeSlot) => {
        const dbRow = dbMap.get(timeSlot.date)
        return {
          period: timeSlot.period,
          newUsers: dbRow ? parseInt(dbRow.newusers) || 0 : 0,
        }
      })
      return mappedResult
    }
  } catch (error) {
    console.error("Error fetching new users growth:", error)
    return []
  }
}

// ============== EMPLOYEE FUNCTIONS ==============

/**
 * Fetch mandatory courses due soon for employee
 */
export async function fetchMandatoryCoursesMetrics(
  userId: string
): Promise<MandatoryCourseData[]> {
  try {
    const result = await sql`
      SELECT 
        c.id,
        c.title,
        e.due_date,
        e.status,
        EXTRACT(DAY FROM e.due_date - CURRENT_DATE) as daysUntilDue
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ${userId}
        AND e.is_mandatory = true
        AND e.status IN ('pending', 'in_progress')
        AND e.due_date IS NOT NULL
      ORDER BY e.due_date ASC
    `

    return (
      result.map((row: any) => ({
        id: row.id,
        title: row.title,
        dueDate: row.due_date,
        daysUntilDue: parseInt(row.daysUntilDue) || 0,
        isOverdue: parseInt(row.daysUntilDue) < 0,
        status: row.status,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching mandatory courses:", error)
    return []
  }
}

/**
 * Fetch personal learning progress
 */
export async function fetchPersonalLearningProgressMetrics(
  userId: string
): Promise<PersonalLearningProgressData[]> {
  try {
    const result = await sql`
      SELECT 
        c.id as courseId,
        c.title as courseTitle,
        ROUND(
          100.0 * COALESCE(SUM(CASE WHEN pl.status = 'completed' THEN 1 ELSE 0 END), 0) /
          NULLIF(COUNT(pl.id), 0)
        ) as progressPercentage,
        TO_CHAR((MAX(COALESCE(pl.updated_at, e.enrolled_at, CURRENT_TIMESTAMP)) AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as lastUpdated
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN progress_lessons pl ON e.id = pl.enrollment_id
      WHERE e.user_id = ${userId}
        AND e.status IN ('in_progress', 'completed')
      GROUP BY c.id, c.title
      ORDER BY MAX(COALESCE(pl.updated_at, e.enrolled_at, CURRENT_TIMESTAMP)) DESC
    `

    return (
      result.map((row: any) => ({
        courseId: row.courseid || row.courseId,
        courseTitle: row.coursetitle || row.courseTitle,
        progressPercentage:
          parseInt(row.progresspercentage || row.progressPercentage) || 0,
        lastUpdated: row.lastupdated || row.lastUpdated,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching personal learning progress:", error)
    return []
  }
}

/**
 * Fetch employee contribution statistics
 */
export async function fetchContributionStatsMetrics(
  userId: string
): Promise<ContributionStatsData> {
  try {
    const result = await sql`
      SELECT 
        COALESCE((SELECT COUNT(*) FROM articles WHERE author_id = ${userId}), 0) as articles,
        COALESCE((SELECT COUNT(*) FROM questions WHERE user_id = ${userId}), 0) as questions,
        COALESCE((SELECT COUNT(*) FROM answers WHERE user_id = ${userId}), 0) as answers
    `

    return {
      articles: parseInt(result[0]?.articles) || 0,
      questions: parseInt(result[0]?.questions) || 0,
      answers: parseInt(result[0]?.answers) || 0,
    }
  } catch (error) {
    console.error("Error fetching contribution stats:", error)
    return {
      articles: 0,
      questions: 0,
      answers: 0,
    }
  }
}
