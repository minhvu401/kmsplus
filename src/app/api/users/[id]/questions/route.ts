"use server"

import { NextResponse } from "next/server"
import { getUserQuestionsAction } from "@/service/question.service"

export async function GET(req: Request, context: any) {
  const params = context?.params
  const userId = Number(params?.id)
  if (!userId) {
    return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 })
  }

  try {
    const rows = await getUserQuestionsAction(userId)
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error("API: fetch user questions error", error)
    return NextResponse.json({ success: false, error: "Failed to fetch questions" }, { status: 500 })
  }
}
