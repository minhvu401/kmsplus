"use client"

import { useState } from "react"
import { Modal, Button, Rate, Input, Form } from "antd"
import { createReview } from "@/action/reviews/reviewActions"

interface FeedbackBannerProps {
  courseId: number
  onSubmitted?: () => void
  onSuccessMessage?: (content: string) => void
  onErrorMessage?: (content: string) => void
}

const FeedbackBanner = ({
  courseId,
  onSubmitted,
  onSuccessMessage,
  onErrorMessage,
}: FeedbackBannerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [rating, setRating] = useState(0)

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setRating(0)
  }

  const handleFinish = async (values: { rating: number; content?: string }) => {
    try {
      const formData = new FormData()
      formData.append("course_id", String(courseId))
      formData.append("rating", String(values.rating))
      if (values.content) {
        formData.append("content", values.content)
      }

      const result = await createReview(formData)

      if (result.success) {
        onSuccessMessage?.("Thank you for your feedback!")
        handleCancel()
        onSubmitted?.()
      } else {
        onErrorMessage?.(result.error || "Failed to submit feedback.")
      }
    } catch {
      onErrorMessage?.("Something went wrong while submitting feedback.")
    }
  }

  const handleRatingChange = (value: number) => {
    setRating(value)
    form.setFieldsValue({ rating: value })
  }

  return (
    <>
      <div
        style={{
          padding: "20px",
          backgroundColor: "#1890ff", // Blue background
          color: "white", // White text
          textAlign: "left", // Align text to the left
          borderRadius: "8px",
          margin: "20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ color: "white", margin: 0, fontWeight: "bold" }}>
            Share Your Feedback
          </h3>
          <p style={{ margin: "5px 0 0 0" }}>
            Help us improve by sharing your experience with this course.
          </p>
        </div>
        <Button
          type="default"
          onClick={showModal}
          style={{
            backgroundColor: "white", // White button background
            color: "#1890ff", // Blue button text
            border: "none",
          }}
        >
          Give Feedback
        </Button>
      </div>

      <Modal
        title="Leave a Review"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ rating: 0, content: "" }}
        >
          <Form.Item
            name="rating"
            label="Your Rating"
            rules={[{ required: true, message: "Please provide a rating." }]}
          >
            <Rate
              className="feedback-rating"
              allowHalf
              value={rating}
              onChange={handleRatingChange}
            />
          </Form.Item>

          <Form.Item name="content" label="Your Feedback">
            <Input.TextArea
              rows={4}
              maxLength={600}
              showCount
              placeholder="What did you like or dislike? What could be improved?"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              disabled={rating === 0}
              style={{ width: "100%" }}
            >
              Submit Review
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .feedback-rating .ant-rate-star-zero .ant-rate-star-first,
        .feedback-rating .ant-rate-star-zero .ant-rate-star-second {
          color: #c4c4c4 !important;
        }
      `}</style>
    </>
  )
}

export default FeedbackBanner
