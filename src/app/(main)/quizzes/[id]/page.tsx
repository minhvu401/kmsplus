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
  getQuizQuestions,
  updateQuizQuestions,
  updateQuizMetadata,
} from "@/action/quiz/quizActions"
import {
  getQuestionsByCategory,
  getAllQuestions,
} from "@/action/question-bank/questionBankActions"
import { getCourseById } from "@/action/courses/courseAction"
import type { Quiz } from "@/service/quiz.service"

const { Title, Text, Paragraph } = Typography

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

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [allAvailableQuestions, setAllAvailableQuestions] = useState<
    QuestionOption[]
  >([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingQuestions, setIsAddingQuestions] = useState(false)
  const [form] = Form.useForm()
  const [addQuestionsForm] = Form.useForm()

  // Edit form initial values
  const [editForm, setEditForm] = useState({
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

  useEffect(() => {
    loadQuizData()
  }, [quizId])

  const loadQuizData = async () => {
    try {
      setLoading(true)
      console.log("🟦 [loadQuizData] Starting with quizId:", quizId)

      const quizData = await getQuizById(quizId)
      console.log("🟦 [loadQuizData] Quiz data fetched:", quizData)

      if (!quizData) {
        console.error("🔴 [loadQuizData] Quiz not found")
        message.error("Quiz not found")
        router.push("/quizzes")
        return
      }

      setQuiz(quizData)
      setEditForm({
        title: quizData.title,
        description: quizData.description || "",
        time_limit_minutes: quizData.time_limit_minutes,
        passing_score: quizData.passing_score,
        max_attempts: quizData.max_attempts,
      })

      const questionsData = await getQuizQuestions(quizId)
      console.log("🟦 [loadQuizData] Quiz questions fetched:", questionsData)
      setQuestions(questionsData as any)

      // Load course info to get category_id
      console.log(
        "🟦 [loadQuizData] Fetching course data with course_id:",
        quizData.course_id
      )
      const courseData = await getCourseById(quizData.course_id)
      console.log("🟦 [loadQuizData] Course data fetched:", courseData)

      let availableQuestions: QuestionOption[] = []

      if (courseData && courseData.category_id) {
        console.log(
          "🟦 [loadQuizData] Loading questions by category_id:",
          courseData.category_id
        )
        // Load questions filtered by course's category
        const categoryQuestions = await getQuestionsByCategory(
          courseData.category_id
        )
        console.log(
          "🟦 [loadQuizData] Questions by category fetched:",
          categoryQuestions
        )
        console.log(
          "🟦 [loadQuizData] Current question count:",
          categoryQuestions?.length || 0
        )

        availableQuestions = (categoryQuestions || []).map((q: any) => ({
          id: q.id,
          title: q.question_text,
          category_name: q.category_name,
          type: q.type as "single_choice" | "multiple_choice",
        }))
        console.log(
          "🟦 [loadQuizData] Processed available questions:",
          availableQuestions.length
        )
      } else {
        console.warn(
          "🟡 [loadQuizData] No category_id found, loading all available questions"
        )
        console.log("🟡 [loadQuizData] CourseData:", courseData)
        // Load all questions as fallback when category_id is not available
        const allQuestions = await getAllQuestions()
        console.log(
          "🟦 [loadQuizData] All questions fetched:",
          allQuestions?.length || 0
        )

        availableQuestions = (allQuestions || []).map((q: any) => ({
          id: q.id,
          title: q.question_text,
          category_name: q.category_name,
          type: q.type as "single_choice" | "multiple_choice",
        }))
        console.log(
          "🟦 [loadQuizData] Processed all available questions:",
          availableQuestions.length
        )
      }

      console.log(
        "🟦 [loadQuizData] Setting allAvailableQuestions with",
        availableQuestions.length,
        "items"
      )
      setAllAvailableQuestions(availableQuestions)
    } catch (error) {
      console.error("🔴 [loadQuizData] Error loading quiz:", error)
      message.error("Failed to load quiz details")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    form.setFieldsValue(editForm)
  }

  const handleSave = async (values: any) => {
    try {
      setIsSaving(true)

      // Optimistic update: Update UI immediately
      const updatedQuiz = { ...quiz, ...values } as Quiz
      setQuiz(updatedQuiz)
      setEditForm(values)
      setIsEditing(false)
      message.success("Quiz updated successfully")

      // Then save to server in background
      await updateQuizMetadata(quizId, {
        title: values.title,
        description: values.description,
        time_limit_minutes: values.time_limit_minutes,
        passing_score: values.passing_score,
        max_attempts: values.max_attempts,
      })
    } catch (error) {
      console.error("Error updating quiz:", error)
      // Revert to previous state on error
      setEditForm(quiz as any)
      message.error("Failed to update quiz")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.resetFields()
  }

  const handleAddQuestions = async (values: any) => {
    try {
      console.log("🟦 [handleAddQuestions] Starting with values:", values)
      console.log(
        "🟦 [handleAddQuestions] Available questions:",
        allAvailableQuestions
      )
      console.log("🟦 [handleAddQuestions] Current quiz questions:", questions)

      const newQuestionIds = values.question_ids || []
      console.log(
        "🟦 [handleAddQuestions] New question IDs to add:",
        newQuestionIds
      )

      const currentQuestionIds = questions.map((q) => q.question_id)
      console.log(
        "🟦 [handleAddQuestions] Current question IDs:",
        currentQuestionIds
      )

      const allQuestionIds = [...currentQuestionIds, ...newQuestionIds]
      console.log(
        "🟦 [handleAddQuestions] All question IDs after merge:",
        allQuestionIds
      )

      // Get the new questions data to add to the list
      const newQuestionsData = allAvailableQuestions.filter((q) =>
        newQuestionIds.includes(q.id)
      )
      console.log(
        "🟦 [handleAddQuestions] New questions data filtered:",
        newQuestionsData
      )

      // Optimistic update: Add questions to the list immediately
      const nextOrder =
        Math.max(...questions.map((q) => q.question_order), 0) + 1
      console.log("🟦 [handleAddQuestions] Next order:", nextOrder)

      const newQuestions = newQuestionsData.map((q, index) => ({
        quiz_question_id: Date.now() + index, // Temporary ID
        question_id: q.id,
        question_order: nextOrder + index,
        question_text: q.title,
        type: "single_choice" as const,
      }))
      console.log(
        "🟦 [handleAddQuestions] New questions constructed:",
        newQuestions
      )

      setQuestions([...questions, ...newQuestions])
      message.success("Questions added successfully")
      setSelectedQuestionsToAdd([])
      addQuestionsForm.resetFields()
      setIsAddingQuestions(false)

      console.log(
        "🟦 [handleAddQuestions] Calling updateQuizQuestions with:",
        allQuestionIds
      )
      // Then save to server in background
      await updateQuizQuestions(quizId, allQuestionIds)
      console.log(
        "🟦 [handleAddQuestions] updateQuizQuestions completed successfully"
      )
    } catch (error) {
      console.error("🔴 [handleAddQuestions] Error adding questions:", error)
      message.error("Failed to add questions")
      // Reload to revert optimistic update
      loadQuizData()
    }
  }

  const handleRemoveQuestion = async (
    quizQuestionId: number,
    questionId: number
  ) => {
    Modal.confirm({
      title: "Remove Question",
      content: "Are you sure you want to remove this question from the quiz?",
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          // Optimistic update: Remove question from list immediately
          const updatedQuestions = questions.filter(
            (q) => q.question_id !== questionId
          )
          setQuestions(updatedQuestions)
          message.success("Question removed successfully")

          const remainingQuestionIds = updatedQuestions.map(
            (q) => q.question_id
          )

          // Then save to server in background
          await updateQuizQuestions(quizId, remainingQuestionIds)
        } catch (error) {
          console.error("Error removing question:", error)
          message.error("Failed to remove question")
          // Reload to revert optimistic update
          loadQuizData()
        }
      },
    })
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
      </div>
    )
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
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() =>
            handleRemoveQuestion(record.quiz_question_id, record.question_id)
          }
          style={{ pointerEvents: "auto" }}
        />
      ),
    },
  ]

  const availableQuestionsOptions = allAvailableQuestions
    .filter((q) => !questions.some((qz) => qz.question_id === q.id))
    .map((q) => ({
      value: q.id,
      label: q.title,
    }))

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
            Back to Quiz Management
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
                    <Title
                      level={2}
                      style={{
                        margin: "0 0 12px 0",
                        background:
                          "linear-gradient(to right, rgb(37, 99, 235), rgb(30, 64, 175))",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {quiz.title}
                    </Title>
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
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    style={{
                      backgroundColor: "#1e40af",
                      borderColor: "#1e40af",
                    }}
                  >
                    Edit
                  </Button>
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
                        <ClockCircleOutlined /> Time Limit
                      </Text>
                      <Text strong style={{ fontSize: "18px" }}>
                        {quiz.time_limit_minutes
                          ? `${quiz.time_limit_minutes} min`
                          : "No Limit"}
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Space direction="vertical" size={0}>
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", textTransform: "uppercase" }}
                      >
                        <TrophyOutlined /> Passing Score
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
                        <NumberOutlined /> Max Attempts
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
                        <FileTextOutlined /> Questions
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
                  label="Quiz Title"
                  rules={[
                    { required: true, message: "Please enter quiz title" },
                  ]}
                >
                  <Input size="large" placeholder="Enter quiz title" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                  <Input.TextArea
                    rows={4}
                    placeholder="Enter quiz description (optional)"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="time_limit_minutes"
                      label="Time Limit (minutes)"
                    >
                      <InputNumber
                        min={0}
                        placeholder="Leave blank for no limit"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="passing_score"
                      label="Passing Score (%)"
                      rules={[
                        {
                          required: true,
                          message: "Please enter passing score",
                        },
                      ]}
                    >
                      <InputNumber min={0} max={100} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="max_attempts"
                  label="Maximum Attempts"
                  rules={[
                    { required: true, message: "Please enter max attempts" },
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
                    Save
                  </Button>
                  <Button onClick={handleCancel} icon={<CloseOutlined />}>
                    Cancel
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
                Questions ({questions.length})
              </Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddingQuestions(true)}
                style={{
                  backgroundColor: "#1e40af",
                  borderColor: "#1e40af",
                }}
              >
                Add Questions
              </Button>
            </div>

            {questions.length === 0 ? (
              <Empty
                description="No questions added yet"
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
                  Add First Question
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
        title="Add Questions to Quiz"
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
            Cancel
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
            Add
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
            label="Select Questions"
            rules={[
              {
                required: true,
                message: "Please select at least one question",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select questions to add"
              options={availableQuestionsOptions}
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}
