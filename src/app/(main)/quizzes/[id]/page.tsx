"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Button,
  Card,
  Descriptions,
  Spin,
  message,
  Tag,
  Empty,
  Table,
  Divider,
} from "antd"
import {
  ArrowLeftOutlined,
  EditOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons"
import { getQuizById, getQuizQuestions } from "@/action/quiz/quizActions"
import EditQuizModal from "../components/EditQuizModal"

interface Quiz {
  id: number
  course_id: number
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  available_from: Date | null
  available_until: Date | null
  created_at: Date
  updated_at: Date
}

interface QuizQuestion {
  quiz_question_id: number
  question_id: number
  question_text: string
  type: string
  question_order: number
  explanation: string | null
}

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = Number(params.id)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)

  useEffect(() => {
    loadQuizDetail()
  }, [quizId])

  const loadQuizDetail = async () => {
    if (!quizId) return

    setLoading(true)
    try {
      const [quizData, questionsData] = await Promise.all([
        getQuizById(quizId),
        getQuizQuestions(quizId),
      ])

      if (quizData) {
        setQuiz(quizData)
        setQuestions(questionsData as QuizQuestion[])
      } else {
        message.error("Không tìm thấy bài thi")
      }
    } catch (error) {
      console.error("Failed to load quiz:", error)
      message.error("Không thể tải thông tin bài thi")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Không xác định"
    return new Date(date).toLocaleString("vi-VN")
  }

  const questionColumns = [
    {
      title: "STT",
      dataIndex: "question_order",
      key: "question_order",
      width: "8%",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Câu Hỏi",
      dataIndex: "question_text",
      key: "question_text",
      width: "55%",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: "15%",
      render: (type: string) => (
        <Tag color={type === "single_choice" ? "blue" : "green"}>
          {type === "single_choice" ? "Một đáp án" : "Nhiều đáp án"}
        </Tag>
      ),
    },
    {
      title: "Giải thích",
      dataIndex: "explanation",
      key: "explanation",
      width: "22%",
      render: (text: string | null) => (
        <span className="text-gray-500 text-sm">{text || "Không có"}</span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang tải...">
          <div className="p-12" />
        </Spin>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-6">
        <Empty description="Không tìm thấy bài thi">
          <Button type="primary" onClick={() => router.push("/quizzes")}>
            Quay lại danh sách
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/quizzes")}
        className="mb-6"
      >
        Quay lại
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600 mt-2">Chi tiết bài thi</p>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setIsEditModalVisible(true)}
        >
          Chỉnh sửa
        </Button>
      </div>

      {/* Quiz Info Card */}
      <Card className="mb-6">
        <Descriptions
          title="Thông Tin Bài Thi"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
        >
          <Descriptions.Item label="Tên bài thi" span={3}>
            {quiz.title}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={3}>
            {quiz.description || "Không có mô tả"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                <ClockCircleOutlined className="mr-1" />
                Thời gian làm bài
              </span>
            }
          >
            {quiz.time_limit_minutes
              ? `${quiz.time_limit_minutes} phút`
              : "Không giới hạn"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                <TrophyOutlined className="mr-1" />
                Điểm đạt
              </span>
            }
          >
            {quiz.passing_score}%
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                <ReloadOutlined className="mr-1" />
                Số lần làm tối đa
              </span>
            }
          >
            {quiz.max_attempts === 999 ? "Không giới hạn" : quiz.max_attempts}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatDate(quiz.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {formatDate(quiz.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Questions Card */}
      <Card
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Danh Sách Câu Hỏi ({questions.length} câu)
          </span>
        }
      >
        {questions.length > 0 ? (
          <Table
            columns={questionColumns}
            dataSource={questions.map((q, index) => ({
              ...q,
              key: q.quiz_question_id || index,
            }))}
            pagination={questions.length > 10 ? { pageSize: 10 } : false}
            size="small"
          />
        ) : (
          <Empty description="Chưa có câu hỏi nào được liên kết với bài thi này" />
        )}
      </Card>

      {/* Edit Quiz Modal */}
      <EditQuizModal
        visible={isEditModalVisible}
        quizId={quiz.id}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          setIsEditModalVisible(false)
          loadQuizDetail()
        }}
      />
    </div>
  )
}
