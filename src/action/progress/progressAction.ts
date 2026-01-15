// @/action/progress/progressAction.ts
"use server"

import { requireAuth, getCurrentUser } from "@/lib/auth" // Import Auth giống file userAction.ts
import { revalidatePath } from "next/cache"
import {
  getPersonalHistoryService,
  updateProgressService,
  checkItemCompletionService,
} from "@/service/progress.service" // Import từ Service vừa tạo

/**
 * US-01: View Personal History (Protected)
 */
export async function getPersonalHistory() {
  // 1. Check Auth (Bắt buộc đăng nhập)
  await requireAuth()

  // 2. Lấy User hiện tại để lấy ID
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "User not found" }

  // 3. Gọi Service
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
  // 1. Check Auth
  await requireAuth()
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "User not found" }

  // 2. Gọi Service
  const result = await updateProgressService(
    Number(user.id),
    courseId,
    itemId,
    itemType
  )

  // 3. Revalidate nếu thành công
  if (result.success) {
    revalidatePath("/history")
    revalidatePath(`/courses/${courseId}`)
  }

  return result
}

/**
 * Helper: Kiểm tra trạng thái hoàn thành (Dùng cho Server Component)
 */
export async function checkItemCompletion(
  courseId: number,
  itemId: number,
  itemType: "lesson" | "quiz"
) {
  // Không cần requireAuth chặt chẽ ở đây nếu chỉ dùng nội bộ Server Component,
  // nhưng an toàn thì cứ check
  const user = await getCurrentUser()
  if (!user) return false

  return await checkItemCompletionService(
    Number(user.id),
    courseId,
    itemId,
    itemType
  )
}
