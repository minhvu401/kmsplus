"use client"

import type { ReviewWithUser } from "@/service/review.service"
import { Avatar, Rate, Table, Typography } from "antd"
import type { TableProps } from "antd"
import { UserOutlined } from "@ant-design/icons"

const { Text } = Typography

function formatRating(value: number) {
  return Number(value).toFixed(1)
}

function normalizeRating(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value)
  const safeValue = Number.isFinite(parsed) ? parsed : 0
  const clamped = Math.max(0, Math.min(5, safeValue))
  return Math.round(clamped * 2) / 2
}

function getVisibleStarCount(value: number) {
  return Math.max(1, Math.min(5, Math.ceil(Number(value))))
}

export default function ViewReviewsTable({
  reviews,
}: {
  reviews: ReviewWithUser[]
}) {
  const columns: TableProps<ReviewWithUser>["columns"] = [
    {
      title: "User",
      key: "user",
      width: 200,
      render: () => (
        <div className="flex items-center gap-2">
          <Avatar size={28} icon={<UserOutlined />} />
          <Text>Anonymous</Text>
        </div>
      ),
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 220,
      render: (rating: number) => {
        const normalizedRating = normalizeRating(rating)

        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Rate
              allowHalf
              disabled
              value={normalizedRating}
              count={getVisibleStarCount(normalizedRating)}
            />
            <Text className="font-medium">{formatRating(normalizedRating)}</Text>
          </div>
        )
      },
    },
    {
      title: "Feedback",
      dataIndex: "content",
      key: "content",
      render: (content: string | null) => (
        <Text className="whitespace-pre-wrap text-gray-700">
          {content?.trim() || "No feedback content"}
        </Text>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={reviews}
      rowKey="id"
      pagination={false}
      scroll={{ x: 980 }}
      locale={{ emptyText: "No feedback found" }}
    />
  )
}
