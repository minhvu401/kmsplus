"use client"

import { deactivateReviewByManager } from "@/action/reviews/reviewActions"
import type { ReviewWithUser } from "@/service/review.service"
import { Avatar, Button, message, Modal, Rate, Table, Tag, Typography } from "antd"
import type { TableProps } from "antd"
import { StopOutlined, UserOutlined } from "@ant-design/icons"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import useLanguageStore from "@/store/useLanguageStore"

const { Text } = Typography

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

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

export default function ManageReviewsTable({
  reviews,
  courseId,
}: {
  reviews: ReviewWithUser[]
  courseId: number
}) {
  const router = useRouter()
  const { language } = useLanguageStore()
  const [messageApi, contextHolder] = message.useMessage()
  const [isPending, startTransition] = useTransition()
  const [processingReviewId, setProcessingReviewId] = useState<number | null>(null)
  const [isDeactivateVisible, setDeactivateVisible] = useState(false)
  const [reviewToDeactivate, setReviewToDeactivate] = useState<ReviewWithUser | null>(null)

  const handleDeactivate = (reviewId: number) => {
    setProcessingReviewId(reviewId)
    const messageKey = `deactivate-review-${reviewId}`

    messageApi.open({
      key: messageKey,
      type: "loading",
      content: language === "vi" ? "Đang ẩn đánh giá..." : "Deactivating review...",
      duration: 0,
    })

    startTransition(async () => {
      try {
        const result = await deactivateReviewByManager({
          id: reviewId,
          course_id: courseId,
        })

        if (result.success) {
          messageApi.open({
            key: messageKey,
            type: "success",
            content: language === "vi" ? "Đã ẩn đánh giá" : "Review deactivated",
            duration: 2,
          })
          router.refresh()
          return
        }

        messageApi.open({
          key: messageKey,
          type: "error",
          content:
            result.error ||
            (language === "vi"
              ? "Không thể ẩn đánh giá"
              : "Failed to deactivate review"),
          duration: 3,
        })
      } catch (error) {
        messageApi.open({
          key: messageKey,
          type: "error",
          content:
            language === "vi"
              ? "Lỗi hệ thống khi ẩn đánh giá"
              : "System error while deactivating review",
          duration: 3,
        })
      } finally {
        setProcessingReviewId(null)
      }
    })
  }

  const showDeactivateConfirm = (record: ReviewWithUser) => {
    setReviewToDeactivate(record)
    setDeactivateVisible(true)
  }

  const confirmDeactivate = () => {
    if (!reviewToDeactivate) return

    setDeactivateVisible(false)
    handleDeactivate(reviewToDeactivate.id)
    setReviewToDeactivate(null)
  }

  const closeDeactivateModal = () => {
    setDeactivateVisible(false)
    setReviewToDeactivate(null)
  }

  const columns: TableProps<ReviewWithUser>["columns"] = [
    {
      title: language === "vi" ? "Người dùng" : "User",
      key: "user",
      width: 260,
      render: (_value, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.user_avatar || undefined}
            icon={!record.user_avatar ? <UserOutlined /> : undefined}
            size={36}
          >
            {!record.user_avatar ? getInitials(record.user_name || "U") : null}
          </Avatar>
          <div className="min-w-0">
            <Text strong className="block truncate" title={record.user_name}>
              {record.user_name || (language === "vi" ? "Người dùng không rõ" : "Unknown user")}
            </Text>
            <Text type="secondary" className="block truncate" title={record.user_email}>
              {record.user_email || (language === "vi" ? "Không có email" : "No email")}
            </Text>
          </div>
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
    {
      title: language === "vi" ? "Trạng thái" : "Status",
      dataIndex: "deleted_at",
      key: "status",
      width: 130,
      render: (deletedAt: string | null) =>
        deletedAt ? (
          <Tag color="red">{language === "vi" ? "Đã ẩn" : "Inactive"}</Tag>
        ) : (
          <Tag color="green">{language === "vi" ? "Đang hiển thị" : "Active"}</Tag>
        ),
    },
    {
      title: language === "vi" ? "Thao tác" : "Action",
      key: "action",
      width: 150,
      render: (_value, record) => {
        const isInactive = Boolean(record.deleted_at)
        const isProcessingThisRow = isPending && processingReviewId === record.id

        if (isInactive) {
          return <Text type="secondary">{language === "vi" ? "Không có thao tác" : "No action"}</Text>
        }

        return (
          <Button
            danger
            icon={<StopOutlined />}
            size="small"
            loading={isProcessingThisRow}
            disabled={isPending && processingReviewId !== record.id}
            onClick={() => showDeactivateConfirm(record)}
          >
            {language === "vi" ? "Ẩn đánh giá" : "Deactivate"}
          </Button>
        )
      },
    },
  ]

  return (
    <>
      {contextHolder}
      <Table
        columns={columns}
        dataSource={reviews}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1100 }}
        locale={{
          emptyText:
            language === "vi" ? "Không tìm thấy phản hồi" : "No feedback found",
        }}
      />

      <Modal
        title={language === "vi" ? "Xác nhận" : "Confirmation"}
        centered
        open={isDeactivateVisible}
        onCancel={closeDeactivateModal}
        footer={[
          <Button key="cancel" onClick={closeDeactivateModal}>
            {language === "vi" ? "Hủy" : "Cancel"}
          </Button>,
          <Button key="deactivate" danger onClick={confirmDeactivate}>
            {language === "vi" ? "Ẩn đánh giá" : "Deactivate"}
          </Button>,
        ]}
      >
        <Text>
          {language === "vi"
            ? "Bạn có chắc chắn muốn ẩn đánh giá này?"
            : "Are you sure you want to deactivate this review?"}
        </Text>
        <br />
        <Text type="secondary">
          {language === "vi"
            ? "Đánh giá này sẽ bị ẩn khỏi học viên và loại khỏi điểm trung bình."
            : "This review will be hidden from learners and removed from average rating."}
        </Text>
      </Modal>
    </>
  )
}
