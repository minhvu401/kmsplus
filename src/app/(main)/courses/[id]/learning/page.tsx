// src/app/(main)/courses/[id]/learning/page.tsx
import React from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getCourseByIdAction } from "@/service/course.service"
import { checkEnrollmentStatus } from "@/action/enrollment/enrollmentAction"
import { getCompletedItemIds } from "@/service/progress.service" // Import hàm vừa tạo
import LearningClient from "../../components/LearningClient" // Import component giao diện

interface LearningPageProps {
  params: Promise<{ id: string }>
}

export default async function LearningPage({ params }: LearningPageProps) {
  const { id } = await params
  const courseId = Number(id)
  const user = await getCurrentUser()

  // 1. Validate User & Course
  if (!user) redirect(`/login?next=/courses/${courseId}/learning`)
  if (isNaN(courseId)) notFound()

  // 2. Fetch dữ liệu song song
  const [course, enrollmentData] = await Promise.all([
    getCourseByIdAction(courseId),
    checkEnrollmentStatus(courseId, Number(user.id)),
  ])

  // 3. Kiểm tra quyền truy cập
  if (!course)
    notFound()(
      // 👇👇👇 DEBUG QUAN TRỌNG: Xem enrollmentData thực sự là gì
      "👉 [DEBUG PAGE] Enrollment Data:",
      enrollmentData
    )

  // Xử lý nếu enrollmentData là mảng (thường query SQL trả về mảng)
  let enrollment = null
  if (Array.isArray(enrollmentData)) {
    enrollment = enrollmentData[0]
  } else {
    enrollment = enrollmentData
  }

  // Nếu vẫn không có enrollment hoặc không có ID -> Đá về trang khóa học
  if (!enrollment || !enrollment.id) {
    console.error("❌ [ERROR] Enrollment ID not found or User not enrolled")
    redirect(`/courses/${courseId}`)
  }

  // 4. Lấy danh sách bài đã học (Lúc này enrollment.id chắc chắn đã có)
  // Ép kiểu Number() để chắc chắn ID là số
  const completedItemIds = await getCompletedItemIds(Number(enrollment.id))

  // 5. Render Giao diện học tập
  return (
    <LearningClient
      course={course}
      enrollment={enrollment}
      initialCompletedIds={completedItemIds}
      currentUser={user}
    />
  )
}
