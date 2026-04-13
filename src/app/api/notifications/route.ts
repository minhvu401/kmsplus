import { NextResponse } from 'next/server'
import { sql } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = Number(currentUser.id)
    const { searchParams } = new URL(request.url)
    const rawLimit = Number(searchParams.get('limit') || '10')
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 50) : 10

    const [notifications, unreadRows] = await Promise.all([
      sql`
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
      `,
      sql`
        SELECT COUNT(*)::INT AS total
        FROM notifications
        WHERE user_id = ${userId} AND is_read = FALSE
      `,
    ])

    const safeNotifications = (notifications as any[]).map((item) => ({
      id: String(item.id),
      user_id: Number(item.user_id || 0),
      title: String(item.title || ''),
      content: String(item.content || ''),
      thumbnail_url: item.thumbnail_url ?? null,
      type: String(item.type || 'general'),
      redirect_url: String(item.redirect_url || '#'),
      is_read: Boolean(item.is_read),
      article_id: item.article_id === null || item.article_id === undefined ? null : Number(item.article_id),
      course_id: item.course_id === null || item.course_id === undefined ? null : Number(item.course_id),
      comment_id: item.comment_id === null || item.comment_id === undefined ? null : Number(item.comment_id),
      created_at: (() => {
        const d = item.created_at instanceof Date ? item.created_at : new Date(item.created_at)
        return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
      })(),
    }))

    const unreadCount = unreadRows[0]?.total || 0

    return NextResponse.json({ success: true, data: safeNotifications, unreadCount })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to get notifications',
        detail: error?.detail || null,
        code: error?.code || null,
      },
      { status: 500 }
    )
  }
}
