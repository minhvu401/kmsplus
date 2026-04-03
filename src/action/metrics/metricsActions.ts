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
  fetchKnowledgeGapMetrics,
  fetchTrendingKeywordsMetrics,
  fetchCourseDropoffRateMetrics,
  fetchUnansweredQuestionsMetrics,
  fetchTopContributorsMetrics,
  fetchTopLearnersMetrics,
  fetchQuestionBankHealthMetrics,
  fetchPendingItemsMetrics,
  fetchNewUsersGrowthMetrics,
  fetchMandatoryCoursesMetrics,
  fetchPersonalLearningProgressMetrics,
  fetchContributionStatsMetrics,
  type ActiveUsersData,
  type AdoptionRateData,
  type CourseCompletionRateData,
  type TopCategoryData,
  type ContentRatingData,
  type KnowledgeGapData,
  type TrendingKeywordData,
  type CourseDropoffRateData,
  type UnansweredQuestionData,
  type ContributorData,
  type QuestionBankHealthData,
  type PendingItemsData,
  type NewUsersGrowthData,
  type MandatoryCourseData,
  type PersonalLearningProgressData,
  type ContributionStatsData,
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
export async function getCurrentAverageRatingAction(
  data: ContentRatingData[]
): Promise<number> {
  return getCurrentAverageRating(data)
}

// ============== TRAINING MANAGER ACTIONS ==============

/**
 * Get knowledge gap metrics (zero-result searches)
 */
export async function getKnowledgeGapMetrics(): Promise<KnowledgeGapData[]> {
  try {
    const data = await fetchKnowledgeGapMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch knowledge gap metrics:", error)
    return []
  }
}

/**
 * Get trending keywords metrics
 */
export async function getTrendingKeywordsMetrics(): Promise<
  TrendingKeywordData[]
> {
  try {
    const data = await fetchTrendingKeywordsMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch trending keywords:", error)
    return []
  }
}

/**
 * Get course drop-off rate metrics
 */
export async function getCourseDropoffRateMetrics(): Promise<
  CourseDropoffRateData[]
> {
  try {
    const data = await fetchCourseDropoffRateMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch course dropoff rate:", error)
    return []
  }
}

/**
 * Get unanswered questions metrics
 */
export async function getUnansweredQuestionsMetrics(): Promise<UnansweredQuestionData> {
  try {
    const data = await fetchUnansweredQuestionsMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch unanswered questions:", error)
    return {
      resolved: 0,
      unresolved: 0,
      resolutionRate: 0,
    }
  }
}

/**
 * Get top contributors metrics
 */
export async function getTopContributorsMetrics(): Promise<ContributorData[]> {
  try {
    const data = await fetchTopContributorsMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch top contributors:", error)
    return []
  }
}

/**
 * Get top learners metrics
 */
export async function getTopLearnersMetrics(): Promise<ContributorData[]> {
  try {
    const data = await fetchTopLearnersMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch top learners:", error)
    return []
  }
}

/**
 * Get question bank health metrics
 */
export async function getQuestionBankHealthMetrics(): Promise<
  QuestionBankHealthData[]
> {
  try {
    const data = await fetchQuestionBankHealthMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch question bank health:", error)
    return []
  }
}

// ============== SYSTEM ADMIN ACTIONS ==============

/**
 * Get pending items metrics (articles & courses)
 */
export async function getPendingItemsMetrics(): Promise<PendingItemsData> {
  try {
    const data = await fetchPendingItemsMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch pending items:", error)
    return {
      articles: 0,
      courses: 0,
    }
  }
}

/**
 * Get new users growth metrics
 */
export async function getNewUsersGrowthMetrics(): Promise<
  NewUsersGrowthData[]
> {
  try {
    const data = await fetchNewUsersGrowthMetrics()
    return data
  } catch (error) {
    console.error("Failed to fetch new users growth:", error)
    return []
  }
}

// ============== EMPLOYEE ACTIONS ==============

/**
 * Get mandatory courses metrics for a user
 */
export async function getMandatoryCoursesMetrics(
  userId: string
): Promise<MandatoryCourseData[]> {
  try {
    const data = await fetchMandatoryCoursesMetrics(userId)
    return data
  } catch (error) {
    console.error("Failed to fetch mandatory courses:", error)
    return []
  }
}

/**
 * Get personal learning progress metrics for a user
 */
export async function getPersonalLearningProgressMetrics(
  userId: string
): Promise<PersonalLearningProgressData[]> {
  try {
    const data = await fetchPersonalLearningProgressMetrics(userId)
    return data
  } catch (error) {
    console.error("Failed to fetch personal learning progress:", error)
    return []
  }
}

/**
 * Get contribution stats metrics for a user
 */
export async function getContributionStatsMetrics(
  userId: string
): Promise<ContributionStatsData> {
  try {
    const data = await fetchContributionStatsMetrics(userId)
    return data
  } catch (error) {
    console.error("Failed to fetch contribution stats:", error)
    return {
      articles: 0,
      questions: 0,
      answers: 0,
    }
  }
}
