"use client"

import Link from "next/link"
import { Card, Empty, Progress, Space, Tag, Typography } from "antd"
import { ArrowRightOutlined, MessageOutlined } from "@ant-design/icons"
import type { AttemptHistoryItem } from "@/service/quiz.service"

const { Title, Text } = Typography

type AttemptHistoryProps = {
  courseId: number
  attempts: AttemptHistoryItem[]
  attemptsLeft: number | null
  maxAttempts: number | null
}

const getStatusTag = (status: AttemptHistoryItem["status"]) => {
  if (status === "passed") return <Tag color="success">Passed</Tag>
  if (status === "failed") return <Tag color="error">Failed</Tag>
  return <Tag color="processing">In Progress</Tag>
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

  const attemptsLeftText =
    maxAttempts != null && attemptsLeft != null
      ? `${attemptsLeft}/${maxAttempts} attempts left`
      : `${attempts.length}/${attempts.length} attempts left`

  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
      styles={{ body: { padding: 20 } }}
    >
      <div className="flex items-center justify-between gap-3">
        <Title level={5} style={{ margin: 0 }}>
          Attempt History
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
            description="No attempts yet"
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
                      Attempt #{attempt.attempt_number}
                    </div>
                    <div className="mt-1">{getStatusTag(attempt.status)}</div>
                  </div>
                </div>

                {attempt.status !== "in_progress" && (
                  <Link
                    href={`/courses/${courseId}/learning/attempt/${attempt.id}/result`}
                    className="inline-flex items-center gap-1 text-blue-600 font-medium whitespace-nowrap"
                  >
                    <MessageOutlined />
                    <span>Feedback</span>
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
