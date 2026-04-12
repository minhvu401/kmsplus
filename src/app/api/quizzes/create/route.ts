import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { createQuizAction } from "@/service/quiz.service"
import { parseAndValidateQuizFormData } from "@/action/quiz/quizHelper"

/**
 * POST /api/quizzes/create
 * Create a new quiz with questions
 *
 * Expects FormData with:
 * - category_id: number
 * - title: string
 * - description: string (optional)
 * - status: string (draft, published, archived)
 * - time_limit_minutes: number (optional)
 * - passing_score: number (optional, default 70)
 * - max_attempts: number (optional, default 3)
 * - question_ids: JSON string array of question IDs (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify permission
    await requirePermission(Permission.CREATE_QUIZ)
    const formData = await request.formData()
    console.log("[API] FormData received, parsing and validating...")

    // Parse and validate FormData
    const parsedData = parseAndValidateQuizFormData(formData)
    console.log("[API] Data validated, calling createQuizAction...")

    // Call service directly to create quiz
    await createQuizAction({
      category_id: parsedData.category_id,
      title: parsedData.title,
      description: parsedData.description,
      status: parsedData.status,
      time_limit_minutes: parsedData.time_limit_minutes,
      passing_score: parsedData.passing_score,
      max_attempts: parsedData.max_attempts,
      questionIds: parsedData.questionIds,
    })
    console.log("[API] Quiz created successfully")
    return NextResponse.json(
      { message: "Quiz created successfully" },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[API] Error creating quiz:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      )
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create quiz"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
