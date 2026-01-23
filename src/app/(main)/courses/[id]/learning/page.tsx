// src/app/(main)/courses/[id]/learning/page.tsx

import { notFound, redirect } from "next/navigation"
import { getCourseByIdAction } from "@/service/course.service"
import { checkEnrollmentStatus } from "@/action/enrollment/enrollmentAction"
import { getCurrentUser } from "@/lib/auth"
import LearningClient from "../../components/LearningClient"

export default async function LearningPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const courseId = Number(id)

  // 1. Kiểm tra quyền truy cập
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [course, enrollment] = await Promise.all([
    getCourseByIdAction(courseId),
    checkEnrollmentStatus(courseId, Number(user.id)),
  ])

  // Nếu chưa ghi danh, không cho phép vào trang học
  if (!course || !enrollment) {
    redirect(`/courses/${id}`)
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <LearningClient course={course as any} enrollment={enrollment} />
    </div>
  )
}
