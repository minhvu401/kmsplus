import { NextResponse } from "next/server"
import { getAllQuizzesAction } from "@/service/quiz.service"

interface QuizResponse {
  id: number
  title: string
  description: string | null
  time_limit: number | null
  passing_score: number | null
  max_attempts: number | null
  question_count: number
}

export async function GET() {
  try {
    const result = await getAllQuizzesAction({})
    if (!result.quizzes || result.quizzes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data available" },
        { status: 500 }
      )
    }
    const quizzes: QuizResponse[] = result.quizzes.map((quiz: any) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      time_limit: quiz.time_limit ?? null,
      passing_score: quiz.passing_score ?? null,
      max_attempts: quiz.max_attempts ?? null,
      question_count: quiz.question_count ?? 0,
    }))
    return NextResponse.json({
      success: true,
      data: quizzes,
    })
  } catch (error) {
    console.error("Error in GET /api/quizzes:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
