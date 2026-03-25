import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { approveArticleAction } from '@/service/articles.service'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { id } = await request.json()
    const articleId = Number(id)
    if (!articleId) {
      return NextResponse.json({ success: false, message: 'Invalid article id' }, { status: 400 })
    }

    const result = await approveArticleAction(articleId, Number(user.id))
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Approve article error:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Failed to approve article' }, { status: 500 })
  }
}
