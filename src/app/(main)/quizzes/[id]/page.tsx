"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  Typography,
  Button,
  Space,
  Spin,
  message,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Divider,
  Empty,
  Select,
  Tooltip,
  Row,
  Col,
  Radio,
  Checkbox,
  Popconfirm,
} from "antd"
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  NumberOutlined,
  FileTextOutlined,
} from "@ant-design/icons"
import {
  getQuizById,
  getQuizMutationGuard,
  getQuizQuestions,
  isQuizUsedInCourse,
  updateQuizQuestions,
  updateQuizMetadata,
} from "@/action/quiz/quizActions"
import {
  getQuestionsByCategory,
  getAllQuestions,
  createQuestion,
} from "@/action/question-bank/questionBankActions"
import { getCategoriesAPI } from "@/action/courses/courseAction"
import useLanguageStore from "@/store/useLanguageStore"
import type { Quiz } from "@/service/quiz.service"

const { Title, Text, Paragraph } = Typography
const MIN_QUIZ_QUESTIONS = 10

interface QuizQuestion {
  quiz_question_id: number
  question_id: number
  question_order: number
  question_text: string
  type: "single_choice" | "multiple_choice"
  explanation?: string
}

interface QuestionOption {
  id: number
  title: string
  category_name?: string
  type?: "single_choice" | "multiple_choice"
}

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = parseInt(params.id as string)
  const { language } = useLanguageStore()
  const isVi = language === "vi"

  const t = {
    ownerOnly: isVi
      ? "Chỉ chủ sở hữu bài thi hoặc Quản trị viên hệ thống mới có thể chỉnh sửa"
      : "Only the quiz owner or System Admin can modify this quiz",
    usedInCourseLock: isVi
      ? "Bài thi này đã được dùng trong khóa học và không thể chỉnh sửa"
      : "This quiz is already used in a course and cannot be modified",
    quizNotFound: isVi ? "Không tìm thấy bài thi" : "Quiz not found",
    loadQuizFailed: isVi
      ? "Không thể tải chi tiết bài thi"
      : "Failed to load quiz details",
    updatedSuccess: isVi ? "Cập nhật bài thi thành công" : "Quiz updated successfully",
    updatedFailed: isVi ? "Không thể cập nhật bài thi" : "Failed to update quiz",
    addQuestionsSuccess: isVi ? "Đã thêm câu hỏi thành công" : "Questions added successfully",
    addQuestionsFailed: isVi ? "Không thể thêm câu hỏi" : "Failed to add questions",
    removeQuestionSuccess: isVi ? "Đã xóa câu hỏi thành công" : "Question removed successfully",
    removeQuestionFailed: isVi ? "Không thể xóa câu hỏi" : "Failed to remove question",
    minQuestionsWarning: isVi
      ? `Bài thi phải có ít nhất ${MIN_QUIZ_QUESTIONS} câu hỏi. Hãy thêm câu hỏi trước khi xóa.`
      : `A quiz must keep at least ${MIN_QUIZ_QUESTIONS} questions. Add more questions before removing any.`,
    noCategoryForCreateQuestion: isVi
      ? "Bài thi chưa có danh mục để tạo câu hỏi"
      : "Quiz has no category for creating questions",
    questionMinLength: isVi
      ? "Nội dung câu hỏi phải có ít nhất 10 ký tự"
      : "Question content must be at least 10 characters",
    requireAllOptions: isVi
      ? "Vui lòng nhập đầy đủ 4 đáp án"
      : "Please fill all 4 options",
    requireOneCorrect: isVi
      ? "Vui lòng chọn 1 đáp án đúng"
      : "Please choose 1 correct answer",
    requireAtLeastOneCorrect: isVi
      ? "Vui lòng chọn ít nhất 1 đáp án đúng"
      : "Please choose at least 1 correct answer",
    createQuestionSuccess: isVi
      ? "Đã tạo câu hỏi mới và thêm vào bài thi"
      : "Created a new question and added it to the quiz",
    createQuestionFailed: isVi
      ? "Không thể tạo câu hỏi mới"
      : "Failed to create new question",
    backToQuizManagement: isVi
      ? "Quay lại quản lý bài thi"
      : "Back to Quiz Management",
    edit: isVi ? "Chỉnh sửa" : "Edit",
    editQuiz: isVi ? "Chỉnh sửa bài thi" : "Edit quiz",
    editDisabledUsedCourse: isVi
      ? "Bài thi đã được dùng trong khóa học. Không thể chỉnh sửa."
      : "Quiz is used in a course. Editing is disabled.",
    timeLimit: isVi ? "Thời gian" : "Time Limit",
    noLimit: isVi ? "Không giới hạn" : "No Limit",
    passingScore: isVi ? "Điểm đạt" : "Passing Score",
    maxAttempts: isVi ? "Số lần làm tối đa" : "Max Attempts",
    questions: isVi ? "Câu hỏi" : "Questions",
    quizTitle: isVi ? "Tiêu đề bài thi" : "Quiz Title",
    category: isVi ? "Danh mục" : "Category",
    selectCategory: isVi ? "Chọn danh mục" : "Select category",
    categoryRequired: isVi ? "Vui lòng chọn danh mục" : "Please select category",
    categoryLockedHint: isVi
      ? "Danh mục bị khóa khi bài thi đã có câu hỏi. Hãy xóa hết câu hỏi để thay đổi."
      : "Category is locked while quiz has questions. Remove all questions to change it.",
    description: isVi ? "Mô tả" : "Description",
    enterQuizTitle: isVi ? "Nhập tiêu đề bài thi" : "Enter quiz title",
    enterDescriptionOptional: isVi
      ? "Nhập mô tả bài thi (tùy chọn)"
      : "Enter quiz description (optional)",
    timeLimitMinutes: isVi ? "Thời gian làm bài (phút)" : "Time Limit (minutes)",
    leaveBlankNoLimit: isVi
      ? "Để trống nếu không giới hạn"
      : "Leave blank for no limit",
    passingScorePercent: isVi ? "Điểm đạt (%)" : "Passing Score (%)",
    enterPassingScore: isVi ? "Vui lòng nhập điểm đạt" : "Please enter passing score",
    maximumAttempts: isVi ? "Số lần làm tối đa" : "Maximum Attempts",
    enterMaxAttempts: isVi ? "Vui lòng nhập số lần làm tối đa" : "Please enter max attempts",
    save: isVi ? "Lưu" : "Save",
    cancel: isVi ? "Hủy" : "Cancel",
    addQuestionsFromBank: isVi ? "Thêm câu hỏi từ kho" : "Add Questions from Bank",
    createQuestion: isVi ? "Tạo câu hỏi" : "Create Question",
    addQuestionsDisabledUsedCourse: isVi
      ? "Bài thi đã được dùng trong khóa học. Không thể thêm câu hỏi từ kho."
      : "Quiz is used in a course. Adding questions from bank is disabled.",
    createQuestionsDisabledUsedCourse: isVi
      ? "Bài thi đã được dùng trong khóa học. Không thể tạo câu hỏi."
      : "Quiz is used in a course. Creating questions is disabled.",
    actionDisabled: isVi ? "Thao tác đã bị vô hiệu hóa" : "Action is disabled",
    noQuestionsYet: isVi ? "Chưa có câu hỏi nào" : "No questions added yet",
    addFirstQuestion: isVi ? "Thêm câu hỏi đầu tiên" : "Add First Question",
    order: isVi ? "Thứ tự" : "Order",
    question: isVi ? "Câu hỏi" : "Question",
    type: isVi ? "Loại" : "Type",
    singleChoice: isVi ? "Một đáp án" : "Single Choice",
    multipleChoice: isVi ? "Nhiều đáp án" : "Multiple Choice",
    action: isVi ? "Hành động" : "Action",
    removeQuestionTitle: isVi ? "Xóa câu hỏi" : "Remove Question",
    removeQuestionConfirm: isVi
      ? "Bạn có chắc muốn xóa câu hỏi này khỏi bài thi?"
      : "Are you sure you want to remove this question from the quiz?",
    cannotRemoveUsedCourse: isVi
      ? "Không thể xóa. Bài thi đã được dùng trong khóa học."
      : "Cannot remove. This quiz is already used in a course.",
    cannotRemoveMinQuestions: isVi
      ? `Không thể xóa. Bài thi phải giữ ít nhất ${MIN_QUIZ_QUESTIONS} câu hỏi.`
      : `Cannot remove. Quiz must keep at least ${MIN_QUIZ_QUESTIONS} questions.`,
    remove: isVi ? "Xóa" : "Remove",
    removeQuestion: isVi ? "Xóa câu hỏi" : "Remove question",
    minQuestionsRequired: isVi
      ? `Cần tối thiểu ${MIN_QUIZ_QUESTIONS} câu hỏi`
      : `Minimum ${MIN_QUIZ_QUESTIONS} questions required`,
    addQuestionsModalTitle: isVi ? "Thêm câu hỏi vào bài thi" : "Add Questions to Quiz",
    add: isVi ? "Thêm" : "Add",
    selectQuestions: isVi ? "Chọn câu hỏi" : "Select Questions",
    selectAtLeastOneQuestion: isVi
      ? "Vui lòng chọn ít nhất một câu hỏi"
      : "Please select at least one question",
    selectQuestionsToAdd: isVi
      ? "Chọn câu hỏi để thêm"
      : "Select questions to add",
    createQuestionModalTitle: isVi ? "Tạo câu hỏi" : "Create Question",
    createAndAdd: isVi ? "Tạo & Thêm" : "Create & Add",
    categoryLabel: isVi ? "Danh mục:" : "Category:",
    enterQuestionContent: isVi
      ? "Nhập nội dung câu hỏi..."
      : "Enter question content...",
    optionLabel: (letter: string) =>
      isVi ? `Đáp án ${letter}` : `Option ${letter}`,
    explanationOptional: isVi ? "Giải thích (tùy chọn)..." : "Explanation (optional)...",
    emptyQuizNotFound: isVi ? "Không tìm thấy bài thi" : "Quiz not found",
  }

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [allAvailableQuestions, setAllAvailableQuestions] = useState<
    QuestionOption[]
  >([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingQuestions, setIsAddingQuestions] = useState(false)
  const [isCreateQuestionModalVisible, setIsCreateQuestionModalVisible] =
    useState(false)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [isQuizUsedByCourse, setIsQuizUsedByCourse] = useState(false)
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false)
  const [mutationLockReason, setMutationLockReason] = useState("")
  const [form] = Form.useForm()
  const [addQuestionsForm] = Form.useForm()

  // Edit form initial values
  const [editForm, setEditForm] = useState({
    category_id: undefined as number | undefined,
    title: "",
    description: "",
    time_limit_minutes: null as number | null,
    passing_score: 70,
    max_attempts: 3,
  })

  // Selected questions to add
  const [selectedQuestionsToAdd, setSelectedQuestionsToAdd] = useState<
    number[]
  >([])
  const [newQuestionText, setNewQuestionText] = useState("")
  const [newQuestionType, setNewQuestionType] = useState<
    "single_choice" | "multiple_choice"
  >("single_choice")
  const [newOptions, setNewOptions] = useState(["", "", "", ""])
  const [newCorrectIndex, setNewCorrectIndex] = useState<number | null>(null)
  const [newCorrectIndexes, setNewCorrectIndexes] = useState<number[]>([])
  const [newExplanation, setNewExplanation] = useState("")

  const resetCreateQuestionForm = () => {
    setNewQuestionText("")
    setNewQuestionType("single_choice")
    setNewOptions(["", "", "", ""])
    setNewCorrectIndex(null)
    setNewCorrectIndexes([])
    setNewExplanation("")
  }

  useEffect(() => {
    loadQuizData()
  }, [quizId])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = await getCategoriesAPI()
        setCategories((categoryData || []).filter((category) => category.id !== 1))
      } catch (error) {
        console.error("Failed to load categories:", error)
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  const loadQuizData = async () => {
    try {
      setLoading(true)

      const [quizData, usageData, mutationGuard] = await Promise.all([
        getQuizById(quizId),
        isQuizUsedInCourse(quizId),
        getQuizMutationGuard(quizId),
      ])
      setIsQuizUsedByCourse(Boolean(usageData))
      setIsOwnerOrAdmin(Boolean(mutationGuard?.isOwnerOrAdmin))
      setMutationLockReason(
        mutationGuard?.reason ||
          t.ownerOnly
      )

      if (!quizData) {
        console.error("🔴 [loadQuizData] Quiz not found")
        message.error(t.quizNotFound)
        router.push("/quizzes")
        return
      }

      setQuiz(quizData)
      setEditForm({
        category_id: quizData.category_id || undefined,
        title: quizData.title,
        description: quizData.description || "",
        time_limit_minutes: quizData.time_limit_minutes,
        passing_score: quizData.passing_score,
        max_attempts: quizData.max_attempts,
      })

      const questionsData = await getQuizQuestions(quizId)
      setQuestions(questionsData as any)

      let availableQuestions: QuestionOption[] = []

      if (quizData.category_id) {
        // Load questions filtered by quiz category
        const categoryQuestions = await getQuestionsByCategory(
          quizData.category_id
        )

        availableQuestions = (categoryQuestions || []).map((q: any) => ({
          id: q.id,
          title: q.question_text,
          category_name: q.category_name,
          type: q.type as "single_choice" | "multiple_choice",
        }))
      } else {
        console.warn(
          "🟡 [loadQuizData] No category_id found, loading all available questions"
        )
        // Load all questions as fallback when category_id is not available
        const allQuestions = await getAllQuestions()

        availableQuestions = (allQuestions || []).map((q: any) => ({
          id: q.id,
          title: q.question_text,
          category_name: q.category_name,
          type: q.type as "single_choice" | "multiple_choice",
        }))
      }

      setAllAvailableQuestions(availableQuestions)
    } catch (error) {
      console.error("🔴 [loadQuizData] Error loading quiz:", error)
      message.error(t.loadQuizFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (!isOwnerOrAdmin) {
      message.warning(
        t.ownerOnly
      )
      return
    }

    if (isQuizUsedByCourse) {
      message.warning(t.usedInCourseLock)
      return
    }

    setIsEditing(true)
    form.setFieldsValue(editForm)
  }

  const handleSave = async (values: any) => {
    if (!isOwnerOrAdmin) {
      message.warning(
        t.ownerOnly
      )
      return
    }

    try {
      setIsSaving(true)

      // Optimistic update: Update UI immediately
      const updatedQuiz = { ...quiz, ...values } as Quiz
      setQuiz(updatedQuiz)
      setEditForm(values)
      setIsEditing(false)
      message.success(t.updatedSuccess)

      // Then save to server in background
      await updateQuizMetadata(quizId, {
        category_id: values.category_id,
        title: values.title,
        description: values.description,
        time_limit_minutes: values.time_limit_minutes,
        passing_score: values.passing_score,
        max_attempts: values.max_attempts,
      })

      if (!questions.length && values.category_id) {
        const categoryQuestions = await getQuestionsByCategory(values.category_id)
        const availableQuestions = (categoryQuestions || []).map((q: any) => ({
          id: q.id,
          title: q.question_text,
          category_name: q.category_name,
          type: q.type as "single_choice" | "multiple_choice",
        }))
        setAllAvailableQuestions(availableQuestions)
      }
    } catch (error) {
      console.error("Error updating quiz:", error)
      // Revert to previous state on error
      setEditForm(quiz as any)
      message.error(t.updatedFailed)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.resetFields()
  }

  const handleAddQuestions = async (values: any) => {
    if (!isOwnerOrAdmin) {
      message.warning(
        t.ownerOnly
      )
      return
    }

    if (isQuizUsedByCourse) {
      message.warning(
        t.usedInCourseLock
      )
      return
    }

    try {
      const newQuestionIds = values.question_ids || []

      const currentQuestionIds = questions.map((q) => q.question_id)

      const allQuestionIds = [...currentQuestionIds, ...newQuestionIds]

      // Get the new questions data to add to the list
      const newQuestionsData = allAvailableQuestions.filter((q) =>
        newQuestionIds.includes(q.id)
      )

      // Optimistic update: Add questions to the list immediately
      const nextOrder =
        Math.max(...questions.map((q) => q.question_order), 0) + 1

      const newQuestions = newQuestionsData.map((q, index) => ({
        quiz_question_id: Date.now() + index, // Temporary ID
        question_id: q.id,
        question_order: nextOrder + index,
        question_text: q.title,
        type: "single_choice" as const,
      }))

      setQuestions([...questions, ...newQuestions])
      message.success(t.addQuestionsSuccess)
      setSelectedQuestionsToAdd([])
      addQuestionsForm.resetFields()
      setIsAddingQuestions(false)

      // Then save to server in background
      await updateQuizQuestions(quizId, allQuestionIds)
    } catch (error) {
      console.error("🔴 [handleAddQuestions] Error adding questions:", error)
      message.error(t.addQuestionsFailed)
      // Reload to revert optimistic update
      loadQuizData()
    }
  }

  const handleRemoveQuestion = async (questionId: number) => {
    if (!isOwnerOrAdmin) {
      message.warning(
        t.ownerOnly
      )
      return
    }

    if (isQuizUsedByCourse) {
      message.warning(
        t.usedInCourseLock
      )
      return
    }

    if (questions.length <= MIN_QUIZ_QUESTIONS) {
      message.warning(
        t.minQuestionsWarning
      )
      return
    }

    try {
      // Optimistic update: Remove question from list immediately
      const updatedQuestions = questions.filter((q) => q.question_id !== questionId)
      setQuestions(updatedQuestions)
      message.success(t.removeQuestionSuccess)

      const remainingQuestionIds = updatedQuestions.map((q) => q.question_id)

      // Then save to server in background
      await updateQuizQuestions(quizId, remainingQuestionIds)
    } catch (error) {
      console.error("Error removing question:", error)
      message.error(t.removeQuestionFailed)
      // Reload to revert optimistic update
      loadQuizData()
    }
  }

  const handleOpenCreateQuestionModal = () => {
    if (!isOwnerOrAdmin) {
      message.warning(
        t.ownerOnly
      )
      return
    }

    if (isQuizUsedByCourse) {
      message.warning(
        t.usedInCourseLock
      )
      return
    }

    if (!quiz?.category_id) {
      message.error(t.noCategoryForCreateQuestion)
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
    if (!quiz?.category_id) {
      message.error(t.noCategoryForCreateQuestion)
      return
    }

    const trimmedText = newQuestionText.trim()
    if (trimmedText.length < 10) {
      message.error(t.questionMinLength)
      return
    }

    if (newOptions.some((opt) => !opt.trim())) {
      message.error(t.requireAllOptions)
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
      setIsCreatingQuestion(true)
      const result = await createQuestion({
        questionText: trimmedText,
        categoryId: quiz.category_id,
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

      const mergedQuestionIds = Array.from(
        new Set([...questions.map((q) => q.question_id), Number(created.id)])
      )

      await updateQuizQuestions(quizId, mergedQuestionIds)
      await loadQuizData()

      message.success(t.createQuestionSuccess)
      setIsCreateQuestionModalVisible(false)
      resetCreateQuestionForm()
    } catch (error) {
      console.error("Error creating and linking question:", error)
      message.error(t.createQuestionFailed)
    } finally {
      setIsCreatingQuestion(false)
    }
  }

  const handleBack = () => {
    router.push("/quizzes")
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Empty description="Quiz not found" />
        <Empty description={t.emptyQuizNotFound} />
      </div>
    )
  }

  const categoryName =
    categories.find((c) => c.id === quiz.category_id)?.name ||
    quiz.category_name ||
    "N/A"

  const editCategoryOptions = [...categories]
  if (
    quiz.category_id &&
    !editCategoryOptions.some((category) => category.id === quiz.category_id)
  ) {
    editCategoryOptions.push({
      id: quiz.category_id,
      name: quiz.category_name || `Category ${quiz.category_id}`,
    })
  }

  const questionsColumns = [
    {
      title: "Order",
      dataIndex: "question_order",
      key: "question_order",
      width: 80,
      render: (order: number) => <Tag color="blue">{order}</Tag>,
    },
    {
      title: "Question",
      dataIndex: "question_text",
      key: "question_text",
      ellipsis: true,
      render: (text: string) => <span>{text.substring(0, 100)}...</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type: string) => (
        <Tag color={type === "single_choice" ? "cyan" : "green"}>
          {type === "single_choice" ? "Single Choice" : "Multiple Choice"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_: any, record: QuizQuestion) => (
        <Popconfirm
          title="Remove Question"
          description={
            !isOwnerOrAdmin
              ? mutationLockReason
              : isQuizUsedByCourse
              ? "Cannot remove. This quiz is already used in a course."
              : questions.length <= MIN_QUIZ_QUESTIONS
              ? `Cannot remove. Quiz must keep at least ${MIN_QUIZ_QUESTIONS} questions.`
              : "Are you sure you want to remove this question from the quiz?"
          }
          okText="Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleRemoveQuestion(record.question_id)}
          disabled={
            !isOwnerOrAdmin ||
            isQuizUsedByCourse ||
            questions.length <= MIN_QUIZ_QUESTIONS
          }
        >
          <Tooltip
            title={
              !isOwnerOrAdmin
                ? mutationLockReason
                : isQuizUsedByCourse
                ? "Quiz is used in a course"
                : questions.length <= MIN_QUIZ_QUESTIONS
                ? `Minimum ${MIN_QUIZ_QUESTIONS} questions required`
                : "Remove question"
            }
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ pointerEvents: "auto" }}
              disabled={
                !isOwnerOrAdmin ||
                isQuizUsedByCourse ||
                questions.length <= MIN_QUIZ_QUESTIONS
              }
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ]

  const availableQuestionsOptions = allAvailableQuestions
    .filter((q) => !questions.some((qz) => qz.question_id === q.id))
    .map((q) => ({
      value: q.id,
      label: q.title,
    }))

  const isEditDisabled = isQuizUsedByCourse || !isOwnerOrAdmin
  const isQuestionActionsDisabled = isQuizUsedByCourse || !isOwnerOrAdmin
  const editTooltip = !isOwnerOrAdmin
    ? mutationLockReason
    : isQuizUsedByCourse
      ? t.editDisabledUsedCourse
      : t.editQuiz
  const questionActionsTooltip = !isOwnerOrAdmin
    ? mutationLockReason
    : isQuizUsedByCourse
      ? t.usedInCourseLock
      : undefined

  return (
    <main className="min-h-screen bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button & Header */}
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ padding: 0 }}
          >
            {t.backToQuizManagement}
          </Button>

          {/* Title Section */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {!isEditing ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Title
                        level={2}
                        style={{
                          margin: 0,
                          background:
                            "linear-gradient(to right, rgb(37, 99, 235), rgb(30, 64, 175))",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {quiz.title}
                      </Title>
                      <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                        {categoryName}
                      </Tag>
                    </div>
                    {quiz.description && (
                      <Paragraph
                        style={{
                          fontSize: "16px",
                          color: "#6b7280",
                          marginBottom: "0",
                        }}
                      >
                        {quiz.description}
                      </Paragraph>
                    )}
                  </div>
                  <Tooltip
                    title={editTooltip}
                  >
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={handleEdit}
                      disabled={isEditDisabled}
                      style={{
                        backgroundColor: isEditDisabled
                          ? "#d1d5db"
                          : "#1e40af",
                        borderColor: isEditDisabled
                          ? "#d1d5db"
                          : "#1e40af",
                        color: isEditDisabled ? "#6b7280" : "#ffffff",
                      }}
                    >
                      {t.edit}
                    </Button>
                  </Tooltip>
                </div>

                {/* Quiz Details Grid */}
                <Divider />
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={6}>
                    <Space direction="vertical" size={0}>
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", textTransform: "uppercase" }}
                      >
                        <ClockCircleOutlined /> {t.timeLimit}
                      </Text>
                      <Text strong style={{ fontSize: "18px" }}>
                        {quiz.time_limit_minutes
                          ? `${quiz.time_limit_minutes} min`
                          : t.noLimit}
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Space direction="vertical" size={0}>
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", textTransform: "uppercase" }}
                      >
                        <TrophyOutlined /> {t.passingScore}
                      </Text>
                      <Text strong style={{ fontSize: "18px" }}>
                        {quiz.passing_score}%
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Space direction="vertical" size={0}>
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", textTransform: "uppercase" }}
                      >
                        <NumberOutlined /> {t.maxAttempts}
                      </Text>
                      <Text strong style={{ fontSize: "18px" }}>
                        {quiz.max_attempts}
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Space direction="vertical" size={0}>
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", textTransform: "uppercase" }}
                      >
                        <FileTextOutlined /> {t.questions}
                      </Text>
                      <Text strong style={{ fontSize: "18px" }}>
                        {questions.length}
                      </Text>
                    </Space>
                  </Col>
                </Row>
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={editForm}
              >
                <Form.Item
                  name="title"
                  label={t.quizTitle}
                  rules={[
                    { required: true, message: t.enterQuizTitle },
                  ]}
                >
                  <Input size="large" placeholder={t.enterQuizTitle} />
                </Form.Item>

                <Form.Item
                  name="category_id"
                  label={t.category}
                  rules={[{ required: true, message: t.categoryRequired }]}
                  extra={
                    questions.length > 0
                      ? t.categoryLockedHint
                      : undefined
                  }
                >
                  <Select
                    placeholder={t.selectCategory}
                    options={editCategoryOptions.map((category) => ({
                      label: category.name,
                      value: category.id,
                    }))}
                    disabled={questions.length > 0}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Form.Item name="description" label={t.description}>
                  <Input.TextArea
                    rows={4}
                    placeholder={t.enterDescriptionOptional}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="time_limit_minutes"
                      label={t.timeLimitMinutes}
                    >
                      <InputNumber
                        min={0}
                        placeholder={t.leaveBlankNoLimit}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="passing_score"
                      label={t.passingScorePercent}
                      rules={[
                        {
                          required: true,
                          message: t.enterPassingScore,
                        },
                      ]}
                    >
                      <InputNumber min={0} max={100} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="max_attempts"
                  label={t.maximumAttempts}
                  rules={[
                    { required: true, message: t.enterMaxAttempts },
                  ]}
                >
                  <InputNumber min={1} />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSaving}
                    icon={<SaveOutlined />}
                    style={{
                      backgroundColor: "#1e40af",
                      borderColor: "#1e40af",
                    }}
                  >
                    {t.save}
                  </Button>
                  <Button onClick={handleCancel} icon={<CloseOutlined />}>
                    {t.cancel}
                  </Button>
                </Space>
              </Form>
            )}
          </div>

          {/* Questions Section */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                {t.questions} ({questions.length})
              </Title>
              <Space size="small">
                <Tooltip
                  title={
                    questionActionsTooltip ||
                    (isQuestionActionsDisabled
                      ? t.actionDisabled
                      : t.addQuestionsFromBank)
                  }
                >
                  <span style={{ display: "inline-block" }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setIsAddingQuestions(true)}
                      disabled={isQuestionActionsDisabled}
                      style={{
                        backgroundColor: isQuestionActionsDisabled
                          ? "#d1d5db"
                          : "#1e40af",
                        borderColor: isQuestionActionsDisabled
                          ? "#d1d5db"
                          : "#1e40af",
                        color: isQuestionActionsDisabled ? "#6b7280" : "#ffffff",
                      }}
                    >
                      {t.addQuestionsFromBank}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    questionActionsTooltip ||
                    (isQuestionActionsDisabled
                      ? t.actionDisabled
                      : t.createQuestion)
                  }
                >
                  <span style={{ display: "inline-block" }}>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={handleOpenCreateQuestionModal}
                      disabled={isQuestionActionsDisabled}
                    >
                      {t.createQuestion}
                    </Button>
                  </span>
                </Tooltip>
              </Space>
            </div>

            {questions.length === 0 ? (
              <Empty
                description={t.noQuestionsYet}
                style={{ marginTop: "32px", marginBottom: "32px" }}
              >
                <Button
                  type="primary"
                  onClick={() => setIsAddingQuestions(true)}
                  style={{
                    backgroundColor: "#1e40af",
                    borderColor: "#1e40af",
                  }}
                >
                  {t.addFirstQuestion}
                </Button>
              </Empty>
            ) : (
              <Table
                columns={questionsColumns}
                dataSource={questions.map((q) => ({
                  ...q,
                  key: q.quiz_question_id,
                }))}
                pagination={false}
                size="middle"
              />
            )}
          </div>
        </Space>
      </div>

      {/* Add Questions Modal */}
      <Modal
        title={t.addQuestionsModalTitle}
        open={isAddingQuestions}
        onCancel={() => {
          setIsAddingQuestions(false)
          addQuestionsForm.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsAddingQuestions(false)
              addQuestionsForm.resetFields()
            }}
          >
            {t.cancel}
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => addQuestionsForm.submit()}
            style={{
              backgroundColor: "#1e40af",
              borderColor: "#1e40af",
            }}
          >
            {t.add}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={addQuestionsForm}
          layout="vertical"
          onFinish={handleAddQuestions}
        >
          <Form.Item
            name="question_ids"
            label={t.selectQuestions}
            rules={[
              {
                required: true,
                message: t.selectAtLeastOneQuestion,
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t.selectQuestionsToAdd}
              options={availableQuestionsOptions}
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t.createQuestionModalTitle}
        open={isCreateQuestionModalVisible}
        onCancel={() => setIsCreateQuestionModalVisible(false)}
        onOk={handleCreateQuestionSubmit}
        okText={t.createAndAdd}
        cancelText={t.cancel}
        confirmLoading={isCreatingQuestion}
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
            {t.categoryLabel} <strong>{categoryName}</strong>
          </div>

          <Input.TextArea
            placeholder={t.enterQuestionContent}
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
              <div key={index} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <span className="w-6 text-center font-semibold">
                  {String.fromCharCode(65 + index)}
                </span>
                <Input
                  value={optionText}
                  onChange={(e) => handleCreateOptionChange(e.target.value, index)}
                  placeholder={t.optionLabel(String.fromCharCode(65 + index))}
                />
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
            ))}
          </div>

          <div className="pb-2">
            <Input.TextArea
              placeholder={t.explanationOptional}
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={2000}
              showCount
            />
          </div>
        </div>
      </Modal>
    </main>
  )
}
