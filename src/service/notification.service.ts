"use server"

import { sql } from "@/lib/database"

export type NotificationItem = {
  id: string
  user_id: number
  title: string
  content: string
  thumbnail_url: string | null
  type: string
  redirect_url: string
  is_read: boolean
  created_at: Date
  article_id: number | null
  course_id: number | null
  comment_id: number | null
}

export async function getNotificationsByUserAction(
  userId: number,
  limit: number = 20
): Promise<NotificationItem[]> {
  const notifications = await sql`
    SELECT
      id,
      user_id,
      title,
      content,
      thumbnail_url,
      type,
      redirect_url,
      is_read,
      created_at,
      article_id,
      course_id,
      comment_id
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return notifications as NotificationItem[]
}

export async function getLatestNotificationsAction(
  userId: number,
  limit: number = 20
): Promise<NotificationItem[]> {
  const notifications = await sql`
    SELECT
      id,
      user_id,
      title,
      content,
      thumbnail_url,
      type,
      redirect_url,
      is_read,
      created_at,
      article_id,
      course_id,
      comment_id
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return notifications as NotificationItem[]
}

export async function getUnreadNotificationsCountByUserAction(userId: number): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::INT AS total
    FROM notifications
    WHERE user_id = ${userId} AND is_read = FALSE
  `

  return result[0]?.total || 0
}

export async function markNotificationAsReadAction(
  userId: number,
  notificationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ${notificationId} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: "Notification not found" }
    }

    return { success: true, message: "Notification marked as read" }
  } catch (error: any) {
    console.error("Error marking notification as read:", error)
    return { success: false, message: error?.message || "Failed to mark notification as read" }
  }
}

export async function markNotificationAsReadByIdAction(
  notificationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ${notificationId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: "Notification not found" }
    }

    return { success: true, message: "Notification marked as read" }
  } catch (error: any) {
    console.error("Error marking notification as read by id:", error)
    return { success: false, message: error?.message || "Failed to mark notification as read" }
  }
}
