import { useEffect } from "react"
import {
  createAISuggestion,
  getLatestSuggestion,
} from "@/action/ai-suggestion-action"

/**
 * Hook to auto-check and create AI suggestion when component mounts
 * Only creates if needed and user is admin
 */
export function useAutoAISuggestion(
  daysToCheck: number = 30,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const checkAndCreateSuggestion = async () => {
      try {
        // Check if latest suggestion exists
        const existingRes = await getLatestSuggestion()

        // If no pending suggestion, try to create one
        if (!existingRes.data) {
          await createAISuggestion(daysToCheck)
        }
      } catch (error) {
        // Silently fail - user might not be admin
      }
    }

    // Check on mount
    checkAndCreateSuggestion()

    // Optionally, check every hour
    const interval = setInterval(checkAndCreateSuggestion, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [daysToCheck, enabled])
}
