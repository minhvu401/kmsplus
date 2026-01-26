import { getAllCourses } from "@/action/courses/courseAction"
import ManageCoursesClient from "../components/ManageCoursesClient"
import { getAllQuizzesAction } from "@/service/quiz.service"
import { getAllLessonsAction } from "@/service/lesson.service"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ManagerCoursesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params?.page || "1") || 1
  const query = Array.isArray(params?.query)
    ? params?.query[0]
    : (params?.query as string) || ""
  const limit = 10

  // 1. Fetch dữ liệu song song
  const [coursesData, lessonsRes, quizzesRes] = await Promise.all([
    getAllCourses({ query, page, limit }),
    getAllLessonsAction(),
    getAllQuizzesAction(),
  ])

  // 2. Trích xuất mảng courses
  const { courses = [], totalCount = 0 } = coursesData || {}

  // 👇 LOGIC AN TOÀN: Kiểm tra xem kết quả trả về là Mảng hay Object
  const safeLessons = Array.isArray(lessonsRes)
    ? lessonsRes
    : (lessonsRes as any)?.data || []
  const safeQuizzes = Array.isArray(quizzesRes)
    ? quizzesRes
    : (quizzesRes as any)?.data || (quizzesRes as any)?.quizzes || []

  // 👇 Debug Log: Xem Server lấy được gì (Kiểm tra terminal của VS Code)
  console.log("🔥 Raw lessonsRes:", lessonsRes)
  console.log("🔥 Raw quizzesRes:", quizzesRes)
  console.log("🔥 Lessons Count:", safeLessons.length)
  console.log("🔥 Quizzes Count:", safeQuizzes.length)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <ManageCoursesClient
          courses={courses}
          totalCount={totalCount}
          query={query}
          page={page}
          availableLessons={safeLessons}
          availableQuizzes={safeQuizzes}
        />
      </div>
    </main>
  )
}
