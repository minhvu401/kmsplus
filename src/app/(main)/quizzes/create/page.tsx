"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Spin, message, Input, Form, Select, Modal, Checkbox } from "antd"
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import useUserStore from "@/store/useUserStore"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"

const steps = [
  "Thông Tin Cơ Bản",
  "Cấu Hình Quiz",
  "Thêm Câu Hỏi",
  "Xem Lại & Công Bố",
]

interface QuizPayload {
  course_id: number
  title: string
  description: string
  status: string
  time_limit_minutes?: number
  passing_score?: number
  max_attempts?: number
  questions?: Question[]
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

/**
 * Create Quiz Page with Multi-Step Form
 * 
 * User Stories Implementation:
 * [US-01] Basic Metadata: Nhập Tên bài thi (Title), Mô tả (Description)
 * [US-02] Set Duration: Cài đặt thời gian làm bài (phút)
 * [US-03] Pass Criteria: Cài đặt Passing Score (Điểm đạt)
 * [US-04] Max Attempts: Cài đặt số lần được phép làm lại bài thi
 * [US-06] Add from Bank: Mở popup Question Bank, chọn nhiều câu hỏi để add
 * 
 * Acceptance Criteria:
 * AC1: Trường Title là bắt buộc (Required)
 * AC2: Trường Description là tùy chọn (Optional)
 * AC1 (Add from Bank): Click nút "Add" mở Modal chứa danh sách câu hỏi
 * AC2 (Add from Bank): Cho phép check nhiều câu hỏi và bấm nút xác nhận để thêm
 */
export default function CreateQuizPage() {
  const router = useRouter()
  const { user } = useUserStore()

  const [form] = Form.useForm()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  // Track validation status of each step
  const [stepValid, setStepValid] = useState<boolean[]>(
    new Array(steps.length).fill(false)
  )

  // Errors for current step
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
  })

  // Modal state for adding questions
  const [modalState, setModalState] = useState<AddQuestionsModalState>({
    visible: false,
    loading: false,
    questions: [],
    selectedQuestionIds: [],
  })

  // ============================================
  // VALIDATION LOGIC
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
    return true
  }

  const validateStep3 = (): boolean => {
    // Require at least one question
    if (!payload.questions || payload.questions.length === 0) {
      message.error("Vui lòng thêm ít nhất một câu hỏi")
      return false
    }
    return true
  }

  const validateStep4 = (): boolean => {
    return true
  }

  const validateCurrentStep = (): boolean => {
    switch (current) {
      case 0:
        return validateStep1()
      case 1:
        return validateStep2()
      case 2:
        return validateStep3()
      case 3:
        return validateStep4()
      default:
        return false
    }
  }

  // ============================================
  // INPUT HANDLERS (Step 1)
  // ============================================

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPayload((prev) => ({
      ...prev,
      title: value,
    }))

    if (errors.title) {
      validateStep1()
    }
  }

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setPayload((prev) => ({
      ...prev,
      description: value,
    }))

    if (errors.description) {
      validateStep1()
    }
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value === "") {
      setPayload((prev) => ({
        ...prev,
        time_limit_minutes: 45,
      }))
    } else {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1440) {
        setPayload((prev) => ({
          ...prev,
          time_limit_minutes: numValue,
        }))
      }
    }

    if (errors.time_limit_minutes) {
      validateStep1()
    }
  }

  const handlePassingScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value === "") {
      setPayload((prev) => ({
        ...prev,
        passing_score: 80,
      }))
    } else {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
        setPayload((prev) => ({
          ...prev,
          passing_score: numValue,
        }))
      }
    }

    if (errors.passing_score) {
      validateStep1()
    }
  }

  const handleMaxAttemptsChange = (value: number | null) => {
    setPayload((prev) => ({
      ...prev,
      max_attempts: value === null ? undefined : value,
    }))

    if (errors.max_attempts) {
      validateStep1()
    }
  }

  const handleBlur = () => {
    validateCurrentStep()
  }

  // ============================================
  // MODAL HANDLERS (Step 3 - Add Questions)
  // ============================================

  // Thêm state search
  const [searchQuery, setSearchQuery] = useState("")

  /**
   * Handle mở modal thêm câu hỏi
   * - Gọi API lấy danh sách câu hỏi
   * - Cho phép select/deselect tự do
   * - Hỗ trợ search
   */
  const handleOpenAddQuestionsModal = async () => {
    setModalState((prev) => ({
      ...prev,
      visible: true,
      loading: true,
      selectedQuestionIds: [],
    }))
    try {
      // Import từ action/question-bank/questionBankActions
      const { getQuestions } = await import("@/action/question-bank/questionBankActions")

      // Gọi action để lấy danh sách câu hỏi
      const response = await getQuestions(1, 1000) // Lấy 1000 câu hỏi đầu tiên

      if (response && response.data && response.data.length > 0) {
        // Transform data từ QuestionType sang Question interface
        const questions = response.data.map((q: any) => ({
          id: Number(q.id),
          text: q.question_text,
          description: q.explanation || "",
          type: q.type,
          created_at: q.created_at,
        }))

        setModalState((prev) => ({
          ...prev,
          questions: questions,
          loading: false,
        }))
      } else {
        message.warning("Không có câu hỏi nào trong kho dữ liệu")
        setModalState((prev) => ({
          ...prev,
          loading: false,
        }))
      }
    } catch (error) {
      console.error("Failed to load questions:", error)
      message.error("Không thể tải danh sách câu hỏi")
      setModalState((prev) => ({
        ...prev,
        loading: false,
      }))
    }

  }
  /**
 * Filter câu hỏi theo search query
 */
  const filteredQuestions = modalState.questions.filter((question) =>
    question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (question.description && question.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  /**
   * Đóng modal thêm câu hỏi
   */
  const handleCloseAddQuestionsModal = () => {
    setModalState((prev) => ({
      ...prev,
      visible: false,
      selectedQuestionIds: [],
    }))
  }

  /**
 * Xử lý chọn/bỏ chọn câu hỏi
 * - AC2: Cho phép check nhiều câu hỏi
 * - Fix: Cho phép deselect bằng cách click lại
 */
  const handleQuestionSelect = (questionId: number) => {
    setModalState((prev) => {
      const isCurrentlySelected = prev.selectedQuestionIds.includes(questionId)

      return {
        ...prev,
        selectedQuestionIds: isCurrentlySelected
          ? prev.selectedQuestionIds.filter((id) => id !== questionId) // Deselect
          : [...prev.selectedQuestionIds, questionId], // Select
      }
    })
  }

  /**
   * [US-06] Scenario 1: Bấm "Add Selected" thêm câu hỏi vào bài thi
   * [US-06] Scenario 2: Tránh trùng lặp - câu đã chọn sẽ bị disable
   */
  const handleAddSelectedQuestions = () => {
    const newQuestions = modalState.questions.filter((q) =>
      modalState.selectedQuestionIds.includes(q.id)
    )

    setPayload((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), ...newQuestions],
    }))

    message.success(`Đã thêm ${newQuestions.length} câu hỏi`)
    handleCloseAddQuestionsModal()
  }

  /**
   * Xóa câu hỏi khỏi bài thi
   */
  const handleRemoveQuestion = (questionId: number) => {
    setPayload((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((q) => q.id !== questionId),
    }))
    message.success("Đã xóa câu hỏi")
  }

  // ============================================
  // STEP NAVIGATION
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
    }
  }

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    if (!stepValid.every((v) => v)) {
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
      // Add question IDs
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
        throw new Error(errorData.message || "Failed to create quiz")
      }

      message.success("Tạo bài thi thành công!")
      router.push("/quizzes")
    } catch (error) {
      console.error(error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      message.error(`Lỗi khi tạo bài thi: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tạo Bài Thi Mới</h1>
        <p className="text-gray-600">
          Bước {current + 1} / {steps.length}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={index} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (index < current) {
                    setCurrent(index)
                    setErrors({})
                  }
                }}
                disabled={index > current}
                className="w-full"
              >
                <div
                  className={`flex flex-col items-center gap-2 ${index > current ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${index === current
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : stepValid[index]
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                      }`}
                  >
                    {stepValid[index] ? <CheckCircleOutlined /> : index + 1}
                  </div>
                  <p className="text-xs text-center text-gray-600 font-medium">
                    {step}
                  </p>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`h-1 mt-3 rounded transition-colors ${stepValid[index] ? "bg-green-500" : "bg-gray-300"
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Spin spinning={loading}>
        <div className="bg-white p-8 rounded shadow-lg">
          {/* STEP 1: Thông Tin Cơ Bản */}
          {current === 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Thông Tin Cơ Bản Bài Thi
              </h2>

              <Form form={form} layout="vertical" className="space-y-6">
                <Form.Item
                  label={
                    <span>
                      Tên Bài Thi{" "}
                      <span className="text-red-500 font-bold">*</span>
                    </span>
                  }
                  validateStatus={errors.title ? "error" : ""}
                  help={errors.title}
                >
                  <Input
                    placeholder="VD: Kiểm tra kiến thức Product"
                    value={payload.title}
                    onChange={handleTitleChange}
                    onBlur={handleBlur}
                    maxLength={255}
                    showCount
                    size="large"
                    status={errors.title ? "error" : ""}
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
                    onBlur={handleBlur}
                    maxLength={1000}
                    showCount
                    rows={5}
                    status={errors.description ? "error" : ""}
                  />
                </Form.Item>

                <Form.Item
                  label="Thời Gian Làm Bài (phút)"
                  validateStatus={errors.time_limit_minutes ? "error" : ""}
                  help={errors.time_limit_minutes}
                >
                  <div className="flex gap-3 items-center">
                    <Input
                      type="number"
                      placeholder="VD: 45"
                      value={payload.time_limit_minutes ?? ""}
                      onChange={handleDurationChange}
                      onBlur={handleBlur}
                      min={0}
                      max={1440}
                      size="large"
                      status={errors.time_limit_minutes ? "error" : ""}
                      style={{ flex: 1 }}
                    />
                    {payload.time_limit_minutes === 0 ||
                      payload.time_limit_minutes === undefined ? (
                      <span className="text-green-600 font-medium whitespace-nowrap text-sm bg-green-50 px-3 py-2 rounded">
                        🔓 Unlimited
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium whitespace-nowrap text-sm bg-blue-50 px-3 py-2 rounded">
                        ⏱️ {payload.time_limit_minutes} phút
                      </span>
                    )}
                  </div>
                </Form.Item>

                <Form.Item
                  label="Điểm Đạt (Passing Score)"
                  validateStatus={errors.passing_score ? "error" : ""}
                  help={errors.passing_score}
                >
                  <div className="flex gap-3 items-center">
                    <Input
                      type="number"
                      placeholder="VD: 50"
                      value={payload.passing_score || ""}
                      onChange={handlePassingScoreChange}
                      onBlur={handleBlur}
                      min={1}
                      max={100}
                      size="large"
                      status={errors.passing_score ? "error" : ""}
                      style={{ flex: 1 }}
                    />
                    <span className="text-blue-600 font-medium whitespace-nowrap text-sm bg-blue-50 px-3 py-2 rounded">
                      📊 {payload.passing_score || 80}%
                    </span>
                  </div>
                </Form.Item>

                <Form.Item
                  label="Số Lần Làm Bài (Max Attempts)"
                  validateStatus={errors.max_attempts ? "error" : ""}
                  help={errors.max_attempts}
                >
                  <Select
                    placeholder="Chọn số lần được phép làm bài"
                    value={payload.max_attempts}
                    onChange={handleMaxAttemptsChange}
                    size="large"
                    options={[
                      { label: "1", value: 1 },
                      { label: "2", value: 2 },
                      { label: "3", value: 3 },
                      { label: "Không giới hạn", value: null },
                    ]}
                  />
                </Form.Item>
              </Form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2">
                  {Object.keys(errors).length === 0 ? (
                    <>
                      <CheckCircleOutlined className="text-green-600" />
                      <span className="text-green-600 font-medium">
                        Thông tin hợp lệ. Bạn có thể tiếp tục.
                      </span>
                    </>
                  ) : (
                    <>
                      <ExclamationCircleOutlined className="text-red-600" />
                      <span className="text-red-600 font-medium">
                        Vui lòng kiểm tra lại các lỗi ở trên.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Cấu Hình Quiz */}
          {current === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Cấu Hình Quiz</h2>
              <p className="text-gray-500">
                Tính năng này sẽ được phát triển trong các bước tiếp theo.
              </p>
            </div>
          )}

          {/* STEP 3: Thêm Câu Hỏi */}
          {current === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Thêm Câu Hỏi</h2>

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleOpenAddQuestionsModal}
                className="mb-6"
              >
                Thêm Câu Hỏi Từ Kho
              </Button>

              {/* Danh sách câu hỏi đã chọn */}
              {payload.questions && payload.questions.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-medium">
                    Câu hỏi đã chọn ({payload.questions.length}):
                  </p>
                  {payload.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {index + 1}. {question.text}
                        </p>
                        {question.description && (
                          <p className="text-sm text-gray-600">
                            {question.description}
                          </p>
                        )}
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
              ) : (
                <div className="p-6 text-center bg-gray-50 rounded border border-gray-200">
                  <p className="text-gray-500">
                    Chưa có câu hỏi nào. Bấm nút "Thêm Câu Hỏi Từ Kho" để bắt
                    đầu.
                  </p>
                </div>
              )}

              {/* Add Questions Modal */}
              <Modal
                title="Thêm Câu Hỏi Từ Kho Dữ Liệu"
                open={modalState.visible}
                onCancel={handleCloseAddQuestionsModal}
                width={900}
                footer={[
                  <Button
                    key="cancel"
                    onClick={handleCloseAddQuestionsModal}
                  >
                    Hủy
                  </Button>,
                  <Button
                    key="submit"
                    type="primary"
                    loading={modalState.loading}
                    onClick={handleAddSelectedQuestions}
                    disabled={modalState.selectedQuestionIds.length === 0}
                  >
                    Thêm{" "}
                    {modalState.selectedQuestionIds.length > 0 &&
                      `(${modalState.selectedQuestionIds.length})`}
                  </Button>,
                ]}
              >
                <Spin spinning={modalState.loading}>
                  <div className="space-y-4">
                    {/* Search Input */}
                    <Input
                      placeholder="Tìm kiếm câu hỏi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="large"
                      allowClear
                    />
                    {/* Question List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-4 bg-gray-50">
                      {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((question) => {
                          const isSelected = modalState.selectedQuestionIds.includes(
                            question.id
                          )

                          return (
                            <div
                              key={question.id}
                              onClick={() => handleQuestionSelect(question.id)}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected
                                ? "bg-blue-100 border-blue-400 shadow-sm"
                                : "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300"
                                }`}
                            >
                              <div className="flex gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => handleQuestionSelect(question.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 break-words line-clamp-2">
                                    {question.text}
                                  </p>
                                  {question.description && (
                                    <p className="text-sm text-gray-600 mt-1 break-words line-clamp-2">
                                      {question.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    Type: {question.type}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-6 text-center bg-white rounded border border-gray-200">
                          <p className="text-gray-500">
                            {searchQuery
                              ? `Không tìm thấy câu hỏi nào khớp với "${searchQuery}"`
                              : "Không có câu hỏi nào"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Spin>
              </Modal>
            </div>
          )}

          {/* STEP 4: Xem Lại & Công Bố */}
          {current === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Xem Lại & Công Bố</h2>
              <div className="space-y-4 bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600">Tên bài thi:</p>
                  <p className="text-lg font-semibold">{payload.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mô tả:</p>
                  <p className="text-lg">
                    {payload.description || "(Không có)"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Thời gian làm bài:</p>
                  <p className="text-lg">
                    {payload.time_limit_minutes === 0 ||
                      payload.time_limit_minutes === undefined
                      ? "Không giới hạn"
                      : `${payload.time_limit_minutes} phút`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Điểm đạt:</p>
                  <p className="text-lg">{payload.passing_score || 80}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số lần làm bài:</p>
                  <p className="text-lg">
                    {payload.max_attempts === undefined
                      ? "Không giới hạn"
                      : `${payload.max_attempts} lần`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số câu hỏi:</p>
                  <p className="text-lg">
                    {payload.questions?.length || 0} câu
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái:</p>
                  <p className="text-lg font-semibold capitalize">
                    {payload.status === "draft" ? "Nháp" : payload.status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Spin >

      {/* Navigation Buttons */}
      < div className="mt-8 flex items-center justify-between gap-4" >
        <Button
          onClick={handlePrev}
          disabled={current === 0}
          icon={<ArrowLeftOutlined />}
          size="large"
        >
          Quay Lại
        </Button>

        <div className="flex gap-4">
          {current < steps.length - 1 ? (
            <Button
              type="primary"
              onClick={handleNext}
              icon={<ArrowRightOutlined />}
              size="large"
              disabled={Object.keys(errors).length > 0}
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
                !stepValid.every((v) => v) || Object.keys(errors).length > 0
              }
              size="large"
            >
              Tạo Bài Thi
            </Button>
          )}
        </div>
      </div >
    </div >
  )
}