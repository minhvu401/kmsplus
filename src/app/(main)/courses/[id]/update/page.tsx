/**
 * Update Course Page
 * This page allows users to update course information
 * /update/:id
 * @/(main)/courses/[id]/update
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCourseByIdAction } from "@/service/course.service"
import UpdateCourseForm from "@/app/(main)/courses/components/UpdateCourseForm"
import { getAllLessonsAction } from "@/service/lesson.service"
import { getAllQuizzes } from "@/action/quiz/quizActions"

type Lesson = { id: number; title: string; duration_minutes: number | null }
type Quiz = { id: number; title: string; question_count: number }
type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const courseId = Number(id)
  if (!courseId || Number.isNaN(courseId)) return { title: "Update Course" }
  const course = await getCourseByIdAction(courseId)
  return { title: course ? `Update ${course.title}` : "Update Course" }
}

export default async function UpdateCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // ✅ Next.js 15: Phải await params
  const { id } = await params
  const courseId = Number(id)
  if (isNaN(courseId)) notFound()
  // 👇 2. FETCH DỮ LIỆU(Dùng Promise.all cho nhanh)
  const [course, lessonsRes, quizzesRes] = await Promise.all([
    getCourseByIdAction(courseId),
    getAllLessonsAction({ limit: 1000 }), // Lấy số lượng lớn để hiện trong bank
    getAllQuizzes({}),
  ])
  if (!course) notFound()
  // 👇 3. MAP DỮ LIỆU VỀ ĐÚNG ĐỊNH DẠNG CỦA UI
  const availableLessons: Lesson[] = (lessonsRes?.data || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    duration_minutes: l.duration_minutes || 0,
  }))

  const availableQuizzes: Quiz[] = (quizzesRes?.data || []).map((q: any) => ({
    id: q.id,
    title: q.title,
    question_count: q.question_count || 0,
  }))

  // 3. Chuẩn bị initialData cho Form
  // Lưu ý: courseData từ service đã có sẵn curriculum đúng format, ta chỉ cần ép kiểu
  const initialPayload = {
    id: courseId,
    title: course.title,
    description: course.description,
    thumbnail_url: course.thumbnail_url,
    status: course.status,
    duration_hours: course.duration_hours,
    // 👇 QUAN TRỌNG: Dữ liệu này sẽ hiển thị lên cột phải
    curriculum: (course as any).curriculum || [],
  }

  // Parse curriculum từ JSON (nếu DB lưu dạng JSONB) hoặc giữ nguyên nếu đã query join
  // Lưu ý: Tùy vào cách bạn lưu curriculum, có thể cần map lại dữ liệu course ở đây.
  // Giả sử service getCourseById đã trả về đúng cấu trúc CoursePayload.

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <UpdateCourseForm
          initialData={course as any}
          availableLessons={availableLessons}
          availableQuizzes={availableQuizzes}
          onSuccess={() => {
            // Handle successful course update
            ;("Course updated successfully")
            // You can add additional logic here like redirecting
          }}
        />
      </div>
    </main>
  )
}
