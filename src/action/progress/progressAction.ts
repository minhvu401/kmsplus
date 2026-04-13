// @/action/progress/progressAction.ts
"use server"

import { requireAuth, getCurrentUser } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { revalidatePath } from "next/cache"
import {
  getPersonalHistoryService,
  updateProgressService,
  checkItemCompletionService,
  getCompletedItemIds,
} from "@/service/progress.service"

/**
 * US-01: View Personal History (Protected)
 */
export async function getPersonalHistory() {
  await requirePermission(Permission.VIEW_PERSONAL_PROGRESS)
  await requireAuth()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "User not found" }

  const result = await getPersonalHistoryService(Number(user.id))
  return result
}

/**
 * US-02: Track Progress (Protected)
 */
export async function updateProgress(
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  await requirePermission(Permission.VIEW_PERSONAL_PROGRESS)
  await requireAuth()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "User not found" }

  const result = await updateProgressService(
    Number(user.id),
    courseId,
    itemId,
    itemType
  )

  if (result.success) {
    revalidatePath("/history")
    revalidatePath(`/courses/${courseId}`)
    revalidatePath(`/courses/${courseId}/learning`)
  }

  return result
}

/**
 * Helper: Kiểm tra trạng thái hoàn thành (Server Component)
 */
export async function checkItemCompletion(
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  const user = await getCurrentUser()
  if (!user) return false

  return await checkItemCompletionService(
    Number(user.id),
    courseId,
    itemId,
    itemType
  )
}
