"use client"

import Link from "next/link"
import { Card, Empty, Progress, Space, Tag, Typography } from "antd"
import { ArrowRightOutlined, MessageOutlined } from "@ant-design/icons"
import type { AttemptHistoryItem } from "@/service/quiz.service"
import useLanguageStore from "@/store/useLanguageStore"

const { Title, Text } = Typography

type AttemptHistoryProps = {
  courseId: number
  attempts: AttemptHistoryItem[]
  attemptsLeft: number | null
  maxAttempts: number | null
}

type AttemptLabels = {
  title: string
  attemptsLeftSuffix: string
  noAttempts: string
  attemptLabel: string
  feedback: string
  passed: string
  failed: string
  inProgress: string
}

const getStatusTag = (status: AttemptHistoryItem["status"], labels: AttemptLabels) => {
  if (status === "passed") return <Tag color="success">{labels.passed}</Tag>
  if (status === "failed") return <Tag color="error">{labels.failed}</Tag>
  return <Tag color="processing">{labels.inProgress}</Tag>
}

const getProgressColor = (status: AttemptHistoryItem["status"]) => {
  if (status === "passed") return "#52c41a"
  if (status === "failed") return "#ff4d4f"
  return "#1677ff"
}

export default function AttemptHistory({
  courseId,
  attempts,
  attemptsLeft,
  maxAttempts,
}: AttemptHistoryProps) {
  const isLastAttemptWarning = attemptsLeft === 1

  const { language } = useLanguageStore()

  const labels: AttemptLabels = {
    title: language === "vi" ? "Lịch sử làm bài" : "Attempt History",
    attemptsLeftSuffix: language === "vi" ? "lần làm" : "attempts left",
    noAttempts: language === "vi" ? "Chưa có lượt làm nào" : "No attempts yet",
    attemptLabel: language === "vi" ? "Lần làm" : "Attempt",
    feedback: language === "vi" ? "Phản hồi" : "Feedback",
    passed: language === "vi" ? "Đạt" : "Passed",
    failed: language === "vi" ? "Thất bại" : "Failed",
    inProgress: language === "vi" ? "Đang làm" : "In Progress",
  }

  const attemptsLeftText =
    maxAttempts != null && attemptsLeft != null
      ? `${attemptsLeft}/${maxAttempts} ${language === "vi" ? "lần làm" : "attempts left"}`
      : `${attempts.length}/${attempts.length} ${language === "vi" ? "lần" : "attempts left"}`

  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
      styles={{ body: { padding: 20 } }}
    >
      <div className="flex items-center justify-between gap-3">
        <Title level={5} style={{ margin: 0 }}>
          {labels.title}
        </Title>
        <Text
          type={isLastAttemptWarning ? undefined : "secondary"}
          style={isLastAttemptWarning ? { color: "#ff4d4f", fontWeight: 600 } : undefined}
        >
          {attemptsLeftText}
        </Text>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {attempts.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={labels.noAttempts}
          />
        ) : (
          attempts.map((attempt) => {
            const scorePercent = Math.max(0, Math.min(100, Number(attempt.score ?? 0)))

            return (
              <div
                key={attempt.id}
                className="rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Progress
                    type="circle"
                    percent={scorePercent}
                    size={56}
                    strokeColor={getProgressColor(attempt.status)}
                    format={(percent) => `${percent}%`}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">
                      {labels.attemptLabel} #{attempt.attempt_number}
                    </div>
                    <div className="mt-1">{getStatusTag(attempt.status, labels)}</div>
                  </div>
                </div>

                {attempt.status !== "in_progress" && (
                  <Link
                    href={`/courses/${courseId}/learning/attempt/${attempt.id}/result`}
                    className="inline-flex items-center gap-1 text-blue-600 font-medium whitespace-nowrap"
                  >
                    <MessageOutlined />
                    <span>{labels.feedback}</span>
                    <ArrowRightOutlined />
                  </Link>
                )}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
