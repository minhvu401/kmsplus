import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getUserCountsAction } from "@/service/stats.service"

export async function GET() {
  try {
    const user = await requireAuth()
    const userId = Number(user.id)
    const counts = await getUserCountsAction(userId)
    return NextResponse.json({ success: true, data: counts })
  } catch (error: any) {
    console.error("/api/stats/me error:", error)
    return NextResponse.json({ success: false, data: { questions: 0, answers: 0, comments: 0 } }, { status: 401 })
  }
}
