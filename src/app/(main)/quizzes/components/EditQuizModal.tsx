"use client"

import { useState, useEffect } from "react"
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Tabs,
  Checkbox,
  Empty,
  Tag,
} from "antd"
import { InfoCircleOutlined, UnorderedListOutlined } from "@ant-design/icons"
import {
  getQuizById,
  getQuizQuestions,
  updateQuizQuestions,
} from "@/action/quiz/quizActions"
import { getQuestions } from "@/action/question-bank/questionBankActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface Quiz {
  id: number
  category_id?: number | null
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
}

interface QuizQuestion {
  quiz_question_id: number
  question_id: number
  question_text: string
  type: string
  question_order: number
  explanation: string | null
}

interface QuestionBankItem {
  id: number
  text: string
  type: string
  description?: string
}

interface EditQuizModalProps {
  visible: boolean
  quizId: number | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditQuizModal({
  visible,
  quizId,
  onClose,
  onSuccess,
}: EditQuizModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const { language } = useLanguageStore()

  // Questions state
  const [allQuestions, setAllQuestions] = useState<QuestionBankItem[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])
  const [originalQuestionIds, setOriginalQuestionIds] = useState<number[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (visible && quizId) {
      loadQuizData()
      setActiveTab("info")
      setSearchQuery("")
    }
  }, [visible, quizId])

  const loadQuizData = async () => {
    if (!quizId) return

    setLoading(true)
    setQuestionsLoading(true)
    try {
      // Load quiz info, current questions, and all questions in parallel
      const [quiz, currentQuestions, allQuestionsResponse] = await Promise.all([
        getQuizById(quizId),
        getQuizQuestions(quizId),
        getQuestions(1, 1000),
      ])

      if (quiz) {
        form.setFieldsValue({
          title: quiz.title,
          description: quiz.description || "",
          time_limit_minutes: quiz.time_limit_minutes,
          passing_score: quiz.passing_score,
          max_attempts: quiz.max_attempts,
        })
      }

      // Set current question IDs - Convert to numbers
      const currentIds = (currentQuestions as QuizQuestion[]).map((q) =>
        Number(q.question_id)
      )
      setSelectedQuestionIds(currentIds)
      setOriginalQuestionIds(currentIds)

      // Set all questions from bank
      if (allQuestionsResponse && allQuestionsResponse.data) {
        const questions = allQuestionsResponse.data.map((q: any) => ({
          id: Number(q.id),
          text: q.question_text,
          type: q.type,
          description: q.explanation || "",
        }))
        setAllQuestions(questions)
      }
    } catch (error) {
      console.error("Failed to load quiz:", error)
      message.error("Không thể tải thông tin bài thi")
    } finally {
      setLoading(false)
      setQuestionsLoading(false)
    }
  }

  const handleQuestionToggle = (questionId: number) => {
    setSelectedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId)
      }
      return [...prev, questionId]
    })
  }

  const hasQuestionsChanged = () => {
    if (selectedQuestionIds.length !== originalQuestionIds.length) return true
    const sortedSelected = [...selectedQuestionIds].sort()
    const sortedOriginal = [...originalQuestionIds].sort()
    return !sortedSelected.every((id, idx) => id === sortedOriginal[idx])
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      // 1. Update quiz info
      const formData = new FormData()
      formData.append("id", String(quizId))
      formData.append("title", values.title)
      formData.append("description", values.description || "")
      if (values.time_limit_minutes) {
        formData.append("time_limit_minutes", String(values.time_limit_minutes))
      }
      formData.append("passing_score", String(values.passing_score))
      formData.append("max_attempts", String(values.max_attempts))

      const response = await fetch("/api/quizzes/update", {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update quiz")
      }

      // 2. Update questions if changed
      if (hasQuestionsChanged() && quizId) {
        await updateQuizQuestions(quizId, selectedQuestionIds)
      }

      message.success("Cập nhật bài thi thành công!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Failed to update quiz:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      message.error(`Lỗi: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredQuestions = allQuestions.filter(
    (q) =>
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description &&
        q.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Sort: selected questions first
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const aSelected = selectedQuestionIds.includes(a.id)
    const bSelected = selectedQuestionIds.includes(b.id)
    if (aSelected && !bSelected) return -1
    if (!aSelected && bSelected) return 1
    return 0
  })

  const tabItems = [
    {
      key: "info",
      label: (
        <span>
          <InfoCircleOutlined />
          Thông Tin Cơ Bản
        </span>
      ),
      children: (
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="Tên Bài Thi"
            rules={[
              {
                required: true,
                message: t("quiz.edit_form_title_required", language),
              },
              { min: 10, message: t("quiz.edit_form_title_min", language) },
              { max: 255, message: t("quiz.edit_form_title_max", language) },
            ]}
          >
            <Input placeholder="Nhập tên bài thi" maxLength={255} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô Tả"
            rules={[
              { max: 1000, message: t("quiz.edit_form_desc_max", language) },
            ]}
          >
            <Input.TextArea
              placeholder="Nhập mô tả bài thi"
              rows={3}
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="time_limit_minutes"
              label="Thời Gian (phút)"
              rules={[
                {
                  type: "number",
                  min: 0,
                  max: 1440,
                  message: t("quiz.edit_form_time_range", language),
                  transform: (value) => (value ? Number(value) : undefined),
                },
              ]}
            >
              <Input type="number" placeholder="VD: 45" min={0} max={1440} />
            </Form.Item>

            <Form.Item
              name="passing_score"
              label="Điểm Đạt (%)"
              rules={[
                {
                  required: true,
                  message: t("quiz.edit_form_pass_score_required", language),
                },
                {
                  type: "number",
                  min: 1,
                  max: 100,
                  message: t("quiz.edit_form_pass_score_range", language),
                  transform: (value) => (value ? Number(value) : undefined),
                },
              ]}
            >
              <Input type="number" placeholder="VD: 80" min={1} max={100} />
            </Form.Item>
          </div>

          <Form.Item name="max_attempts" label="Số Lần Làm Tối Đa">
            <Select
              placeholder="Chọn số lần được phép làm bài"
              options={[
                { label: "1 lần", value: 1 },
                { label: "2 lần", value: 2 },
                { label: "3 lần", value: 3 },
                { label: "5 lần", value: 5 },
                { label: t("quiz.edit_form_unlimited", language), value: 999 },
              ]}
            />
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "questions",
      label: (
        <span>
          <UnorderedListOutlined />
          Câu Hỏi ({selectedQuestionIds.length})
        </span>
      ),
      children: (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">
              Đã chọn {selectedQuestionIds.length} / {allQuestions.length} câu
              hỏi
              {hasQuestionsChanged() && (
                <Tag color="orange" className="ml-2">
                  Đã thay đổi
                </Tag>
              )}
            </span>
          </div>

          <Input.Search
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
            allowClear
          />

          <Spin spinning={questionsLoading}>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {sortedQuestions.map((question) => {
                const isSelected = selectedQuestionIds.includes(question.id)
                return (
                  <div
                    key={question.id}
                    onClick={() => handleQuestionToggle(question.id)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleQuestionToggle(question.id)}
                      />
                      <div className="flex-1">
                        <p
                          className={`font-medium ${isSelected ? "text-blue-700" : ""}`}
                        >
                          {question.text}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Tag
                            color={
                              question.type === "single_choice"
                                ? "blue"
                                : "green"
                            }
                          >
                            {question.type === "single_choice"
                              ? "Một đáp án"
                              : "Nhiều đáp án"}
                          </Tag>
                          {isSelected && <Tag color="blue">Đã chọn</Tag>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {sortedQuestions.length === 0 && !questionsLoading && (
                <Empty description="Không tìm thấy câu hỏi phù hợp" />
              )}
            </div>
          </Spin>
        </div>
      ),
    },
  ]

  return (
    <Modal
      title="Chỉnh Sửa Bài Thi"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          Lưu Thay Đổi
        </Button>,
      ]}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Spin>
    </Modal>
  )
}
