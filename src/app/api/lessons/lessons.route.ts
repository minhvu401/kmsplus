import { NextResponse } from "next/server"
import {
  getAllLessonsAction,
  createLessonAction,
} from "@/service/lesson.service"

interface LessonResponse {
  id: number
  title: string
  duration_minutes: number | null
}

export async function GET(): Promise<NextResponse> {
  try {
    const result = await getAllLessonsAction({ include_deleted: false })
    const lessons: LessonResponse[] = result.data.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      duration_minutes: lesson.duration_minutes || 0,
    }))

    return NextResponse.json({
      success: true,
      data: lessons,
    })
  } catch (error) {
    console.error("Error fetching lessons:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { title, duration_minutes } = body

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      )
    }

    if (
      !duration_minutes ||
      typeof duration_minutes !== "number" ||
      duration_minutes <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Valid duration_minutes is required" },
        { status: 400 }
      )
    }

    // Create lesson for content bank with course_id = null
    const newLesson = await createLessonAction({
      course_id: null,
      title: title.trim(),
      content: "",
      duration_minutes,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newLesson.id,
        title: newLesson.title,
        duration_minutes: newLesson.duration_minutes,
      },
    })
  } catch (error) {
    console.error("Error creating lesson:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create lesson" },
      { status: 500 }
    )
  }
}
