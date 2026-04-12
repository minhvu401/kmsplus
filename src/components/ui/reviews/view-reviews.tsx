"use client"

import type { ReviewWithUser } from "@/service/review.service"
import { Avatar, Rate, Table, Typography } from "antd"
import type { TableProps } from "antd"
import { UserOutlined } from "@ant-design/icons"
import useLanguageStore from "@/store/useLanguageStore"

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
  const { language } = useLanguageStore()

  const columns: TableProps<ReviewWithUser>["columns"] = [
    {
      title: language === "vi" ? "Người dùng" : "User",
      key: "user",
      width: 200,
      render: () => (
        <div className="flex items-center gap-2">
          <Avatar size={28} icon={<UserOutlined />} />
          <Text>{language === "vi" ? "Ẩn danh" : "Anonymous"}</Text>
        </div>
      ),
    },
    {
      title: language === "vi" ? "Đánh giá" : "Rating",
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
      title: language === "vi" ? "Phản hồi" : "Feedback",
      dataIndex: "content",
      key: "content",
      render: (content: string | null) => (
        <Text className="whitespace-pre-wrap text-gray-700">
          {content?.trim() || (language === "vi" ? "Không có nội dung phản hồi" : "No feedback content")}
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
      locale={{
        emptyText:
          language === "vi" ? "Không tìm thấy phản hồi" : "No feedback found",
      }}
    />
  )
}
