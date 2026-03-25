import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { markNotificationAsReadAction } from '@/service/notification.service'

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth()
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid notification id' }, { status: 400 })
    }

    const result = await markNotificationAsReadAction(Number(currentUser.id), String(id))
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
