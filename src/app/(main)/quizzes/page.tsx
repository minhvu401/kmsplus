"use client"

import { useEffect, useState } from "react"
import { Button, Table, Space, message, Spin, Empty, Input, Popconfirm } from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons"
import Link from "next/link"
import { getAllQuizzes, deleteQuiz } from "@/action/quiz/quizActions"
import CreateQuizModal from "./components/CreateQuizModal"
import EditQuizModal from "./components/EditQuizModal"

interface Quiz {
  id: number
  course_id: number
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  created_at: Date
  updated_at: Date
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null)

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    setLoading(true)
    try {
      const data = await getAllQuizzes({
        query: searchText,
        page: 1,
        limit: 100,
      })
      setQuizzes(data.quizzes || [])
      setFilteredQuizzes(data.quizzes || [])
    } catch (error) {
      console.error("Failed to load quizzes:", error)
      message.error("Không thể tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    const filtered = quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredQuizzes(filtered)
  }

  const handleEdit = (id: number) => {
    setEditingQuizId(id)
    setIsEditModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteQuiz(id)
      message.success("Đã xóa bài thi thành công")
      loadQuizzes()
    } catch (error) {
      console.error("Failed to delete quiz:", error)
      message.error("Không thể xóa bài thi")
    }
  }

  const columns = [
    {
      title: "Tên Bài Thi",
      dataIndex: "title",
      key: "title",
      width: "40%",
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
      width: "30%",
      render: (text: string | null) => (
        <span>{text || "Không có mô tả"}</span>
      ),
    },
    {
      title: "Thời Gian (phút)",
      dataIndex: "time_limit_minutes",
      key: "time_limit_minutes",
      width: "12%",
      render: (text: number | null) => <span>{text || "Unlimited"}</span>,
    },
    {
      title: "Điểm Đạt",
      dataIndex: "passing_score",
      key: "passing_score",
      width: "10%",
      render: (text: number) => <span>{text}%</span>,
    },
    {
      title: "Hành Động",
      key: "action",
      width: "8%",
      align: "center" as const,
      render: (_: any, record: Quiz) => (
        <Space size="middle">
          <Link href={`/quizzes/${record.id}`}>
            <EyeOutlined
              style={{ cursor: 'pointer', color: '#1890ff' }}
              title="Xem chi tiết"
            />
          </Link>
          <EditOutlined
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleEdit(record.id)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa bài thi"
            description="Bạn có chắc chắn muốn xóa bài thi này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <DeleteOutlined
              style={{ cursor: 'pointer', color: '#ff4d4f' }}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Bài Thi</h1>
            <p className="text-gray-600 mt-2">
              Danh sách tất cả các bài thi trong hệ thống
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Tạo Bài Thi Mới
          </Button>
        </div>

        <Input.Search
          placeholder="Tìm kiếm bài thi..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          size="large"
          className="mb-6"
          allowClear
        />
      </div>

      <Spin spinning={loading}>
        {filteredQuizzes.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredQuizzes.map((quiz) => ({
              ...quiz,
              key: quiz.id,
            }))}
            pagination={{
              pageSize: 10,
              total: filteredQuizzes.length,
              showTotal: (total) => `Tổng ${total} bài thi`,
            }}
            bordered
            size="middle"
          />
        ) : (
          <Empty
            description="Không có bài thi nào"
            style={{ marginTop: "60px" }}
          >
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Tạo Bài Thi Đầu Tiên
            </Button>
          </Empty>
        )}
      </Spin>

      {/* Create Quiz Modal */}
      <CreateQuizModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={() => {
          setIsCreateModalVisible(false)
          loadQuizzes()
        }}
      />

      {/* Edit Quiz Modal */}
      <EditQuizModal
        visible={isEditModalVisible}
        quizId={editingQuizId}
        onClose={() => {
          setIsEditModalVisible(false)
          setEditingQuizId(null)
        }}
        onSuccess={() => {
          setIsEditModalVisible(false)
          setEditingQuizId(null)
          loadQuizzes()
        }}
      />
    </div>
  )
}