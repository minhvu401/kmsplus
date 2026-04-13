import React from "react"
// Component này định nghĩa cấu trúc chung cho tất cả các trang trong thư mục /question-bank
export default function QuestionBankLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Dựng khung chính bằng flexbox, chiếm toàn bộ chiều cao màn hình
    <main className="flex-1 overflow-y-auto">{children}</main>
  )
}
