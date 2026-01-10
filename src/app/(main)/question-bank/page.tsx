import { getAllQuizQuestions } from "@/action/question-bank/questionBankActions"
import QuestionBankClient from "@/components/ui/question-bank-client"
import { QuizQuestionDetail } from "@/service/questionbank.service"
import React from "react"

// Định nghĩa kiểu cho các tham số tìm kiếm trên URL
interface QuestionBankPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    query?: string
  }>
}

// Page component này chạy hoàn toàn trên server
export default async function QuestionBankPage({
  searchParams,
}: QuestionBankPageProps) {
  const params = await searchParams
  // Lấy các tham số từ URL, nếu không có thì dùng giá trị mặc định
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 10
  const query = params.query || ""

  // Gọi Server Action để lấy dữ liệu từ database
  const { quizQuestion, totalCount } = await getAllQuizQuestions({
    page,
    limit,
    query,
  })

  return (
    // Render Client Component và truyền dữ liệu đã lấy được xuống làm props
    <QuestionBankClient
      initialQuestions={quizQuestion as QuizQuestionDetail[]}
      totalCount={totalCount}
    />
  )
}
