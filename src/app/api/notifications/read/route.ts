import { NextResponse } from 'next/server'
import { markNotificationAsReadByIdAction } from '@/service/notification.service'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid notification id' }, { status: 400 })
    }

    const result = await markNotificationAsReadByIdAction(String(id))
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
