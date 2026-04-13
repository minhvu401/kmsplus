"use server"

import { requireAuth } from "@/lib/auth"
import {
	getLatestNotificationsAction,
	getUnreadNotificationsCountByUserAction,
	markNotificationAsReadAction,
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
	article_id: number | null
	course_id: number | null
	comment_id: number | null
}

export async function getNotifications(limit: number = 20): Promise<{
	success: boolean
	data: NotificationView[]
	unreadCount: number
	message?: string
}> {
	try {
		const currentUser = await requireAuth()
		const userId = Number(currentUser.id)
		const notifications = await getLatestNotificationsAction(userId, limit)
		const unreadCount = await getUnreadNotificationsCountByUserAction(userId)

		const safeNotifications: NotificationView[] = notifications.map((item) => ({
			id: String(item.id),
			user_id: Number(item.user_id),
			title: item.title,
			content: item.content,
			thumbnail_url: item.thumbnail_url,
			type: item.type,
			redirect_url: item.redirect_url,
			is_read: Boolean(item.is_read),
			article_id: item.article_id === null || item.article_id === undefined ? null : Number(item.article_id),
			course_id: item.course_id === null || item.course_id === undefined ? null : Number(item.course_id),
			comment_id: item.comment_id === null || item.comment_id === undefined ? null : Number(item.comment_id),
			created_at:
				item.created_at instanceof Date
					? item.created_at.toISOString()
					: new Date(item.created_at as any).toISOString(),
		}))

		return {
			success: true,
			data: safeNotifications,
			unreadCount,
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
		const currentUser = await requireAuth()
		return await markNotificationAsReadAction(Number(currentUser.id), notificationId)
	} catch (error: any) {
		console.error("Mark notification as read action error:", error)
		return {
			success: false,
			message: error?.message || "Failed to mark notification as read",
		}
	}
}
