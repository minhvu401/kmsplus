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
  Radio,
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
import {
  getQuestionsByCategory,
  createQuestion,
} from "@/action/question-bank/questionBankActions"
import {
  getCategoriesAPI,
} from "@/action/courses/courseAction"
import useLanguageStore from "@/store/useLanguageStore"

// Constants
const TOTAL_QUIZ_POINTS = 100

interface QuizPayload {
  category_id?: number
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
  presetCategoryId?: number | null
  lockPresetCategory?: boolean
}

export default function CreateQuizModal({
  visible,
  onClose,
  onSuccess,
  presetCategoryId,
  lockPresetCategory = false,
}: CreateQuizModalProps) {
  const { user } = useUserStore()
  const { language } = useLanguageStore()
  const isVi = language === "vi"

  const t = {
    stepBasic: isVi ? "Thông Tin Cơ Bản" : "Basic Information",
    stepQuestions: isVi ? "Thêm Câu Hỏi" : "Add Questions",
    stepReview: isVi ? "Xem Lại & Công Bố" : "Review & Publish",
    requiredQuizName: isVi ? "Vui lòng nhập tên bài thi" : "Please enter quiz title",
    quizNameMin: isVi ? "Tên bài thi không được ít hơn 10 ký tự" : "Quiz title must be at least 10 characters",
    quizNameMax: isVi ? "Tên bài thi không vượt quá 255 ký tự" : "Quiz title must not exceed 255 characters",
    descMax: isVi ? "Mô tả không vượt quá 1000 ký tự" : "Description must not exceed 1000 characters",
    requiredCategory: isVi ? "Vui lòng chọn danh mục" : "Please select a category",
    durationRange: isVi ? "Thời gian làm bài phải từ 0 đến 1440 phút" : "Time limit must be between 0 and 1440 minutes",
    passingRange: isVi ? "Điểm đạt phải từ 1 đến 100" : "Passing score must be between 1 and 100",
    min10Questions: isVi ? "Vui lòng thêm ít nhất 10 câu hỏi" : "Please add at least 10 questions",
    needMoreQuestions: (count: number) =>
      isVi
        ? `Bạn cần thêm ít nhất 10 câu hỏi (hiện tại: ${count} câu)`
        : `You need at least 10 questions (current: ${count})`,
    completeRequired: isVi ? "Vui lòng hoàn thành các trường bắt buộc" : "Please complete required fields",
    completeAllSteps: isVi ? "Vui lòng hoàn thành tất cả các bước" : "Please complete all steps",
    userNotFound: isVi ? "Không tìm thấy người dùng" : "User ID not found",
    categoryLocked: isVi
      ? "Danh mục đã bị khóa vì đã thêm câu hỏi. Hãy xóa hết câu hỏi để đổi danh mục."
      : "Category is locked after adding questions. Remove all questions to change it.",
    pickCategoryBeforeAdd: isVi
      ? "Vui lòng chọn danh mục trước khi thêm câu hỏi"
      : "Please select a category before adding questions",
    noQuestionBank: isVi
      ? "Không có câu hỏi nào trong kho dữ liệu"
      : "No questions found in question bank",
    loadQuestionsFail: isVi
      ? "Không thể tải danh sách câu hỏi"
      : "Failed to load questions",
    updatedQuestions: (count: number) =>
      isVi ? `Cập nhật ${count} câu hỏi` : `Updated ${count} questions`,
    pickCategoryBeforeCreate: isVi
      ? "Vui lòng chọn danh mục trước khi tạo câu hỏi"
      : "Please select a category before creating a question",
    questionMin: isVi
      ? "Nội dung câu hỏi phải có ít nhất 10 ký tự"
      : "Question content must be at least 10 characters",
    requireOptions: isVi
      ? "Vui lòng nhập đầy đủ 4 đáp án"
      : "Please provide all 4 options",
    requireOneCorrect: isVi
      ? "Vui lòng chọn 1 đáp án đúng"
      : "Please select one correct answer",
    requireAtLeastOneCorrect: isVi
      ? "Vui lòng chọn ít nhất 1 đáp án đúng"
      : "Please select at least one correct answer",
    createQuestionSuccess: isVi
      ? "Đã tạo câu hỏi mới và thêm vào bài thi"
      : "Question created and added to quiz",
    createQuestionFail: isVi
      ? "Không thể tạo câu hỏi mới"
      : "Failed to create question",
    removeQuestionSuccess: isVi ? "Đã xóa câu hỏi" : "Question removed",
    createQuizSuccess: isVi ? "Tạo bài thi thành công!" : "Quiz created successfully!",
    createQuizFailPrefix: isVi ? "Lỗi khi tạo bài thi" : "Failed to create quiz",
    createQuizModalTitle: isVi ? "Tạo Bài Thi Mới" : "Create New Quiz",
    quizTitleLabel: isVi ? "Tên Bài Thi" : "Quiz Title",
    categoryLabel: isVi ? "Danh Mục" : "Category",
    descriptionOptionalLabel: isVi ? "Mô Tả (Tùy Chọn)" : "Description (Optional)",
    timeLimitLabel: isVi ? "Thời Gian Làm Bài (phút)" : "Time Limit (minutes)",
    passingScoreLabel: isVi ? "Điểm Đạt (%)" : "Passing Score (%)",
    maxAttemptsLabel: isVi ? "Số Lần Làm Bài (Max Attempts)" : "Max Attempts",
    quizTitlePlaceholder: isVi ? "VD: Kiểm tra kiến thức Product" : "e.g. Product knowledge quiz",
    categoryPlaceholder: isVi ? "Chọn danh mục" : "Select category",
    categoryLockedHint: isVi
      ? "Danh mục đã khóa sau khi thêm câu hỏi. Xóa toàn bộ câu hỏi để thay đổi."
      : "Category is locked after adding questions. Remove all questions to change it.",
    categoryPresetLockedHint: isVi
      ? "Danh mục được đồng bộ từ khóa học và không thể thay đổi."
      : "Category is inherited from the course and cannot be changed.",
    descriptionPlaceholder: isVi
      ? "VD: Dành cho nhân viên mới bắt đầu học về sản phẩm"
      : "e.g. For new employees learning the product",
    durationPlaceholder: isVi ? "VD: 30" : "e.g. 30",
    passingPlaceholder: isVi ? "VD: 80" : "e.g. 80",
    selectAttemptsPlaceholder:
      isVi ? "Chọn số lần được phép làm bài" : "Select max attempts",
    addFromBank: isVi ? "Thêm Câu Hỏi Từ Kho" : "Add Questions from Bank",
    createNewQuestion: isVi ? "Tạo Câu Hỏi Mới" : "Create New Question",
    selectedQuestions: (count: number) =>
      isVi ? `Câu hỏi đã chọn (${count}):` : `Selected questions (${count}):`,
    needMore: (count: number) =>
      isVi ? `⚠️ Cần thêm ít nhất ${count} câu nữa` : `⚠️ Need at least ${count} more questions`,
    pointsPerQuestion: isVi ? "📊 Điểm/câu:" : "📊 Points/question:",
    totalPoints: isVi ? "Tổng điểm:" : "Total points:",
    noQuestionSelected: isVi ? "Chưa có câu hỏi nào được chọn" : "No questions selected yet",
    clickAddFromBank: isVi
      ? 'Nhấn "Thêm Câu Hỏi Từ Kho" để bắt đầu'
      : 'Click "Add Questions from Bank" to start',
    selectFromBankTitle: isVi ? "Chọn Câu Hỏi Từ Kho" : "Select Questions from Bank",
    cancel: isVi ? "Hủy" : "Cancel",
    addNQuestions: (count: number) =>
      isVi ? `Thêm ${count} Câu Hỏi` : `Add ${count} Questions`,
    searchQuestionsPlaceholder:
      isVi ? "Tìm kiếm câu hỏi..." : "Search questions...",
    createQuestionModalTitle: isVi ? "Tạo Câu Hỏi Mới" : "Create New Question",
    createAndAdd: isVi ? "Tạo & Thêm Vào Bài Thi" : "Create & Add to Quiz",
    categoryInline: isVi ? "Danh mục:" : "Category:",
    questionPlaceholder:
      isVi ? "Nhập nội dung câu hỏi..." : "Enter question content...",
    singleChoice: isVi ? "Một đáp án" : "Single Choice",
    multipleChoice: isVi ? "Nhiều đáp án" : "Multiple Choice",
    optionPlaceholder: (letter: string) =>
      isVi ? `Nhập đáp án ${letter}` : `Enter option ${letter}`,
    explanationPlaceholder: isVi
      ? "Giải thích (tùy chọn)..."
      : "Explanation (optional)...",
    reviewInfoTitle: isVi ? "Thông Tin Bài Thi" : "Quiz Information",
    nameLabel: isVi ? "Tên:" : "Name:",
    timeLabel: isVi ? "Thời gian:" : "Time:",
    passingLabel: isVi ? "Điểm đạt:" : "Passing score:",
    attemptsLabel: isVi ? "Số lần làm:" : "Max attempts:",
    descriptionLabel: isVi ? "Mô tả:" : "Description:",
    questionsSummary: (count: number) =>
      isVi ? `Câu Hỏi (${count} câu)` : `Questions (${count})`,
    pointsEachLabel: isVi ? "Điểm mỗi câu:" : "Points/question:",
    readyCreate: isVi ? "Sẵn sàng tạo bài thi!" : "Ready to create quiz!",
    back: isVi ? "Quay Lại" : "Back",
    next: isVi ? "Tiếp Theo" : "Next",
    createQuizButton: isVi ? "Tạo Bài Thi" : "Create Quiz",
    unlimited: isVi ? "Không giới hạn" : "Unlimited",
  }

  const steps = [t.stepBasic, t.stepQuestions, t.stepReview]

  const [form] = Form.useForm()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  const [stepValid, setStepValid] = useState<boolean[]>(
    new Array(steps.length).fill(false)
  )

  const [errors, setErrors] = useState<StepErrors>({})

  const [payload, setPayload] = useState<QuizPayload>({
    category_id: undefined,
    title: "",
    description: "",
    status: "draft",
    time_limit_minutes: 30,
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

  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateQuestionModalVisible, setIsCreateQuestionModalVisible] =
    useState(false)
  const [creatingQuestion, setCreatingQuestion] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState("")
  const [newQuestionType, setNewQuestionType] = useState<
    "single_choice" | "multiple_choice"
  >("single_choice")
  const [newOptions, setNewOptions] = useState(["", "", "", ""])
  const [newCorrectIndex, setNewCorrectIndex] = useState<number | null>(null)
  const [newCorrectIndexes, setNewCorrectIndexes] = useState<number[]>([])
  const [newExplanation, setNewExplanation] = useState("")
  const isCategoryLocked = (payload.questions?.length || 0) > 0
  const isCategorySelectionLocked =
    isCategoryLocked || (lockPresetCategory && presetCategoryId != null)

  const resetCreateQuestionForm = () => {
    setNewQuestionText("")
    setNewQuestionType("single_choice")
    setNewOptions(["", "", "", ""])
    setNewCorrectIndex(null)
    setNewCorrectIndexes([])
    setNewExplanation("")
  }

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrent(0)
      setStepValid(new Array(steps.length).fill(false))
      setErrors({})
      setPayload({
        category_id:
          presetCategoryId != null ? Number(presetCategoryId) : undefined,
        title: "",
        description: "",
        status: "draft",
        time_limit_minutes: 30,
        passing_score: 80,
        max_attempts: 3,
        questions: [],
        targetType: "PUBLIC",
        targetDeptIds: [],
      })
    }
  }, [visible, presetCategoryId])

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true)
      try {
        const categoryData = await getCategoriesAPI()
        setCategories((categoryData || []).filter((category) => category.id !== 1))
      } catch (error) {
        console.error("Failed to load categories:", error)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep1 = (): boolean => {
    const newErrors: StepErrors = {}

    if (!payload.title || !payload.title.trim()) {
      newErrors.title = t.requiredQuizName
    } else if (payload.title.length < 10) {
      newErrors.title = t.quizNameMin
    } else if (payload.title.length > 255) {
      newErrors.title = t.quizNameMax
    }

    if (payload.description && payload.description.length > 1000) {
      newErrors.description = t.descMax
    }

    if (!payload.category_id) {
      newErrors.category_id = t.requiredCategory
    }

    if (
      payload.time_limit_minutes !== undefined &&
      (payload.time_limit_minutes < 0 || payload.time_limit_minutes > 1440)
    ) {
      newErrors.time_limit_minutes = t.durationRange
    }

    if (
      payload.passing_score !== undefined &&
      (payload.passing_score <= 0 || payload.passing_score > 100)
    ) {
      newErrors.passing_score = t.passingRange
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    if (!payload.questions || payload.questions.length === 0) {
      message.error(t.min10Questions)
      return false
    }

    if (payload.questions.length < 10) {
      message.error(t.needMoreQuestions(payload.questions.length))
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
      setPayload((prev) => ({ ...prev, time_limit_minutes: 30 }))
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

  const handleCategoryChange = (categoryId: number) => {
    if (isCategorySelectionLocked) {
      message.warning(t.categoryLocked)
      return
    }

    setErrors((prev) => {
      const next = { ...prev }
      delete next.category_id
      return next
    })
    setPayload((prev) => ({
      ...prev,
      category_id: categoryId,
    }))
  }

  // ============================================
  // QUESTION MODAL
  // ============================================

  const handleOpenAddQuestionsModal = async () => {
    if (!payload.category_id) {
      message.warning(t.pickCategoryBeforeAdd)
      return
    }

    const existingQuestionIds = (payload.questions || []).map((q) => q.id)

    setModalState((prev) => ({
      ...prev,
      visible: true,
      loading: true,
      selectedQuestionIds: existingQuestionIds,
    }))

    try {
      const response = await getQuestionsByCategory(payload.category_id)

      if (response && response.length > 0) {
        const questions = response.map((q: any) => ({
          id: Number(q.id),
          text: q.question_text,
          description: q.explanation || "",
          type: q.type,
          created_at: q.created_at,
        }))

        setModalState((prev) => ({ ...prev, questions, loading: false }))
      } else {
        message.warning(t.noQuestionBank)
        setModalState((prev) => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error("Failed to load questions:", error)
      message.error(t.loadQuestionsFail)
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
    message.success(t.updatedQuestions(selectedQuestions.length))
    handleCloseAddQuestionsModal()
  }

  const handleOpenCreateQuestionModal = () => {
    if (!payload.category_id) {
      message.warning(t.pickCategoryBeforeCreate)
      return
    }
    resetCreateQuestionForm()
    setIsCreateQuestionModalVisible(true)
  }

  const handleCreateOptionChange = (value: string, index: number) => {
    const updated = [...newOptions]
    updated[index] = value
    setNewOptions(updated)
  }

  const handleCreateAnswerToggle = (index: number) => {
    if (newQuestionType === "single_choice") {
      setNewCorrectIndex((prev) => (prev === index ? null : index))
      return
    }

    setNewCorrectIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const handleCreateQuestionSubmit = async () => {
    if (!payload.category_id) {
      message.error(t.requiredCategory)
      return
    }

    const trimmedText = newQuestionText.trim()
    if (trimmedText.length < 10) {
      message.error(t.questionMin)
      return
    }

    if (newOptions.some((opt) => !opt.trim())) {
      message.error(t.requireOptions)
      return
    }

    if (newQuestionType === "single_choice" && newCorrectIndex === null) {
      message.error(t.requireOneCorrect)
      return
    }

    if (
      newQuestionType === "multiple_choice" &&
      newCorrectIndexes.length === 0
    ) {
      message.error(t.requireAtLeastOneCorrect)
      return
    }

    try {
      setCreatingQuestion(true)
      const result = await createQuestion({
        questionText: trimmedText,
        categoryId: payload.category_id,
        type: newQuestionType,
        options: newOptions.map((opt) => opt.trim()),
        correctAnswer:
          newQuestionType === "single_choice"
            ? newCorrectIndex
            : newCorrectIndexes,
        explanation: newExplanation.trim() || null,
      })

      const created = result?.data
      if (!created?.id) {
        throw new Error("Create question failed")
      }

      const createdQuestion: Question = {
        id: Number(created.id),
        text: created.question_text,
        description: created.explanation || "",
        type: created.type,
        created_at: created.created_at,
      }

      setPayload((prev) => ({
        ...prev,
        questions: [
          ...(prev.questions || []),
          ...((prev.questions || []).some((q) => q.id === createdQuestion.id)
            ? []
            : [createdQuestion]),
        ],
      }))

      setModalState((prev) => ({
        ...prev,
        questions: [
          ...prev.questions,
          ...(prev.questions.some((q) => q.id === createdQuestion.id)
            ? []
            : [createdQuestion]),
        ],
      }))

      message.success(t.createQuestionSuccess)
      setIsCreateQuestionModalVisible(false)
      resetCreateQuestionForm()
    } catch (error) {
      console.error("Failed to create question:", error)
      message.error(t.createQuestionFail)
    } finally {
      setCreatingQuestion(false)
    }
  }

  const handleRemoveQuestion = (questionId: number) => {
    setPayload((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((q) => q.id !== questionId),
    }))
    message.success(t.removeQuestionSuccess)
  }

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = () => {
    const isValid = validateCurrentStep()
    if (!isValid) {
      message.error(t.completeRequired)
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
      message.error(t.completeAllSteps)
      return
    }

    if (!user?.id) {
      message.error(t.userNotFound)
      return
    }

    if (!payload.category_id) {
      message.error(t.requiredCategory)
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

      message.success(t.createQuizSuccess)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      message.error(`${t.createQuizFailPrefix}: ${errorMsg}`)
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
          <span className="text-xl font-bold">{t.createQuizModalTitle}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      centered
      footer={null}
      destroyOnHidden
      maskClosable={false}
      styles={{
        body: {
          maxHeight: "75vh",
          overflowY: "auto",
          paddingRight: 32,
        },
      }}
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
          <div className="min-h-[400px] px-2">
            {/* STEP 1: Thông Tin Cơ Bản */}
            {current === 0 && (
              <Form form={form} layout="vertical" className="space-y-4">
                <Form.Item
                  label={
                    <span>
                      {t.quizTitleLabel} <span className="text-red-500">*</span>
                    </span>
                  }
                  validateStatus={errors.title ? "error" : ""}
                  help={errors.title}
                >
                  <Input
                    placeholder={t.quizTitlePlaceholder}
                    value={payload.title}
                    onChange={handleTitleChange}
                    maxLength={255}
                    showCount
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span>
                      {t.categoryLabel} <span className="text-red-500">*</span>
                    </span>
                  }
                  validateStatus={errors.category_id ? "error" : ""}
                  help={
                    errors.category_id ||
                    (isCategorySelectionLocked
                      ? lockPresetCategory && presetCategoryId != null
                        ? t.categoryPresetLockedHint
                        : t.categoryLockedHint
                      : undefined)
                  }
                >
                  <Select
                    placeholder={t.categoryPlaceholder}
                    value={payload.category_id}
                    onChange={handleCategoryChange}
                    loading={loadingCategories}
                    disabled={isCategorySelectionLocked}
                    options={categories.map((category) => ({
                      label: category.name,
                      value: category.id,
                    }))}
                    size="large"
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item
                  label={t.descriptionOptionalLabel}
                  validateStatus={errors.description ? "error" : ""}
                  help={errors.description}
                >
                  <Input.TextArea
                    placeholder={t.descriptionPlaceholder}
                    value={payload.description}
                    onChange={handleDescriptionChange}
                    rows={3}
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    label={t.timeLimitLabel}
                    validateStatus={errors.time_limit_minutes ? "error" : ""}
                    help={errors.time_limit_minutes}
                  >
                    <Input
                      type="number"
                      placeholder={t.durationPlaceholder}
                      value={payload.time_limit_minutes || ""}
                      onChange={handleDurationChange}
                      min={0}
                      max={1440}
                    />
                  </Form.Item>

                  <Form.Item
                    label={t.passingScoreLabel}
                    validateStatus={errors.passing_score ? "error" : ""}
                    help={errors.passing_score}
                  >
                    <Input
                      type="number"
                      placeholder={t.passingPlaceholder}
                      value={payload.passing_score || ""}
                      onChange={handlePassingScoreChange}
                      min={1}
                      max={100}
                    />
                  </Form.Item>
                </div>

                <Form.Item label={t.maxAttemptsLabel}>
                  <Select
                    placeholder={t.selectAttemptsPlaceholder}
                    value={payload.max_attempts}
                    onChange={handleMaxAttemptsChange}
                    options={[
                      { label: "1", value: 1 },
                      { label: "2", value: 2 },
                      { label: "3", value: 3 },
                      { label: "5", value: 5 },
                    ]}
                  />
                </Form.Item>
              </Form>
            )}

            {/* STEP 2: Thêm Câu Hỏi */}
            {current === 1 && (
              <div>
                <div className="mb-4 flex gap-2">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddQuestionsModal}
                  >
                    {t.addFromBank}
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateQuestionModal}
                  >
                    {t.createNewQuestion}
                  </Button>
                </div>

                {payload.questions && payload.questions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {t.selectedQuestions(payload.questions.length)}
                      </span>
                      {payload.questions.length < 10 && (
                        <span className="text-red-500 text-sm">
                          {t.needMore(10 - payload.questions.length)}
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
                        {t.pointsPerQuestion}{" "}
                        <strong>{pointsPerQuestion.toFixed(2)}</strong> | Tổng
                        điểm: <strong>{TOTAL_QUIZ_POINTS}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded">
                    <p className="text-gray-500">
                      {t.noQuestionSelected}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {t.clickAddFromBank}
                    </p>
                  </div>
                )}

                {/* Question Bank Modal */}
                <Modal
                  title={t.selectFromBankTitle}
                  open={modalState.visible}
                  onCancel={handleCloseAddQuestionsModal}
                  width={800}
                  footer={[
                    <Button key="cancel" onClick={handleCloseAddQuestionsModal}>
                      {t.cancel}
                    </Button>,
                    <Button
                      key="add"
                      type="primary"
                      onClick={handleAddSelectedQuestions}
                      disabled={modalState.selectedQuestionIds.length === 0}
                    >
                      {t.addNQuestions(modalState.selectedQuestionIds.length)}
                    </Button>,
                  ]}
                >
                  <Spin spinning={modalState.loading}>
                    <Input.Search
                      placeholder={t.searchQuestionsPlaceholder}
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

                <Modal
                  title={t.createQuestionModalTitle}
                  open={isCreateQuestionModalVisible}
                  onCancel={() => setIsCreateQuestionModalVisible(false)}
                  onOk={handleCreateQuestionSubmit}
                  okText={t.createAndAdd}
                  cancelText={t.cancel}
                  confirmLoading={creatingQuestion}
                  width={760}
                  centered
                  styles={{
                    body: {
                      paddingBottom: 28,
                    },
                  }}
                >
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      {t.categoryInline} <strong>{categories.find((c) => c.id === payload.category_id)?.name || "N/A"}</strong>
                    </div>

                    <Input.TextArea
                      placeholder={t.questionPlaceholder}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      autoSize={{ minRows: 3, maxRows: 8 }}
                      showCount
                      maxLength={1000}
                    />

                    <Radio.Group
                      value={newQuestionType}
                      onChange={(e) => {
                        const nextType = e.target.value as
                          | "single_choice"
                          | "multiple_choice"
                        setNewQuestionType(nextType)
                        setNewCorrectIndex(null)
                        setNewCorrectIndexes([])
                      }}
                    >
                      <Radio.Button value="single_choice">{t.singleChoice}</Radio.Button>
                      <Radio.Button value="multiple_choice">{t.multipleChoice}</Radio.Button>
                    </Radio.Group>

                    <div className="space-y-2">
                      {newOptions.map((optionText, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 rounded-md border-2 px-3 py-2 transition-colors ${
                            (newQuestionType === "single_choice" &&
                              newCorrectIndex === index) ||
                            (newQuestionType === "multiple_choice" &&
                              newCorrectIndexes.includes(index))
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <span className="w-6 text-center font-semibold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <Input
                            value={optionText}
                            onChange={(e) =>
                              handleCreateOptionChange(e.target.value, index)
                            }
                            placeholder={t.optionPlaceholder(
                              String.fromCharCode(65 + index)
                            )}
                          />
                          <div className="rounded border border-gray-300 bg-white px-2 py-1">
                            {newQuestionType === "single_choice" ? (
                              <Radio
                                checked={newCorrectIndex === index}
                                onChange={() => handleCreateAnswerToggle(index)}
                              />
                            ) : (
                              <Checkbox
                                checked={newCorrectIndexes.includes(index)}
                                onChange={() => handleCreateAnswerToggle(index)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pb-2">
                      <Input.TextArea
                        placeholder={t.explanationPlaceholder}
                        value={newExplanation}
                        onChange={(e) => setNewExplanation(e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        maxLength={2000}
                        showCount
                      />
                    </div>
                  </div>
                </Modal>
              </div>
            )}

            {/* STEP 3: Xem Lại */}
            {current === 2 && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-3">{t.reviewInfoTitle}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <strong>{t.nameLabel}</strong> {payload.title}
                    </p>
                    <p>
                      <strong>{t.timeLabel}</strong>{" "}
                      {payload.time_limit_minutes || t.unlimited} {isVi ? "phút" : "min"}
                    </p>
                    <p>
                      <strong>{t.passingLabel}</strong> {payload.passing_score}%
                    </p>
                    <p>
                      <strong>{t.attemptsLabel}</strong>{" "}
                      {payload.max_attempts === 999
                        ? t.unlimited
                        : payload.max_attempts}
                    </p>
                  </div>
                  {payload.description && (
                    <p className="mt-2 text-sm">
                      <strong>{t.descriptionLabel}</strong> {payload.description}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">
                    {t.questionsSummary(payload.questions?.length || 0)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t.pointsEachLabel} {pointsPerQuestion.toFixed(2)} | {t.totalPoints}{" "}
                    {TOTAL_QUIZ_POINTS}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-600" />
                    <span className="text-green-700 font-medium">
                      {t.readyCreate}
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
            {t.back}
          </Button>

          <div className="flex gap-2">
            <Button onClick={onClose}>{t.cancel}</Button>
            {current < steps.length - 1 ? (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                disabled={
                  current === 1 ? (payload.questions?.length || 0) < 10 : false
                }
              >
                {t.next}
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
                {t.createQuizButton}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
