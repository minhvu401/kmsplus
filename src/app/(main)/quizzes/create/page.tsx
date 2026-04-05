"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Spin,
  message,
  Input,
  Form,
  Select,
  Modal,
  Checkbox,
  InputNumber,
} from "antd"
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import useUserStore from "@/store/useUserStore"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"

// Constants
const TOTAL_QUIZ_POINTS = 100 // Tổng điểm quiz cố định

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
    targetType: "PUBLIC",
    targetDeptIds: [],
  })

  // Modal state for adding questions
  const [modalState, setModalState] = useState<AddQuestionsModalState>({
    visible: false,
    loading: false,
    questions: [],
    selectedQuestionIds: [],
  })

  // State for departments
  const [departments, setDepartments] = useState<
    Array<{ id: number; name: string }>
  >([])

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

  // ============================================
  // LOAD DEPARTMENTS ON MOUNT
  // ============================================

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { getAllDepartments } =
          await import("@/action/department/departmentActions")
        const deptData = await getAllDepartments()
        setDepartments(deptData)
      } catch (error) {
        console.error("Failed to load departments:", error)
        message.error("Không thể tải danh sách phòng ban")
      }
    }

    loadDepartments()
  }, [])

  const validateStep2 = (): boolean => {
    // Require at least 10 questions
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

  const validateStep3 = (): boolean => {
    // Step 3 là review & publish, không cần validate thêm
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

  const handlePassingScoreChange = (value: number | null) => {
    setPayload((prev) => ({
      ...prev,
      passing_score: value === null ? 80 : value,
    }))

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
    // Get IDs of questions already in the quiz
    const existingQuestionIds = (payload.questions || []).map((q) => q.id)

    setModalState((prev) => ({
      ...prev,
      visible: true,
      loading: true,
      selectedQuestionIds: existingQuestionIds, // Pre-select existing questions
    }))
    try {
      // Import từ action/question-bank/questionBankActions
      const { getQuestions } =
        await import("@/action/question-bank/questionBankActions")

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
  const filteredQuestions = modalState.questions.filter(
    (question) =>
      question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.description &&
        question.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
   * [US-06] Scenario 1: Bấm "Add Selected" cập nhật danh sách câu hỏi
   *
   * Logic:
   * - Những câu được select trong modal → giữ lại trong quiz
   * - Những câu bị deselect trong modal → xóa khỏi quiz
   */
  const handleAddSelectedQuestions = () => {
    // Get the questions that are currently selected in the modal
    const selectedQuestions = modalState.questions.filter((q) =>
      modalState.selectedQuestionIds.includes(q.id)
    )

    // Simply replace payload.questions with selected questions
    setPayload((prev) => ({
      ...prev,
      questions: selectedQuestions,
    }))

    message.success(`Cập nhật ${selectedQuestions.length} câu hỏi`)
    handleCloseAddQuestionsModal()
  }

  // State để tracking drag
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  /**
   * [US-08] Drag & Drop handlers - Enhanced with drop zone highlighting
   */
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer!.effectAllowed = "move"
    e.dataTransfer!.setData("text/html", e.currentTarget.innerHTML)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    // Only clear dragOverIndex if leaving the specific item
    if (dragOverIndex === index) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    setDragOverIndex(null)

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    // Reorder questions
    setPayload((prev) => {
      const newQuestions = [...(prev.questions || [])]
      if (
        draggedIndex < newQuestions.length &&
        dropIndex <= newQuestions.length
      ) {
        const draggedQuestion = newQuestions[draggedIndex]

        // Remove from old position
        newQuestions.splice(draggedIndex, 1)
        // Insert at new position
        newQuestions.splice(dropIndex, 0, draggedQuestion)

        return {
          ...prev,
          questions: newQuestions,
        }
      }
      return prev
    })

    setDraggedIndex(null)
    message.success("Thay đổi thứ tự câu hỏi thành công")
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  /**
   * [US-09] Calculate total score and points per question
   * Business Rule:
   * - TotalScore = 100 (fixed)
   * - PointsPerQuestion = 100 / Count(questions)
   */
  const calculateTotalScore = (): number => {
    return TOTAL_QUIZ_POINTS
  }

  const calculatePointsPerQuestion = (): number => {
    const questionCount = payload.questions?.length || 0
    if (questionCount === 0) return 0
    return TOTAL_QUIZ_POINTS / questionCount
  }

  const totalScore = calculateTotalScore()
  const pointsPerQuestion = calculatePointsPerQuestion()
  const passingScore = payload.passing_score || 80
  const isPassingScoreValid = passingScore <= totalScore

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
      setErrors({}) // Clear errors when moving to next step
    }
  }

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    // Only check step 0 and 1, step 2 is final review step
    if (!stepValid[0] || !stepValid[1]) {
      console.warn("[handleSubmit] Step validation failed:", stepValid)
      message.error("Vui lòng hoàn thành tất cả các bước")
      return
    }

    if (!user?.id) {
      console.warn("[handleSubmit] User not found")
      message.error("User ID not found")
      return
    }

    if (!payload.course_id) {
      console.warn("[handleSubmit] Course ID not found")
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
        console.error("[handleSubmit] API error:", errorData)
        throw new Error(errorData.error || "Failed to create quiz")
      }

      const responseData = await response.json()
      console.log("[handleSubmit] Success:", responseData)
      message.success("Tạo bài thi thành công!")
      router.push("/quizzes")
    } catch (error) {
      console.error("[handleSubmit] Error:", error)
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
                  className={`flex flex-col items-center gap-2 ${
                    index > current ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      index === current
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
                  className={`h-1 mt-3 rounded transition-colors ${
                    stepValid[index] ? "bg-green-500" : "bg-gray-300"
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
                    <InputNumber
                      placeholder="VD: 50"
                      value={payload.passing_score || 80}
                      onChange={handlePassingScoreChange}
                      onBlur={handleBlur}
                      min={1}
                      max={100}
                      size="large"
                      status={errors.passing_score ? "error" : ""}
                      style={{ flex: 1 }}
                      stringMode={false}
                      precision={0}
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
                      { label: "5", value: 5 },
                      { label: "Không giới hạn", value: 999 },
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

          {/* STEP 2: Thêm Câu Hỏi */}
          {current === 1 && (
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
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      Câu hỏi đã chọn ({payload.questions.length}):
                    </p>
                    {payload.questions.length < 10 && (
                      <p className="text-sm text-red-600 font-medium">
                        Cần thêm ít nhất {10 - payload.questions.length} câu nữa
                      </p>
                    )}
                  </div>

                  {/* Total Score Info Bar */}
                  <div
                    className={`p-4 rounded border-l-4 mb-4 ${
                      isPassingScoreValid
                        ? "bg-green-50 border-l-green-500"
                        : "bg-yellow-50 border-l-yellow-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isPassingScoreValid ? (
                        <CheckCircleOutlined className="text-green-600 mt-0.5" />
                      ) : (
                        <WarningOutlined className="text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isPassingScoreValid
                              ? "text-green-900"
                              : "text-yellow-900"
                          }`}
                        >
                          Tổng điểm bài thi:{" "}
                          <span className="text-lg">{totalScore}</span> điểm
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          ({payload.questions.length} câu ×{" "}
                          {pointsPerQuestion.toFixed(2)} điểm/câu)
                        </p>
                        {!isPassingScoreValid && (
                          <p className="text-sm text-yellow-800 mt-2">
                            ⚠️ Điểm đạt ({passingScore}%) vượt quá tổng điểm (
                            {totalScore}). Vui lòng cân đối lại!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {payload.questions.map((question, index) => (
                    <div
                      key={question.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnter={handleDragEnter}
                      onDragLeave={(e) => handleDragLeave(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all cursor-move gap-3 ${
                        draggedIndex === index
                          ? "bg-blue-100 border-blue-500 opacity-60 shadow-md"
                          : dragOverIndex === index
                            ? "bg-blue-100 border-blue-500 shadow-lg ring-2 ring-blue-300"
                            : "bg-white border-gray-300 hover:border-blue-400 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-600 text-lg min-w-fit">
                            {index + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 break-words">
                              {question.text}
                            </p>
                            {question.description && (
                              <p className="text-sm text-gray-600 mt-1 break-words">
                                {question.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {draggedIndex === index && (
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            ⬆️ Kéo để sắp xếp, thả lên vị trí muốn di chuyển tới
                          </p>
                        )}
                        {dragOverIndex === index &&
                          draggedIndex !== null &&
                          draggedIndex !== index && (
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              ✓ Thả ở đây để đặt câu hỏi vào vị trí này
                            </p>
                          )}
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="shrink-0"
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
                  <Button key="cancel" onClick={handleCloseAddQuestionsModal}>
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
                          const isSelected =
                            modalState.selectedQuestionIds.includes(question.id)

                          return (
                            <div
                              key={question.id}
                              onClick={() => handleQuestionSelect(question.id)}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-100 border-blue-400 shadow-sm"
                                  : "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <div className="flex gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() =>
                                    handleQuestionSelect(question.id)
                                  }
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

          {/* STEP 3: Xem Lại & Công Bố */}
          {current === 2 && (
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

              {/* Phân Phối Bài Thi */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Phân Phối Bài Thi
                </h3>
                <div className="space-y-4 bg-blue-50 p-4 rounded border border-blue-200">
                  {/* Radio Button: Public / Departments */}
                  <Form layout="vertical">
                    <Form.Item label="Đối tượng">
                      <div className="space-y-3">
                        <label className="flex items-center cursor-pointer p-3 bg-white rounded border border-gray-200 hover:border-blue-400">
                          <input
                            type="radio"
                            name="targetType"
                            value="PUBLIC"
                            checked={payload.targetType === "PUBLIC"}
                            onChange={() => {
                              setPayload((prev) => ({
                                ...prev,
                                targetType: "PUBLIC",
                                targetDeptIds: [],
                              }))
                            }}
                            className="w-4 h-4"
                          />
                          <span className="ml-3">
                            <p className="font-medium">
                              Công Khai (Toàn Công Ty)
                            </p>
                            <p className="text-sm text-gray-600">
                              Tất cả nhân viên có thể thấy bài thi này
                            </p>
                          </span>
                        </label>

                        <label className="flex items-center cursor-pointer p-3 bg-white rounded border border-gray-200 hover:border-blue-400">
                          <input
                            type="radio"
                            name="targetType"
                            value="DEPARTMENTS"
                            checked={payload.targetType === "DEPARTMENTS"}
                            onChange={() => {
                              setPayload((prev) => ({
                                ...prev,
                                targetType: "DEPARTMENTS",
                              }))
                            }}
                            className="w-4 h-4"
                          />
                          <span className="ml-3">
                            <p className="font-medium">Phòng Ban Cụ Thể</p>
                            <p className="text-sm text-gray-600">
                              Chỉ những phòng ban được chọn mới thấy
                            </p>
                          </span>
                        </label>
                      </div>
                    </Form.Item>

                    {/* Department Select - Show only when DEPARTMENTS is selected */}
                    {payload.targetType === "DEPARTMENTS" && (
                      <Form.Item label="Chọn Phòng Ban" required>
                        <Select
                          mode="multiple"
                          placeholder="Chọn phòng ban..."
                          value={payload.targetDeptIds || []}
                          onChange={(selectedIds) => {
                            setPayload((prev) => ({
                              ...prev,
                              targetDeptIds: selectedIds,
                            }))
                          }}
                          options={departments.map((dept) => ({
                            label: dept.name,
                            value: dept.id,
                          }))}
                        />
                      </Form.Item>
                    )}

                    {/* Display selected distribution */}
                    <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                      {payload.targetType === "PUBLIC" ? (
                        <p className="text-sm text-gray-700">
                          ✓ <strong>Công Khai:</strong> Tất cả nhân viên công ty
                        </p>
                      ) : (
                        <p className="text-sm text-gray-700">
                          ✓ <strong>Phòng Ban:</strong>{" "}
                          {payload.targetDeptIds &&
                          payload.targetDeptIds.length > 0
                            ? departments
                                .filter((d) =>
                                  payload.targetDeptIds?.includes(d.id)
                                )
                                .map((d) => d.name)
                                .join(", ")
                            : "(Chưa chọn phòng ban)"}
                        </p>
                      )}
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </div>
      </Spin>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between gap-4">
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
              disabled={
                current === 1
                  ? (payload.questions?.length || 0) < 10
                  : Object.keys(errors).length > 0
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
              size="large"
            >
              Tạo Bài Thi
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
