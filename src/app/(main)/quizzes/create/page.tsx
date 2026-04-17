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
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import { sanitizeTitle, sanitizeDescription } from "@/utils/sanitize"

// Constants
const TOTAL_QUIZ_POINTS = 100 // Tổng điểm quiz cố định

interface QuizPayload {
  category_id: number
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
  const language = useLanguageStore((state) => state.language)

  const steps = [
    t("quiz.step_basic_info", language),
    t("quiz.step_add_questions", language),
    t("quiz.step_review_publish", language),
  ]

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
    category_id: 1,
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
      newErrors.title = t("quiz.validation_title_required", language)
    } else if (payload.title.length < 10) {
      newErrors.title = t("quiz.validation_title_min", language)
    } else if (payload.title.length > 255) {
      newErrors.title = t("quiz.validation_title_max", language)
    }

    if (payload.description && payload.description.length > 1000) {
      newErrors.description = t("quiz.validation_description_max", language)
    }

    if (
      payload.time_limit_minutes !== undefined &&
      (payload.time_limit_minutes < 0 || payload.time_limit_minutes > 1440)
    ) {
      newErrors.time_limit_minutes = t(
        "quiz.validation_duration_range",
        language
      )
    }

    if (
      payload.passing_score !== undefined &&
      (payload.passing_score <= 0 || payload.passing_score > 100)
    ) {
      newErrors.passing_score = t(
        "quiz.validation_passing_score_range",
        language
      )
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
        message.error(t("quiz.load_dept_error", language))
      }
    }

    loadDepartments()
  }, [language])

  const validateStep2 = (): boolean => {
    // Require at least 10 questions
    if (!payload.questions || payload.questions.length === 0) {
      message.error(t("quiz.validation_no_questions", language))
      return false
    }

    if (payload.questions.length < 10) {
      message.error(
        `${t("quiz.validation_questions_count", language)} (${t("common.current", language)}: ${payload.questions.length} ${t("quiz.questions_unit", language)})`
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
        message.warning(t("quiz.no_questions_in_bank", language))
        setModalState((prev) => ({
          ...prev,
          loading: false,
        }))
      }
    } catch (error) {
      console.error("Failed to load questions:", error)
      message.error(t("quiz.load_questions_error", language))
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

    message.success(
      t("quiz.updated_questions", language).replace(
        "{0}",
        String(selectedQuestions.length)
      )
    )
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
    message.success(t("quiz.reorder_success", language))
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
    message.success(t("quiz.delete_question_success", language))
  }

  // ============================================
  // STEP NAVIGATION
  // ============================================

  const handleNext = () => {
    const isValid = validateCurrentStep()

    if (!isValid) {
      message.error(t("quiz.validation_incomplete_fields", language))
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
      message.error(t("quiz.validation_incomplete_steps", language))
      return
    }

    if (!user?.id) {
      console.warn("[handleSubmit] User not found")
      message.error(t("quiz.user_not_found", language))
      return
    }

    if (!payload.category_id) {
      console.warn("[handleSubmit] Category ID not found")
      message.error(t("quiz.error_category_required", language))
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("category_id", String(payload.category_id))
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
      message.success(t("quiz.create_success", language))
      router.push("/quizzes")
    } catch (error) {
      console.error("[handleSubmit] Error:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      message.error(
        t("quiz.error_creating_quiz", language).replace("{0}", errorMsg)
      )
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
        <h1 className="text-3xl font-bold mb-2">
          {t("quiz.create_title", language)}
        </h1>
        <p className="text-gray-600">
          {t("quiz.step_number", language)
            .replace("{0}", String(current + 1))
            .replace("{1}", String(steps.length))}
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
                {t("quiz.step_basic_info", language)}
              </h2>

              <Form form={form} layout="vertical" className="space-y-6">
                <Form.Item
                  label={
                    <span>
                      {t("quiz.label_title", language)}{" "}
                      <span className="text-red-500 font-bold">*</span>
                    </span>
                  }
                  validateStatus={errors.title ? "error" : ""}
                  help={errors.title}
                >
                  <Input
                    placeholder={t("quiz.example_title", language)}
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
                  label={t("quiz.label_description", language)}
                  validateStatus={errors.description ? "error" : ""}
                  help={errors.description}
                >
                  <Input.TextArea
                    placeholder={t("quiz.example_description", language)}
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
                  label={t("quiz.label_duration", language)}
                  validateStatus={errors.time_limit_minutes ? "error" : ""}
                  help={errors.time_limit_minutes}
                >
                  <div className="flex gap-3 items-center">
                    <Input
                      type="number"
                      placeholder={t("quiz.example_duration", language)}
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
                  label={t("quiz.label_passing_score", language)}
                  validateStatus={errors.passing_score ? "error" : ""}
                  help={errors.passing_score}
                >
                  <div className="flex gap-3 items-center">
                    <InputNumber
                      placeholder={t("quiz.example_passing_score", language)}
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
                  label={t("quiz.label_max_attempts", language)}
                  validateStatus={errors.max_attempts ? "error" : ""}
                  help={errors.max_attempts}
                >
                  <Select
                    placeholder={t("quiz.placeholder_max_attempts", language)}
                    value={payload.max_attempts}
                    onChange={handleMaxAttemptsChange}
                    size="large"
                    options={[
                      { label: "1", value: 1 },
                      { label: "2", value: 2 },
                      { label: "3", value: 3 },
                      { label: "5", value: 5 },
                      {
                        label: t("quiz.option_unlimited", language),
                        value: 999,
                      },
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
                        {t("quiz.valid_info", language)}
                      </span>
                    </>
                  ) : (
                    <>
                      <ExclamationCircleOutlined className="text-red-600" />
                      <span className="text-red-600 font-medium">
                        {t("quiz.invalid_info", language)}
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
              <h2 className="text-2xl font-semibold mb-6">
                {t("quiz.step_add_questions", language)}
              </h2>

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleOpenAddQuestionsModal}
                className="mb-6"
              >
                {t("quiz.btn_add_from_bank", language)}
              </Button>

              {/* Danh sách câu hỏi đã chọn */}
              {payload.questions && payload.questions.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {t("quiz.selected_questions_label", language)} (
                      {payload.questions.length}):
                    </p>
                    {payload.questions.length < 10 && (
                      <p className="text-sm text-red-600 font-medium">
                        {t("quiz.need_more_questions", language).replace(
                          "{0}",
                          String(10 - payload.questions.length)
                        )}
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
                          {t("quiz.total_score", language)}{" "}
                          <span className="text-lg">{totalScore}</span>{" "}
                          {t("quiz.points", language)}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          ({payload.questions.length}{" "}
                          {t("quiz.questions_times_points", language).replace(
                            "{0}",
                            pointsPerQuestion.toFixed(2)
                          )}
                          )
                        </p>
                        {!isPassingScoreValid && (
                          <p className="text-sm text-yellow-800 mt-2">
                            {t("quiz.passing_score_exceeds", language)
                              .replace("{0}", String(passingScore))
                              .replace("{1}", String(totalScore))}
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
                            {t("quiz.drag_to_reorder", language)}
                          </p>
                        )}
                        {dragOverIndex === index &&
                          draggedIndex !== null &&
                          draggedIndex !== index && (
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              {t("quiz.drop_here", language)}
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
                    {t("quiz.no_questions_empty", language)}
                  </p>
                </div>
              )}

              {/* Add Questions Modal */}
              <Modal
                title={t("quiz.modal_title_add_questions", language)}
                open={modalState.visible}
                onCancel={handleCloseAddQuestionsModal}
                width={900}
                footer={[
                  <Button key="cancel" onClick={handleCloseAddQuestionsModal}>
                    {t("quiz.modal_cancel", language)}
                  </Button>,
                  <Button
                    key="submit"
                    type="primary"
                    loading={modalState.loading}
                    onClick={handleAddSelectedQuestions}
                    disabled={modalState.selectedQuestionIds.length === 0}
                  >
                    {t("quiz.modal_submit", language)}{" "}
                    {modalState.selectedQuestionIds.length > 0 &&
                      `(${modalState.selectedQuestionIds.length})`}
                  </Button>,
                ]}
              >
                <Spin spinning={modalState.loading}>
                  <div className="space-y-4">
                    {/* Search Input */}
                    <Input
                      placeholder={t(
                        "quiz.placeholder_search_questions",
                        language
                      )}
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
                              ? t("quiz.no_questions_match", language).replace(
                                  "{0}",
                                  searchQuery
                                )
                              : t("quiz.no_questions_available", language)}
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
              <h2 className="text-2xl font-semibold mb-6">
                {t("quiz.step_review_publish", language)}
              </h2>
              <div className="space-y-4 bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_title", language)}
                  </p>
                  <p className="text-lg font-semibold">{payload.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_description", language)}
                  </p>
                  <p className="text-lg">
                    {payload.description || t("quiz.empty_value", language)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_time_limit", language)}
                  </p>
                  <p className="text-lg">
                    {payload.time_limit_minutes === 0 ||
                    payload.time_limit_minutes === undefined
                      ? t("quiz.option_unlimited", language)
                      : `${payload.time_limit_minutes} ${t("common.minutes", language)}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_passing_score", language)}
                  </p>
                  <p className="text-lg">{payload.passing_score || 80}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_max_attempts", language)}
                  </p>
                  <p className="text-lg">
                    {payload.max_attempts === undefined
                      ? t("quiz.option_unlimited", language)
                      : `${payload.max_attempts} ${t("common.times", language)}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_questions_count", language)}
                  </p>
                  <p className="text-lg">
                    {payload.questions?.length || 0}{" "}
                    {t("quiz.questions_unit", language)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("quiz.review_label_status", language)}
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {payload.status === "draft"
                      ? t("quiz.status_draft", language)
                      : payload.status}
                  </p>
                </div>
              </div>

              {/* Phân Phối Bài Thi */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  {t("quiz.distribution_title", language)}
                </h3>
                <div className="space-y-4 bg-blue-50 p-4 rounded border border-blue-200">
                  {/* Radio Button: Public / Departments */}
                  <Form layout="vertical">
                    <Form.Item label={t("quiz.label_target_type", language)}>
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
                              {t("quiz.target_public_company", language)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t("quiz.target_public_desc", language)}
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
                            <p className="font-medium">
                              {t("quiz.target_specific_departments", language)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t("quiz.target_departments_desc", language)}
                            </p>
                          </span>
                        </label>
                      </div>
                    </Form.Item>

                    {/* Department Select - Show only when DEPARTMENTS is selected */}
                    {payload.targetType === "DEPARTMENTS" && (
                      <Form.Item
                        label={t("quiz.label_target_depts", language)}
                        required
                      >
                        <Select
                          mode="multiple"
                          placeholder={t(
                            "quiz.placeholder_select_depts",
                            language
                          )}
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
                          ✓{" "}
                          <strong>
                            {t("quiz.distribution_public_label", language)}
                          </strong>{" "}
                          {t(
                            "quiz.distribution_public_all_employees",
                            language
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-700">
                          ✓{" "}
                          <strong>
                            {t("quiz.label_target_depts", language)}:
                          </strong>{" "}
                          {payload.targetDeptIds &&
                          payload.targetDeptIds.length > 0
                            ? departments
                                .filter((d) =>
                                  payload.targetDeptIds?.includes(d.id)
                                )
                                .map((d) => d.name)
                                .join(", ")
                            : t("quiz.no_depts_selected", language)}
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
          {t("quiz.btn_back", language)}
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
              {t("quiz.btn_next", language)}
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
              {t("quiz.btn_create_quiz", language)}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
