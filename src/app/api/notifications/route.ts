import { NextResponse } from 'next/server'
import { sql } from '@/lib/database'

export async function GET() {
  try {
    const notifications = await sql`
      SELECT *
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 20
    `

    const safeNotifications = (notifications as any[]).map((item) => ({
      id: String(item.id),
      user_id: Number(item.user_id || 0),
      title: String(item.title || ''),
      content: String(item.content || ''),
      thumbnail_url: item.thumbnail_url ?? item.thumbnai1_url ?? null,
      type: String(item.type || 'general'),
      redirect_url: String(item.redirect_url || '#'),
      is_read: Boolean(item.is_read),
      created_at: (() => {
        const d = item.created_at instanceof Date ? item.created_at : new Date(item.created_at)
        return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
      })(),
    }))

    const unreadCount = safeNotifications.filter((item) => !item.is_read).length

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
