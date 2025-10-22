import React from "react"
// Component này định nghĩa cấu trúc chung cho tất cả các trang trong thư mục /question-bank
export default function QuestionBankLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Dựng khung chính bằng flexbox, chiếm toàn bộ chiều cao màn hình
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto bg-gray-100 p-8">{children}</main>
    </div>
  )
}
