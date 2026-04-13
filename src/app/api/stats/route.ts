import { NextResponse } from "next/server"
import { getSiteCountsAction } from "@/service/stats.service"

export async function GET() {
  try {
    const counts = await getSiteCountsAction()
    return NextResponse.json({ success: true, data: counts })
  } catch (error: any) {
    console.error("/api/stats error:", error)
    return NextResponse.json({ success: false, data: { questions: 0, answers: 0, comments: 0 } }, { status: 500 })
  }
}
