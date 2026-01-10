// @/app/(main)/courses/create/page.tsx
import type { Metadata } from "next"
// import nextDynamic from "next/dynamic"
import { getAllLessonsAction } from "@/service/lesson.service"
import { getAllQuizzesAction } from "@/service/quiz.service"
import CreateCourseWrapper from "./CreateCourseWrapper"

export const metadata: Metadata = {
  title: "Create Course",
}

// 3. Bắt buộc force-dynamic để luôn lấy dữ liệu mới nhất từ DB
export const dynamic = "force-dynamic"

export default async function CreateCoursePage() {
  // Chuẩn bị biến chứa dữ liệu
  let initialLessons: any[] = []
  let initialQuizzes: any[] = []

  // 4. Lấy danh sách Lesson thật từ DB
  try {
    const lessonsResult = await getAllLessonsAction({ limit: 100 })
    // Kiểm tra structure trả về (Service của bạn trả về { data: [], pagination: {} })
    if (lessonsResult && lessonsResult.data) {
      initialLessons = lessonsResult.data
    }
  } catch (error) {
    console.error("Error fetching lessons:", error)
  }

  // 5. Lấy danh sách Quiz thật từ DB
  try {
    const quizzesResult = await getAllQuizzesAction()
    if (quizzesResult && quizzesResult.data) {
      initialQuizzes = quizzesResult.data
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 6. Truyền dữ liệu thật xuống Client */}
        <CreateCourseWrapper
          initialLessons={initialLessons}
          initialQuizzes={initialQuizzes}
        />
      </div>
    </main>
  )
}
