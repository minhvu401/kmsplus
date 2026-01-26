// src/app/(main)/courses/[id]/lessons/[lessonId]/page.tsx

import React from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

// 1. Import Action kiểm tra trạng thái
import { checkItemCompletion } from "@/action/progress/progressAction"

// 2. Import Button (Nếu bạn để ở chỗ khác thì sửa đường dẫn nhé)
// Dựa vào tree của bạn, tôi đoán bạn để ở components của courses
import CompleteButton from "../../../components/CompleteButton"

export default async function LessonDetailPage({
  params,
}: {
  // 👇 Lưu ý: 'id' khớp với tên thư mục [id] của bạn
  // 'lessonId' khớp với tên thư mục [lessonId]
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id, lessonId } = await params

  // Kiểm tra đăng nhập
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // --- MOCK DATA (Thay bằng API getLessonById sau này) ---
  const lessonMock = {
    id: Number(lessonId),
    title: `Bài học #${lessonId}`,
    content: `
      <h2>Chào mừng bạn đến với bài học!</h2>
      <p>Đây là nội dung demo của bài học. Hãy đọc kỹ và bấm nút hoàn thành bên dưới.</p>
      <ul>
        <li>Kiến thức 1</li>
        <li>Kiến thức 2</li>
      </ul>
    `,
  }

  // --- KIỂM TRA TRẠNG THÁI HOÀN THÀNH ---
  const isCompleted = await checkItemCompletion(
    Number(id), // Course ID
    Number(lessonId), // Lesson ID
    "lesson"
  )

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <div className="text-sm text-gray-500 mb-2">
          Course ID: {id} &gt; Lesson: {lessonId}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{lessonMock.title}</h1>
      </div>

      {/* Nội dung bài học */}
      <div
        className="prose max-w-none bg-white p-8 rounded-xl border border-gray-100 shadow-sm mb-8"
        dangerouslySetInnerHTML={{ __html: lessonMock.content }}
      />

      {/* Footer điều hướng & Nút Complete */}
      <div className="flex justify-between items-center border-t pt-6">
        <button className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
          &larr; Previous Lesson
        </button>

        {/* 👇 GẮN NÚT TRACKING VÀO ĐÂY */}
        <CompleteButton
          courseId={Number(id)}
          itemId={Number(lessonId)}
          itemType="lesson"
          initialCompleted={isCompleted}
        />

        <button className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
          Next Lesson &rarr;
        </button>
      </div>
    </div>
  )
}
