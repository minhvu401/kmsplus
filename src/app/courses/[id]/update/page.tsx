import type { Metadata } from "next"
import { getCourseById } from "@/action/courses/courseAction"
import { notFound } from "next/navigation"
import UpdateCourseForm from "./UpdateCourseForm"
import type { CoursePayload } from "./UpdateCourseForm"

export const metadata: Metadata = {
  title: "Update Course",
}

type Props = {
  params: { id: string }
}

export default async function UpdateCoursePage({ params }: Props) {
  const id = Number(params.id)

  if (!id || Number.isNaN(id)) {
    notFound()
  }

  // Lấy dữ liệu khóa học từ database
  const course = await getCourseById(id)

  if (!course) {
    notFound()
  }

  // Chuẩn bị dữ liệu ban đầu cho form
  const initialData: CoursePayload = {
    id: course.id,
    creator_id: course.creator_id,
    title: course.title,
    slug: course.slug,
    description: course.description || undefined,
    thumbnail_url: course.thumbnail_url || undefined,
    status: course.status,
    duration_hours: course.duration_hours || undefined,
    curriculum: [], // TODO: Load curriculum từ database nếu có
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <UpdateCourseForm initialData={initialData} />
      </div>
    </main>
  )
}
