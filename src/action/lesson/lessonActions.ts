//  src/actions/lesson/lessonActions.ts
"use server"
import { createLessonAction } from "@/service/lesson.service"

// 1. Định nghĩa lại type Lesson để tránh import chéo (Circular Dependency)
export type Lesson = {
  id: number
  title: string
  duration_minutes: number | null
}
export async function createNewLessonAPI(data: {
  title: string
  content: string
  type: string
}): Promise<Lesson> {
  console.log("🔥 [Server Action] Saving Lesson:", data)

  try {
    const newLesson = await createLessonAction({
      title: data.title,
      content: data.content,
      // 👇 Truyền type xuống Service (DB)
      type: data.type,
      course_id: null,
      duration_minutes: 0,
    })

    return {
      id: newLesson.id,
      title: newLesson.title,
      duration_minutes: newLesson.duration_minutes,
      // type: newLesson.type // (Optional: trả về nếu frontend cần dùng ngay)
    }
  } catch (error) {
    console.error("Failed to create lesson:", error)
    throw new Error("Could not create lesson")
  }
}
