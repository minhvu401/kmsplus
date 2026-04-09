"use client"

import { useState } from "react"
import { Card, Row, Col, Typography, Space, Button, Tag, message } from "antd"
const { Title, Text, Paragraph } = Typography
import type { AttemptResult, QuestionResult } from "@/service/quiz.service"
import AIExplanationButton from "./AIExplanationButton"
import { useRouter } from "next/navigation"
import { startQuizAttempt } from "@/action/quiz/quizActions"
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import useLanguageStore from "@/store/useLanguageStore"

const normalizeArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === "object" && v !== null && "correct" in v) {
    const correct = (v as { correct: unknown }).correct
    return Array.isArray(correct) ? correct.map(String) : [String(correct)]
  }
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v)
      if (parsed?.correct !== undefined) {
        return Array.isArray(parsed.correct) ? parsed.correct : [parsed.correct]
      }
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch {
      return [v]
    }
  }
  if (typeof v === "number") return [String(v)]
  return []
}

const parseOptions = (opts: unknown): [string, string][] => {
  if (typeof opts === "string") {
    try {
      opts = JSON.parse(opts)
    } catch {
      return []
    }
  }
  if (typeof opts === "object" && opts !== null && !Array.isArray(opts)) {
    return Object.entries(opts) as [string, string][]
  }
  if (Array.isArray(opts)) {
    return opts.map(
      (opt, idx) =>
        [String.fromCharCode(65 + idx), String(opt)] as [string, string]
    )
  }
  return []
}

// Evaluate if a question is correct
const isQuestionCorrect = (q: QuestionResult) => {
  const selected = normalizeArray(q.selectedAnswers).sort()
  const correct = normalizeArray(q.correctAnswers).sort()
  return JSON.stringify(selected) === JSON.stringify(correct)
}

export default function QuizResult({
  result,
  curriculumItemId,
  courseId,
  attemptsLeft,
  maxAttempts,
}: {
  result: AttemptResult
  curriculumItemId?: number
  courseId?: number
  attemptsLeft?: number | null
  maxAttempts?: number | null
}) {
  const { language } = useLanguageStore()
  const t = {
    cannotRetry:
      language === "vi"
        ? "Không thể làm lại bài kiểm tra: ID không hợp lệ"
        : "Cannot retry quiz: Invalid quiz ID",
    reachedMaxAttempts:
      language === "vi"
        ? "Bạn đã đạt số lần làm tối đa cho bài kiểm tra này"
        : "You have reached the maximum number of attempts for this quiz",
    failedStartAttempt:
      language === "vi"
        ? "Không thể bắt đầu lần làm bài"
        : "Failed to start quiz attempt",
    backToSummary:
      language === "vi" ? "Quay lại tổng quan" : "Back to Summary",
    passed: language === "vi" ? "Đạt" : "Passed",
    failed: language === "vi" ? "Không đạt" : "Failed",
    score: language === "vi" ? "Điểm" : "Score",
    congratulations: language === "vi" ? "Chúc mừng!" : "Congratulations!",
    completedTitle:
      language === "vi" ? "Đã hoàn thành bài kiểm tra" : "Quiz Completed",
    completedSubtitle:
      language === "vi"
        ? "Bạn đã hoàn thành bài"
        : "You have completed the",
    reviewDetailed:
      language === "vi"
        ? "Xem chi tiết đáp án"
        : "Review Detailed Answers",
    retryQuiz: language === "vi" ? "Làm lại" : "Retry Quiz",
    left: language === "vi" ? "còn lại" : "left",
    status: language === "vi" ? "Trạng thái" : "Status",
    passedCaps: language === "vi" ? "ĐẠT" : "PASSED",
    failedCaps: language === "vi" ? "KHÔNG ĐẠT" : "FAILED",
    totalScore: language === "vi" ? "Tổng điểm" : "Total Score",
    performance: language === "vi" ? "Hiệu suất" : "Performance",
    correct: language === "vi" ? "Đúng" : "Correct",
    incorrect: language === "vi" ? "Sai" : "Incorrect",
    timeTaken: language === "vi" ? "Thời gian làm bài" : "Time Taken",
  }

  const [showDetails, setShowDetails] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const router = useRouter()

  const displayScore = Number.isInteger(result.score)
    ? String(result.score)
    : result.score.toFixed(1)

  // Calculate stats
  const totalQuestions = result.questions.length
  const correctCount = result.questions.filter(isQuestionCorrect).length
  const incorrectCount = totalQuestions - correctCount
  const passingScore = result.passing_score ?? 50
  const isPassed = result.score >= passingScore

  // Formatting time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return language === "vi" ? `${seconds} giây` : `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (language === "vi") {
      return s > 0 ? `${m} phút ${s} giây` : `${m} phút`
    }
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }

  // Handler retry quiz
  const handleRetryQuiz = async () => {
    if (!curriculumItemId) {
      message.error(t.cannotRetry)
      return
    }

    if (
      attemptsLeft !== null &&
      attemptsLeft !== undefined &&
      attemptsLeft <= 0
    ) {
      message.error(
        t.reachedMaxAttempts
      )
      return
    }

    setIsRetrying(true)
    try {
      const newAttempt = await startQuizAttempt(curriculumItemId)
      if (newAttempt?.id && courseId) {
        router.push(`/courses/${courseId}/learning/attempt/${newAttempt.id}`)
      } else {
        message.error(t.failedStartAttempt)
      }
    } catch (error) {
      console.error(error)
      message.error((error as Error).message || t.failedStartAttempt)
    } finally {
      setIsRetrying(false)
    }
  }

  if (showDetails) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
        {/* Header for Detail View */}
        <div
          style={{
            background: "#fff",
            padding: "16px 24px",
            borderRadius: 12,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Space direction="vertical" size={2}>
            <Title level={4} style={{ margin: 0 }}>
              {result.title}
            </Title>
            <Space>
              <Tag color={isPassed ? "success" : "error"}>
                {isPassed ? t.passed : t.failed}
              </Tag>
              <Text type="secondary">{t.score}: {displayScore}/100</Text>
            </Space>
          </Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setShowDetails(false)}
          >
            {t.backToSummary}
          </Button>
        </div>

        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {result.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i + 1}
              total={totalQuestions}
              attemptId={result.id || 0}
            />
          ))}

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Button size="large" onClick={() => setShowDetails(false)}>
              {t.backToSummary}
            </Button>
          </div>
        </Space>
      </div>
    )
  }

  // Summary View
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1677ff 0%, #0050b3 100%)", // Blue primary
          borderRadius: 16,
          padding: "40px 32px",
          color: "white",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(22, 119, 255, 0.2)",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <Space direction="vertical" size={8}>
              <Tag
                color="rgba(255,255,255,0.2)"
                style={{ color: "white", border: "none" }}
              >
                Attempt #{result.attempt_number}
              </Tag>
              <Title
                level={1}
                style={{ color: "white", margin: 0, fontSize: 32 }}
              >
                {isPassed ? t.congratulations : t.completedTitle}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>
                {t.completedSubtitle} <strong>{result.title}</strong>
                {language === "vi" ? "." : " quiz."}
              </Text>
            </Space>
          </div>
          <div>
            <Button
              size="large"
              style={{
                height: 48,
                borderRadius: 24,
                paddingLeft: 32,
                paddingRight: 32,
                border: "none",
                fontWeight: 600,
                color: "#1677ff", // Blue text
              }}
              icon={<EyeOutlined />}
              onClick={() => setShowDetails(true)}
            >
              {t.reviewDetailed}
            </Button>
            {curriculumItemId &&
              (attemptsLeft === null ||
                (attemptsLeft !== undefined && attemptsLeft > 0)) && (
                <Button
                  size="large"
                  loading={isRetrying}
                  style={{
                    height: 48,
                    borderRadius: 24,
                    paddingLeft: 32,
                    paddingRight: 32,
                    border: "none",
                    fontWeight: 600,
                    marginLeft: 12,
                    background: "#52c41a",
                    color: "white",
                  }}
                  icon={<ReloadOutlined />}
                  onClick={handleRetryQuiz}
                >
                  {t.retryQuiz}
                  {attemptsLeft !== null && attemptsLeft !== undefined && (
                    <span> ({attemptsLeft} {t.left})</span>
                  )}
                </Button>
              )}
          </div>
        </div>

        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={6}>
          <Card
            variant="borderless"
            style={{
              height: "100%",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              {isPassed ? (
                <CheckCircleFilled
                  style={{ fontSize: 36, color: "#52c41a", marginBottom: 16 }}
                />
              ) : (
                <CloseCircleFilled
                  style={{ fontSize: 36, color: "#ff4d4f", marginBottom: 16 }}
                />
              )}
              <Text
                type="secondary"
                style={{
                  textTransform: "uppercase",
                  fontSize: 12,
                  letterSpacing: "1px",
                }}
              >
                {t.status}
              </Text>
              <Title
                level={3}
                style={{
                  margin: "4px 0 0",
                  color: isPassed ? "#52c41a" : "#ff4d4f",
                }}
              >
                {isPassed ? t.passedCaps : t.failedCaps}
              </Title>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card
            variant="borderless"
            style={{
              height: "100%",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <PercentageOutlined
                  style={{ fontSize: 36, color: "#1677ff" }}
                />
              </div>
              <Text
                type="secondary"
                style={{
                  textTransform: "uppercase",
                  fontSize: 12,
                  letterSpacing: "1px",
                }}
              >
                {t.totalScore}
              </Text>
              <Space align="baseline" style={{ marginTop: 4 }}>
                <Title level={3} style={{ margin: 0, color: "#1677ff" }}>
                  {displayScore}
                </Title>
                <Text type="secondary">/ 100</Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card
            variant="borderless"
            style={{
              height: "100%",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <TrophyOutlined
                style={{ fontSize: 36, color: "#52c41a", marginBottom: 16 }}
              />
              <Text
                type="secondary"
                style={{
                  textTransform: "uppercase",
                  fontSize: 12,
                  letterSpacing: "1px",
                }}
              >
                {t.performance}
              </Text>
              <Space align="baseline" style={{ marginTop: 4 }}>
                <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                  {correctCount}
                </Title>
                <Text type="secondary">/ {totalQuestions} {t.correct}</Text>
              </Space>
              <Text type="danger" style={{ fontSize: 12, marginTop: 4 }}>
                {incorrectCount} {t.incorrect}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card
            variant="borderless"
            style={{
              height: "100%",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <ClockCircleOutlined
                style={{ fontSize: 36, color: "#1677ff", marginBottom: 16 }}
              />
              <Text
                type="secondary"
                style={{
                  textTransform: "uppercase",
                  fontSize: 12,
                  letterSpacing: "1px",
                }}
              >
                {t.timeTaken}
              </Text>
              <Title level={3} style={{ margin: "4px 0 0" }}>
                {formatTime(result.time_spent_seconds)}
              </Title>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

function QuestionCard({
  question,
  index,
  total,
  attemptId,
}: {
  question: QuestionResult
  index: number
  total: number
  attemptId: number
}) {
  const { language } = useLanguageStore()
  const t = {
    question: language === "vi" ? "Câu" : "Question",
    of: language === "vi" ? "trên" : "of",
    correct: language === "vi" ? "Đúng" : "Correct",
    incorrect: language === "vi" ? "Sai" : "Incorrect",
    yourAnswer: language === "vi" ? "Đáp án của bạn" : "Your Answer",
    instructorFeedback:
      language === "vi" ? "Nhận xét giảng viên" : "Instructor Feedback",
    correctAnswerPrefix:
      language === "vi" ? "Đáp án đúng là" : "The correct answer is",
  }

  const isCorrect = isQuestionCorrect(question)
  const optionsList = parseOptions(question.options)
  const selectedAnswers = normalizeArray(question.selectedAnswers)
  const correctAnswers = normalizeArray(question.correctAnswers)

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        overflow: "hidden",
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Text
            type="secondary"
            style={{
              fontWeight: 600,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t.question} {index} {t.of} {total}
          </Text>
          <Tag
            icon={isCorrect ? <CheckCircleFilled /> : <CloseCircleFilled />}
            color={isCorrect ? "success" : "error"}
          >
            {isCorrect ? t.correct : t.incorrect}
          </Tag>
        </div>

        <Paragraph style={{ fontSize: 16, fontWeight: 500, marginBottom: 24 }}>
          {question.questionText}
        </Paragraph>

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {optionsList.map(([key, text]) => {
            const isSelected = selectedAnswers.includes(key)
            const isRightAnswer = correctAnswers.includes(key)

            // Determine styling based on state
            let borderColor = "#f0f0f0"
            let bgColor = "transparent"
            let icon = (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "2px solid #d9d9d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <span style={{ fontSize: 10, color: "#8c8c8c" }}>{key}</span>
              </div>
            )
            let textColor = "inherit"

            if (isRightAnswer) {
              borderColor = "#b7eb8f" // Light green border
              bgColor = "#f6ffed" // Light green bg
              icon = (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#52c41a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <CheckOutlined style={{ color: "white", fontSize: 12 }} />
                </div>
              )
            } else if (isSelected && !isRightAnswer) {
              borderColor = "#ffa39e" // Light red border
              bgColor = "#fff1f0" // Light red bg
              icon = (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#ff4d4f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <CloseOutlined style={{ color: "white", fontSize: 12 }} />
                </div>
              )
            }

            return (
              <div
                key={key}
                style={{
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                {icon}
                <Text style={{ flex: 1, color: textColor }}>{text}</Text>
                {isSelected && !isRightAnswer && (
                  <Text type="danger" style={{ fontSize: 12, fontWeight: 600 }}>
                    {t.yourAnswer}
                  </Text>
                )}
                {isSelected && isRightAnswer && (
                  <Text
                    type="success"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {t.yourAnswer}
                  </Text>
                )}
              </div>
            )
          })}
        </Space>
      </div>

      {/* Explanation Section */}
      {(question.explanation || !isCorrect) && (
        <div
          style={{
            background: "#f8fafd",
            borderTop: "1px solid #f0f0f0",
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <Space size={8} style={{ marginBottom: 8 }}>
                <SafetyCertificateOutlined style={{ color: "#1677ff" }} />
                <Text strong style={{ color: "#1677ff" }}>
                  {t.instructorFeedback}
                </Text>
              </Space>
              <Paragraph style={{ margin: 0, color: "#595959" }}>
                {question.explanation ? (
                  question.explanation
                ) : (
                  <>
                    {t.correctAnswerPrefix}{" "}
                    <strong>{correctAnswers.join(", ")}</strong>.
                  </>
                )}
              </Paragraph>
            </div>
            <div>
              <AIExplanationButton
                attemptId={attemptId}
                questionId={question.id}
                questionText={question.questionText}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
