"use client"

import { useState, useEffect } from "react"
import {
  Button,
  Spin,
  message,
  Input,
  Form,
  Select,
  Modal,
  Checkbox,
  Steps,
} from "antd"
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  WarningOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import useUserStore from "@/store/useUserStore"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"
import { getQuestions } from "@/action/question-bank/questionBankActions"
import { getAllDepartments } from "@/action/department/departmentActions"

// Constants
const TOTAL_QUIZ_POINTS = 100

const steps = ["Thông Tin Cơ Bản", "Thêm Câu Hỏi", "Xem Lại & Công Bố"]

interface QuizPayload {
  course_id: number
  title: string
  description: string
  status: string
  time_limit_minutes?: number
  passing_score?: number
  max_attempts?: number
  questions?: Question[]
  targetType?: "PUBLIC" | "DEPARTMENTS"
  targetDeptIds?: number[]
}

interface StepErrors {
  [key: string]: string
}

interface Question {
  id: number
  text: string
  description?: string
  type: string
  created_at?: string
}

interface AddQuestionsModalState {
  visible: boolean
  loading: boolean
  questions: Question[]
  selectedQuestionIds: number[]
}

interface CreateQuizModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateQuizModal({
  visible,
  onClose,
  onSuccess,
}: CreateQuizModalProps) {
  const { user } = useUserStore()

  const [form] = Form.useForm()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  const [stepValid, setStepValid] = useState<boolean[]>(
    new Array(steps.length).fill(false)
  )

  const [errors, setErrors] = useState<StepErrors>({})

  const [payload, setPayload] = useState<QuizPayload>({
    course_id: 1,
    title: "",
    description: "",
    status: "draft",
    time_limit_minutes: undefined,
    passing_score: 80,
    max_attempts: 3,
    questions: [],
    targetType: "PUBLIC",
    targetDeptIds: [],
  })

  const [modalState, setModalState] = useState<AddQuestionsModalState>({
    visible: false,
    loading: false,
    questions: [],
    selectedQuestionIds: [],
  })

  const [departments, setDepartments] = useState<
    Array<{ id: number; name: string }>
  >([])
  const [searchQuery, setSearchQuery] = useState("")

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrent(0)
      setStepValid(new Array(steps.length).fill(false))
      setErrors({})
      setPayload({
        course_id: 1,
        title: "",
        description: "",
        status: "draft",
        time_limit_minutes: undefined,
        passing_score: 80,
        max_attempts: 3,
        questions: [],
        targetType: "PUBLIC",
        targetDeptIds: [],
      })
    }
  }, [visible])

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deptData = await getAllDepartments()
        setDepartments(deptData)
      } catch (error) {
        console.error("Failed to load departments:", error)
      }
    }
    loadDepartments()
  }, [])

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep1 = (): boolean => {
    const newErrors: StepErrors = {}

    if (!payload.title || !payload.title.trim()) {
      newErrors.title = "Vui lòng nhập tên bài thi"
    } else if (payload.title.length < 10) {
      newErrors.title = "Tên bài thi không được ít hơn 10 ký tự"
    } else if (payload.title.length > 255) {
      newErrors.title = "Tên bài thi không vượt quá 255 ký tự"
    }

    if (payload.description && payload.description.length > 1000) {
      newErrors.description = "Mô tả không vượt quá 1000 ký tự"
    }

    if (
      payload.time_limit_minutes !== undefined &&
      (payload.time_limit_minutes < 0 || payload.time_limit_minutes > 1440)
    ) {
      newErrors.time_limit_minutes = "Thời gian làm bài phải từ 0 đến 1440 phút"
    }

    if (
      payload.passing_score !== undefined &&
      (payload.passing_score <= 0 || payload.passing_score > 100)
    ) {
      newErrors.passing_score = "Điểm đạt phải từ 1 đến 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    if (!payload.questions || payload.questions.length === 0) {
      message.error("Vui lòng thêm ít nhất 10 câu hỏi")
      return false
    }

    if (payload.questions.length < 10) {
      message.error(
        `Bạn cần thêm ít nhất 10 câu hỏi (hiện tại: ${payload.questions.length} câu)`
      )
      return false
    }

    return true
  }

  const validateCurrentStep = (): boolean => {
    switch (current) {
      case 0:
        return validateStep1()
      case 1:
        return validateStep2()
      case 2:
        return true
      default:
        return false
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayload((prev) => ({ ...prev, title: e.target.value }))
    if (errors.title) validateStep1()
  }

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPayload((prev) => ({ ...prev, description: e.target.value }))
    if (errors.description) validateStep1()
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setPayload((prev) => ({ ...prev, time_limit_minutes: 45 }))
    } else {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1440) {
        setPayload((prev) => ({ ...prev, time_limit_minutes: numValue }))
      }
    }
  }

  const handlePassingScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setPayload((prev) => ({ ...prev, passing_score: 80 }))
    } else {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
        setPayload((prev) => ({ ...prev, passing_score: numValue }))
      }
    }
  }

  const handleMaxAttemptsChange = (value: number | null) => {
    setPayload((prev) => ({
      ...prev,
      max_attempts: value === null ? undefined : value,
    }))
  }

  // ============================================
  // QUESTION MODAL
  // ============================================

  const handleOpenAddQuestionsModal = async () => {
    const existingQuestionIds = (payload.questions || []).map((q) => q.id)

    setModalState((prev) => ({
      ...prev,
      visible: true,
      loading: true,
      selectedQuestionIds: existingQuestionIds,
    }))

    try {
      const response = await getQuestions(1, 1000)

      if (response && response.data && response.data.length > 0) {
        const questions = response.data.map((q: any) => ({
          id: Number(q.id),
          text: q.question_text,
          description: q.explanation || "",
          type: q.type,
          created_at: q.created_at,
        }))

        setModalState((prev) => ({ ...prev, questions, loading: false }))
      } else {
        message.warning("Không có câu hỏi nào trong kho dữ liệu")
        setModalState((prev) => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error("Failed to load questions:", error)
      message.error("Không thể tải danh sách câu hỏi")
      setModalState((prev) => ({ ...prev, loading: false }))
    }
  }

  const filteredQuestions = modalState.questions.filter(
    (question) =>
      question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.description &&
        question.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCloseAddQuestionsModal = () => {
    setModalState((prev) => ({
      ...prev,
      visible: false,
      selectedQuestionIds: [],
    }))
  }

  const handleQuestionSelect = (questionId: number) => {
    setModalState((prev) => {
      const isSelected = prev.selectedQuestionIds.includes(questionId)
      return {
        ...prev,
        selectedQuestionIds: isSelected
          ? prev.selectedQuestionIds.filter((id) => id !== questionId)
          : [...prev.selectedQuestionIds, questionId],
      }
    })
  }

  const handleAddSelectedQuestions = () => {
    const selectedQuestions = modalState.questions.filter((q) =>
      modalState.selectedQuestionIds.includes(q.id)
    )
    setPayload((prev) => ({ ...prev, questions: selectedQuestions }))
    message.success(`Cập nhật ${selectedQuestions.length} câu hỏi`)
    handleCloseAddQuestionsModal()
  }

  const handleRemoveQuestion = (questionId: number) => {
    setPayload((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((q) => q.id !== questionId),
    }))
    message.success("Đã xóa câu hỏi")
  }

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = () => {
    const isValid = validateCurrentStep()
    if (!isValid) {
      message.error("Vui lòng hoàn thành các trường bắt buộc")
      return
    }

    setStepValid((prev) => {
      const newValid = [...prev]
      newValid[current] = true
      return newValid
    })

    if (current < steps.length - 1) {
      setCurrent(current + 1)
      setErrors({})
    }
  }

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    if (!stepValid[0] || !stepValid[1]) {
      message.error("Vui lòng hoàn thành tất cả các bước")
      return
    }

    if (!user?.id) {
      message.error("User ID not found")
      return
    }

    if (!payload.course_id) {
      message.error("Course ID is required")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("course_id", String(payload.course_id))
      formData.append("title", payload.title)
      formData.append("description", payload.description)
      formData.append("status", payload.status)
      if (payload.time_limit_minutes !== undefined) {
        formData.append(
          "time_limit_minutes",
          String(payload.time_limit_minutes)
        )
      }
      formData.append("passing_score", String(payload.passing_score || 80))
      if (payload.max_attempts !== undefined) {
        formData.append("max_attempts", String(payload.max_attempts))
      }
      if (payload.questions && payload.questions.length > 0) {
        formData.append(
          "question_ids",
          JSON.stringify(payload.questions.map((q) => q.id))
        )
      }

      const response = await fetch("/api/quizzes/create", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create quiz")
      }

      message.success("Tạo bài thi thành công!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      message.error(`Lỗi khi tạo bài thi: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const pointsPerQuestion = payload.questions?.length
    ? TOTAL_QUIZ_POINTS / payload.questions.length
    : 0

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Tạo Bài Thi Mới</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnHidden
      maskClosable={false}
    >
      <div className="py-4">
        {/* Steps indicator */}
        <Steps
          current={current}
          items={steps.map((title, index) => ({
            title,
            status: stepValid[index]
              ? "finish"
              : index === current
                ? "process"
                : "wait",
          }))}
          className="mb-6"
        />

        <Spin spinning={loading}>
          <div className="min-h-[400px] max-h-[60vh] overflow-y-auto px-2">
            {/* STEP 1: Thông Tin Cơ Bản */}
            {current === 0 && (
              <Form form={form} layout="vertical" className="space-y-4">
                <Form.Item
                  label={
                    <span>
                      Tên Bài Thi <span className="text-red-500">*</span>
                    </span>
                  }
                  validateStatus={errors.title ? "error" : ""}
                  help={errors.title}
                >
                  <Input
                    placeholder="VD: Kiểm tra kiến thức Product"
                    value={payload.title}
                    onChange={handleTitleChange}
                    maxLength={255}
                    showCount
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="Mô Tả (Tùy Chọn)"
                  validateStatus={errors.description ? "error" : ""}
                  help={errors.description}
                >
                  <Input.TextArea
                    placeholder="VD: Dành cho nhân viên mới bắt đầu học về sản phẩm"
                    value={payload.description}
                    onChange={handleDescriptionChange}
                    rows={3}
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    label="Thời Gian Làm Bài (phút)"
                    validateStatus={errors.time_limit_minutes ? "error" : ""}
                    help={errors.time_limit_minutes}
                  >
                    <Input
                      type="number"
                      placeholder="VD: 45"
                      value={payload.time_limit_minutes || ""}
                      onChange={handleDurationChange}
                      min={0}
                      max={1440}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Điểm Đạt (%)"
                    validateStatus={errors.passing_score ? "error" : ""}
                    help={errors.passing_score}
                  >
                    <Input
                      type="number"
                      placeholder="VD: 80"
                      value={payload.passing_score || ""}
                      onChange={handlePassingScoreChange}
                      min={1}
                      max={100}
                    />
                  </Form.Item>
                </div>

                <Form.Item label="Số Lần Làm Bài (Max Attempts)">
                  <Select
                    placeholder="Chọn số lần được phép làm bài"
                    value={payload.max_attempts}
                    onChange={handleMaxAttemptsChange}
                    options={[
                      { label: "1", value: 1 },
                      { label: "2", value: 2 },
                      { label: "3", value: 3 },
                      { label: "5", value: 5 },
                      { label: "Không giới hạn", value: 999 },
                    ]}
                  />
                </Form.Item>
              </Form>
            )}

            {/* STEP 2: Thêm Câu Hỏi */}
            {current === 1 && (
              <div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenAddQuestionsModal}
                  className="mb-4"
                >
                  Thêm Câu Hỏi Từ Kho
                </Button>

                {payload.questions && payload.questions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        Câu hỏi đã chọn ({payload.questions.length}):
                      </span>
                      {payload.questions.length < 10 && (
                        <span className="text-red-500 text-sm">
                          ⚠️ Cần thêm ít nhất {10 - payload.questions.length}{" "}
                          câu nữa
                        </span>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {payload.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {index + 1}. {question.text}
                            </p>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveQuestion(question.id)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm">
                        📊 Điểm/câu:{" "}
                        <strong>{pointsPerQuestion.toFixed(2)}</strong> | Tổng
                        điểm: <strong>{TOTAL_QUIZ_POINTS}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded">
                    <p className="text-gray-500">
                      Chưa có câu hỏi nào được chọn
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Nhấn &quot;Thêm Câu Hỏi Từ Kho&quot; để bắt đầu
                    </p>
                  </div>
                )}

                {/* Question Bank Modal */}
                <Modal
                  title="Chọn Câu Hỏi Từ Kho"
                  open={modalState.visible}
                  onCancel={handleCloseAddQuestionsModal}
                  width={800}
                  footer={[
                    <Button key="cancel" onClick={handleCloseAddQuestionsModal}>
                      Hủy
                    </Button>,
                    <Button
                      key="add"
                      type="primary"
                      onClick={handleAddSelectedQuestions}
                      disabled={modalState.selectedQuestionIds.length === 0}
                    >
                      Thêm {modalState.selectedQuestionIds.length} Câu Hỏi
                    </Button>,
                  ]}
                >
                  <Spin spinning={modalState.loading}>
                    <Input.Search
                      placeholder="Tìm kiếm câu hỏi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-4"
                      allowClear
                    />

                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {filteredQuestions.map((question) => (
                        <div
                          key={question.id}
                          onClick={() => handleQuestionSelect(question.id)}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            modalState.selectedQuestionIds.includes(question.id)
                              ? "bg-blue-50 border-blue-400"
                              : "bg-white border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={modalState.selectedQuestionIds.includes(
                                question.id
                              )}
                              onChange={() => handleQuestionSelect(question.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{question.text}</p>
                              {question.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {question.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Spin>
                </Modal>
              </div>
            )}

            {/* STEP 3: Xem Lại */}
            {current === 2 && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-3">Thông Tin Bài Thi</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <strong>Tên:</strong> {payload.title}
                    </p>
                    <p>
                      <strong>Thời gian:</strong>{" "}
                      {payload.time_limit_minutes || "Unlimited"} phút
                    </p>
                    <p>
                      <strong>Điểm đạt:</strong> {payload.passing_score}%
                    </p>
                    <p>
                      <strong>Số lần làm:</strong>{" "}
                      {payload.max_attempts === 999
                        ? "Không giới hạn"
                        : payload.max_attempts}
                    </p>
                  </div>
                  {payload.description && (
                    <p className="mt-2 text-sm">
                      <strong>Mô tả:</strong> {payload.description}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">
                    Câu Hỏi ({payload.questions?.length || 0} câu)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Điểm mỗi câu: {pointsPerQuestion.toFixed(2)} | Tổng điểm:{" "}
                    {TOTAL_QUIZ_POINTS}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-600" />
                    <span className="text-green-700 font-medium">
                      Sẵn sàng tạo bài thi!
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Spin>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            onClick={handlePrev}
            disabled={current === 0}
            icon={<ArrowLeftOutlined />}
          >
            Quay Lại
          </Button>

          <div className="flex gap-2">
            <Button onClick={onClose}>Hủy</Button>
            {current < steps.length - 1 ? (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                disabled={
                  current === 1 ? (payload.questions?.length || 0) < 10 : false
                }
              >
                Tiếp Theo
              </Button>
            ) : (
              <Button
                type="primary"
                danger
                onClick={handleSubmit}
                loading={loading}
                disabled={
                  !stepValid[0] ||
                  !stepValid[1] ||
                  (payload.questions?.length || 0) < 10
                }
              >
                Tạo Bài Thi
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
