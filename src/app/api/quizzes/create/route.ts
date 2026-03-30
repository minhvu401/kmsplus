import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createQuizAction } from "@/service/quiz.service"
import { parseAndValidateQuizFormData } from "@/action/quiz/quizHelper"

/**
 * POST /api/quizzes/create
 * Create a new quiz with questions
 *
 * Expects FormData with:
 * - course_id: number
 * - title: string
 * - description: string (optional)
 * - status: string (draft, published, archived)
 * - time_limit_minutes: number (optional)
 * - passing_score: number (optional, default 70)
 * - max_attempts: number (optional, default 3)
 * - question_ids: JSON string array of question IDs (optional)
 */
export async function POST(request: NextRequest) {
  ;("[API /api/quizzes/create] Request received")
  try {
    // Verify authentication
    ;("[API] Verifying authentication...")
    await requireAuth()("[API] Authentication verified")

    const formData = await request.formData()(
      "[API] FormData received, parsing and validating..."
    )

    // Parse and validate FormData
    const parsedData = parseAndValidateQuizFormData(formData)(
      "[API] Data validated, calling createQuizAction..."
    )

    // Call service directly to create quiz
    await createQuizAction({
      course_id: parsedData.course_id,
      title: parsedData.title,
      description: parsedData.description,
      status: parsedData.status,
      time_limit_minutes: parsedData.time_limit_minutes,
      passing_score: parsedData.passing_score,
      max_attempts: parsedData.max_attempts,
      questionIds: parsedData.questionIds,
    })("[API] Quiz created successfully")
    return NextResponse.json(
      { message: "Quiz created successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API] Error creating quiz:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create quiz"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
