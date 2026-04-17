import { getQuizByCurriculumItemId } from "@/action/quiz/quizActions"
import { notFound, redirect } from "next/navigation"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const curriculumItemId = Number(id)

  // 1. Gọi hàm và ép kiểu an toàn kết hợp với Type hiện tại
  const result = await getQuizByCurriculumItemId(curriculumItemId)
  if (!result) {
    notFound()
  }

  // 2. Giao thoa kiểu để khai báo rằng object này có thể chứa course_id hoặc courseId
  const quiz = result as typeof result & {
    course_id?: number
    courseId?: number
  }

  // 3. Redirect an toàn
  const courseId = quiz.courseId || quiz.course_id

  // (Optional) Đề phòng trường hợp DB thật sự không trả về courseId
  if (!courseId) {
    console.error(
      "Lỗi: Không tìm thấy courseId từ hàm getQuizByCurriculumItemId"
    )
    // Có thể redirect về trang fallback nào đó, ví dụ: /courses
    redirect("/courses")
  }

  redirect(`/courses/${courseId}/learning?itemId=${curriculumItemId}`)
}
