"use server"

import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import * as service from "@/service/ai-suggestion.service"
import { revalidatePath } from "next/cache"

/**
 * Analyze Q&A topics for a given time period
 */
export async function analyzeQATopics(days: number = 30) {
  try {
    await requirePermission(Permission.VIEW_STATISTICS)
    const topics = await service.analyzeTopic(days)
    return {
      success: true,
      data: topics,
      message: `Analyzed topics from last ${days} days`,
    }
  } catch (error) {
    console.error("Error analyzing topics:", error)
    return {
      success: false,
      error: "Failed to analyze topics",
    }
  }
}

/**
 * Get the top topic from Q&A
 */
export async function getTopQATopic(days: number = 30) {
  try {
    await requirePermission(Permission.VIEW_STATISTICS)
    const topic = await service.getTopTopic(days)
    return {
      success: true,
      data: topic,
    }
  } catch (error) {
    console.error("Error getting top topic:", error)
    return {
      success: false,
      error: "Failed to get top topic",
    }
  }
}

/**
 * Create AI suggestion if conditions are met
 * Admin only
 */
export async function createAISuggestion(days: number = 30) {
  try {
    await requirePermission(Permission.MANAGE_SYSTEM)

    // Check if should create new suggestion
    const shouldCreate = await service.shouldCreateNewSuggestion(days)
    if (!shouldCreate) {
      return {
        success: false,
        error: "A similar suggestion already exists",
      }
    }

    // Get top topic
    const topTopic = await service.getTopTopic(days)
    if (!topTopic) {
      return {
        success: false,
        error: "No topics found in Q&A",
      }
    }

    // Save suggestion
    const suggestion = await service.saveSuggestion(
      topTopic.topic,
      topTopic.count,
      days
    )

    revalidatePath("/metrics")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: suggestion,
      message: `Created suggestion for topic: "${topTopic.topic}"`,
    }
  } catch (error) {
    console.error("Error creating suggestion:", error)
    return {
      success: false,
      error: "Failed to create suggestion",
    }
  }
}

/**
 * Approve suggestion and navigate to course creation
 * Admin only
 */
export async function approveSuggestion(suggestionId: number) {
  try {
    const user = await requirePermission(Permission.MANAGE_SYSTEM)

    const updated = await service.updateSuggestionStatus(
      suggestionId,
      "approved",
      parseInt(user.id) || undefined
    )

    revalidatePath("/metrics")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: updated,
      message: "Suggestion approved. Redirect to course creation.",
    }
  } catch (error) {
    console.error("Error approving suggestion:", error)
    return {
      success: false,
      error: "Failed to approve suggestion",
    }
  }
}

/**
 * Dismiss suggestion
 * Admin only
 */
export async function dismissSuggestion(suggestionId: number) {
  try {
    const user = await requirePermission(Permission.MANAGE_SYSTEM)

    const updated = await service.updateSuggestionStatus(
      suggestionId,
      "dismissed",
      parseInt(user.id) || undefined
    )

    revalidatePath("/metrics")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: updated,
      message: "Suggestion dismissed.",
    }
  } catch (error) {
    console.error("Error dismissing suggestion:", error)
    return {
      success: false,
      error: "Failed to dismiss suggestion",
    }
  }
}

/**
 * Get latest pending suggestion
 */
export async function getLatestSuggestion() {
  try {
    const suggestion = await service.getLatestSuggestion()
    return {
      success: true,
      data: suggestion,
    }
  } catch (error) {
    console.error("Error getting suggestion:", error)
    return {
      success: false,
      error: "Failed to get suggestion",
    }
  }
}
