import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { rejectArticleAction } from '@/service/articles.service'

export async function POST(request: Request) {
  try {
    await requireAuth()
    const { id, reason } = await request.json()
    const articleId = Number(id)
    if (!articleId) {
      return NextResponse.json({ success: false, message: 'Invalid article id' }, { status: 400 })
    }

    const result = await rejectArticleAction(articleId, reason || '')
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Reject article error:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Failed to reject article' }, { status: 500 })
  }
}
