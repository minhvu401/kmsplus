import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { updateQuizAction } from "@/service/quiz.service"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const formData = await request.formData()

    const id = Number(formData.get("id"))
    if (!id) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const time_limit_minutes = formData.get("time_limit_minutes")
    const passing_score = formData.get("passing_score")
    const max_attempts = formData.get("max_attempts")

    // Validate title
    if (!title || title.trim().length < 10) {
      return NextResponse.json(
        { error: "Tên bài thi không được ít hơn 10 ký tự" },
        { status: 400 }
      )
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: "Tên bài thi không vượt quá 255 ký tự" },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeTitle(title)
    const sanitizedDescription = description
      ? sanitizeDescription(description)
      : null

    // Build update data
    const updateData: Record<string, any> = {
      title: sanitizedTitle,
      description: sanitizedDescription,
    }

    if (time_limit_minutes) {
      updateData.time_limit_minutes = Number(time_limit_minutes)
    }

    if (passing_score) {
      updateData.passing_score = Number(passing_score)
    }

    if (max_attempts) {
      updateData.max_attempts = Number(max_attempts)
    }

    const updatedQuiz = await updateQuizAction(id, updateData)

    return NextResponse.json({ success: true, quiz: updatedQuiz })
  } catch (error) {
    console.error("Update quiz error:", error)
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
