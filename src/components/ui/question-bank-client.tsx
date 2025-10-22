"use client"

import {
  Input,
  Button,
  Table,
  Pagination,
  Tag,
  Select,
  Modal,
  message,
  Space,
} from "antd"
import type { TableProps } from "antd"
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import React, { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { QuizQuestionDetail } from "@/service/questionbank.service"
import { deleteQuizQuestion } from "@/action/question-bank/questionBankActions"
import CreateQuestionModal from "@/components/form/create-question-modal"

// Định nghĩa kiểu cho props nhận từ Server Component
interface QuestionBankClientProps {
  initialQuestions: QuizQuestionDetail[]
  totalCount: number
}

const QuestionBankClient: React.FC<QuestionBankClientProps> = ({
  initialQuestions,
  totalCount,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Đọc các tham số hiện tại từ URL để hiển thị đúng trạng thái trên UI
  const currentPage = Number(searchParams.get("page")) || 1
  const currentQuery = searchParams.get("query") || ""

  // Hàm xử lý khi người dùng thay đổi trang hoặc tìm kiếm
  const handleFilterChange = (page: number, query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    if (query) {
      params.set("query", query)
    } else {
      params.delete("query")
    }
    // Cập nhật URL mà không cần tải lại toàn bộ trang
    startTransition(() => {
      router.push(`/question-bank?${params.toString()}`)
    })
  }

  // Xử lý khi người dùng bấm nút xóa
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this question?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteQuizQuestion(id)
          message.success("Question deleted successfully!")
          // Yêu cầu Next.js làm mới lại dữ liệu từ server
          router.refresh()
        } catch (error) {
          message.error("Failed to delete question.")
        }
      },
    })
  }

  // Định nghĩa các cột cho bảng Ant Design
  const columns: TableProps<QuizQuestionDetail>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (id) => `Q${String(id).padStart(3, "0")}`,
    },
    {
      title: "Question",
      dataIndex: "question_text",
      key: "question_text",
    },
    {
      title: "Tag",
      dataIndex: "category_name",
      key: "category_name",
      render: (tag) =>
        tag ? <Tag color="blue">{String(tag).toUpperCase()}</Tag> : "-",
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date: Date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/question-bank/edit/${record.id}`)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ]

  // Hàm callback được gọi khi tạo câu hỏi thành công trong modal
  const handleCreateSuccess = () => {
    setIsModalOpen(false) // Đóng modal
    router.refresh() // Tải lại danh sách câu hỏi để hiển thị câu hỏi mới
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Question Bank</h1>

      {/* Thanh Filter và Tìm kiếm */}
      <div className="flex justify-between items-center mb-6">
        <Space>
          <Input
            placeholder="Search any questions..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="w-80"
            defaultValue={currentQuery}
            onPressEnter={(e) => handleFilterChange(1, e.currentTarget.value)}
          />
          <Select
            placeholder="All Tags"
            className="w-48"
            // Thêm logic xử lý filter theo tag ở đây nếu cần
          >
            {/* <Select.Option value="security">Security</Select.Option> */}
          </Select>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          // onClick sẽ mở modal
          onClick={() => setIsModalOpen(true)}
        >
          Create a question
        </Button>
      </div>

      {/* Bảng hiển thị dữ liệu */}
      <Table
        columns={columns}
        dataSource={initialQuestions}
        rowKey="id"
        pagination={false} // Tắt phân trang mặc định của Table
        loading={isPending} // Hiển thị loading khi đang chuyển trang/lọc
      />

      {/* Thanh Phân trang tùy chỉnh */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-gray-600">
          {initialQuestions.length} of {totalCount} questions
        </span>
        <Pagination
          current={currentPage}
          total={totalCount}
          pageSize={10} // Nên đồng bộ với limit ở server
          onChange={(page) => handleFilterChange(page, currentQuery)}
          showSizeChanger={false}
        />
      </div>

      {/* Render modal và truyền các props cần thiết */}
      <CreateQuestionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default QuestionBankClient
