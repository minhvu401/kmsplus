"use server"

import { requireAuth } from "@/lib/auth"
import {
	getLatestNotificationsAction,
	markNotificationAsReadByIdAction,
} from "@/service/notification.service"

export type NotificationView = {
	id: string
	user_id: number
	title: string
	content: string
	thumbnail_url: string | null
	type: string
	redirect_url: string
	is_read: boolean
	created_at: string
}

export async function getNotifications(limit: number = 20): Promise<{
	success: boolean
	data: NotificationView[]
	unreadCount: number
	message?: string
}> {
	try {
		await requireAuth()
		const notifications = await getLatestNotificationsAction(limit)

		const safeNotifications: NotificationView[] = notifications.map((item) => ({
			id: String(item.id),
			user_id: Number(item.user_id),
			title: item.title,
			content: item.content,
			thumbnail_url: item.thumbnail_url,
			type: item.type,
			redirect_url: item.redirect_url,
			is_read: Boolean(item.is_read),
			created_at:
				item.created_at instanceof Date
					? item.created_at.toISOString()
					: new Date(item.created_at as any).toISOString(),
		}))

		return {
			success: true,
			data: safeNotifications,
			unreadCount: safeNotifications.filter((item) => !item.is_read).length,
		}
	} catch (error: any) {
		console.error("Get notifications action error:", error)
		return {
			success: false,
			data: [],
			unreadCount: 0,
			message: error?.message || "Failed to get notifications",
		}
	}
}

export async function markNotificationAsRead(notificationId: string): Promise<{
	success: boolean
	message: string
}> {
	try {
		await requireAuth()
		return await markNotificationAsReadByIdAction(notificationId)
	} catch (error: any) {
		console.error("Mark notification as read action error:", error)
		return {
			success: false,
			message: error?.message || "Failed to mark notification as read",
		}
	}
}
