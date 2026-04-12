"use client"

import { useState, useActionState, startTransition } from "react"
import { Button, Form, Modal, Typography, Input, Select, Divider } from "antd"
import { EditOutlined } from "@ant-design/icons"
import { State, createQuestion } from "@/action/question/questionActions"
import RichTextEditor from "@/components/ui/RichTextEditor"
import useLanguageStore from "@/store/useLanguageStore"

const { Text } = Typography

// Wrapper component for Ant Design Form integration
// Form.Item automatically injects value and onChange props
interface ContentEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

function ContentEditor({
  value = "",
  onChange,
  placeholder,
}: ContentEditorProps) {
  return (
    <RichTextEditor
      value={value}
      onChange={(val) => onChange?.(val)}
      placeholder={placeholder}
    />
  )
}

// Custom styles for placeholder text to match Rich Text Editor styling
const placeholderStyles = `
  .placeholder-styled::placeholder {
    color: #4b5563 !important;
    font-style: italic !important;
    font-size: 14px !important;
  }
`

export function CreateQuestion({
  categories,
  userId,
  returnTo,
  isFullWidth = false,
}: {
  categories: { id: number; name: string }[]
  userId: number
  returnTo?: string
  isFullWidth?: boolean
}) {
  const { language } = useLanguageStore()
  const isVi = language === "vi"

  const text = isVi
    ? {
        askQuestion: "Đặt câu hỏi",
        askQuestionCta: "Đặt câu hỏi - Chia sẻ kiến thức",
        askQuestionShort: "Đặt câu hỏi",
        submit: "Gửi",
        titleLabel: "Tiêu đề:",
        titleRequired: "Vui lòng nhập tiêu đề",
        titleMin: "Tiêu đề phải có ít nhất 3 ký tự",
        titleMax: "Tiêu đề phải dưới 150 ký tự",
        titlePlaceholder: "Viết tiêu đề câu hỏi của bạn...",
        charLimit: "Giới hạn ký tự",
        contentLabel: "Nội dung:",
        contentRequired: "Vui lòng cung cấp thêm chi tiết",
        contentMin: "Nội dung phải có ít nhất 10 ký tự",
        contentPlaceholder: "Cung cấp thêm chi tiết về câu hỏi của bạn...",
        categoryLabel: "Danh mục:",
        categoryRequired: "Vui lòng chọn danh mục",
        categoryPlaceholder: "Chọn danh mục",
        confirmation: "Xác nhận",
        cancel: "Hủy",
        leave: "Rời đi",
        confirmLeaveTitle: "Bạn có chắc chắn muốn rời khỏi cửa sổ này?",
        confirmLeaveDesc: "Câu hỏi của bạn sẽ không được lưu.",
        confirmSubmit: "Bạn có chắc chắn muốn gửi câu hỏi này?",
      }
    : {
        askQuestion: "Ask Question",
        askQuestionCta: "Ask Question - Share Your Knowledge",
        askQuestionShort: "Ask A Question",
        submit: "Submit",
        titleLabel: "Title:",
        titleRequired: "Please enter a title",
        titleMin: "Title must be at least 3 characters",
        titleMax: "Title must be under 150 characters",
        titlePlaceholder: "Write your question title here...",
        charLimit: "Character limit",
        contentLabel: "Content:",
        contentRequired: "Please provide more details",
        contentMin: "Content must be at least 10 characters",
        contentPlaceholder: "Provide more details about your question...",
        categoryLabel: "Category:",
        categoryRequired: "Please select a category",
        categoryPlaceholder: "Select category",
        confirmation: "Confirmation",
        cancel: "Cancel",
        leave: "Leave",
        confirmLeaveTitle: "Are you sure you want to leave this pop-up?",
        confirmLeaveDesc: "Your question will not be saved.",
        confirmSubmit: "Are you sure you want to ask this question?",
      }

  const [form] = Form.useForm()
  const [isCreateVisible, setCreateVisible] = useState(false)
  const [isLeaveVisible, setLeaveVisible] = useState(false)
  const [isSubmitVisible, setSubmitVisible] = useState(false)
  const [titleCount, setTitleCount] = useState(0)
  const [contentCount, setContentCount] = useState(0)

  const initialState: State = { message: null, errors: {} }
  const [state, createQuestionAction] = useActionState(
    createQuestion,
    initialState
  )

  const titleError = state?.errors?.title?.[0]
  const contentError = state?.errors?.content?.[0]
  const categoryError = state?.errors?.category_id?.[0]

  const handleLeave = () => {
    setLeaveVisible(false)
    setCreateVisible(false)
  }

  const handleSubmit = () => {
    setSubmitVisible(false)
    form.submit()
  }

  return (
    <>
      <Button
        size={isFullWidth ? "large" : "middle"}
        style={{
          background: "#ffffff",
          borderColor: "#1e40af",
          borderWidth: "1.5px",
          borderRadius: "0.375rem",
          color: "#1e40af",
          fontSize: isFullWidth ? "15px" : "12px",
          fontWeight: isFullWidth ? 700 : 500,
          height: isFullWidth ? "52px" : "36px",
          paddingInline: isFullWidth ? "28px" : "14px",
          width: isFullWidth ? "100%" : "auto",
          boxShadow: "0 2px 8px rgba(30, 64, 175, 0.12)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          const button = e.currentTarget as HTMLButtonElement
          button.style.background = "#f8fafc"
          button.style.boxShadow = "0 8px 20px rgba(30, 64, 175, 0.2)"
          button.style.borderColor = "#1e3a8a"
        }}
        onMouseLeave={(e) => {
          const button = e.currentTarget as HTMLButtonElement
          button.style.background = "#ffffff"
          button.style.boxShadow = "0 2px 8px rgba(30, 64, 175, 0.12)"
          button.style.borderColor = "#1e40af"
        }}
        aria-label={text.askQuestion}
        onClick={() => setCreateVisible(true)}
      >
        <EditOutlined
          style={{
            marginRight: isFullWidth ? "8px" : "5px",
            fontSize: isFullWidth ? "14px" : "12px",
          }}
        />
        <span>
          {isFullWidth
            ? text.askQuestionCta
            : text.askQuestionShort}
        </span>
      </Button>

      <Modal
        title={text.askQuestion}
        centered
        open={isCreateVisible}
        onCancel={() => setLeaveVisible(true)}
        onOk={() => setSubmitVisible(true)}
        okText={text.submit}
        width={700}
      >
        <style>{placeholderStyles}</style>
        {state?.message ? (
          <Text type="danger" style={{ display: "block", marginBottom: 12 }}>
            {state.message}
          </Text>
        ) : null}
        <Form
          form={form}
          layout="vertical"
          style={{ width: "100%" }}
          onFinish={async (values) => {
            const formData = new FormData()
            formData.append("user_id", String(userId))
            formData.append("title", values.title)
            formData.append("content", values.content)
            formData.append("category_id", values.category_id)
            if (returnTo) {
              formData.append("returnTo", returnTo)
            }

            startTransition(() => {
              createQuestionAction(formData)
            })
          }}
        >
          <Form.Item
            label={<Text strong>{text.titleLabel}</Text>}
            name="title"
            help={titleError}
            validateStatus={titleError ? "error" : undefined}
            rules={[
              { required: true, message: text.titleRequired },
              { min: 3, message: text.titleMin },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve()
                  }
                  if (value.length > 150) {
                    return Promise.reject(text.titleMax)
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input
              placeholder={text.titlePlaceholder}
              maxLength={150}
              onChange={(e) => setTitleCount(e.target.value.length)}
              style={{ height: 40 }}
              className="placeholder-styled"
            />
          </Form.Item>
          <Text type="secondary">{text.charLimit} {titleCount} / 150</Text>

          <Divider style={{ margin: "8px 0 16px" }} />

          <Form.Item
            label={<Text strong>{text.contentLabel}</Text>}
            name="content"
            help={contentError}
            validateStatus={contentError ? "error" : undefined}
            getValueFromEvent={(val: string) => {
              // Strip HTML tags to count plain text characters
              const plainText = val
                ? val
                    .replace(/<[^>]*>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .trim()
                : ""
              setContentCount(plainText.length)
              return val
            }}
            rules={[
              { required: true, message: text.contentRequired },
              {
                validator: (_, value) => {
                  // Only validate length if user has entered content
                  if (!value) {
                    return Promise.resolve() // Let required rule handle empty case
                  }
                  // Strip HTML tags to get plain text for validation
                  const plainText = value
                    .replace(/<[^>]*>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .trim()
                  if (plainText.length > 0 && plainText.length < 10) {
                    return Promise.reject(text.contentMin)
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <ContentEditor placeholder={text.contentPlaceholder} />
          </Form.Item>
          <Text type="secondary">{text.charLimit} {contentCount} / 3000</Text>

          <Divider style={{ margin: "8px 0 16px" }} />

          <Form.Item
            label={<Text strong>{text.categoryLabel}</Text>}
            name="category_id"
            help={categoryError}
            validateStatus={categoryError ? "error" : undefined}
            rules={[{ required: true, message: text.categoryRequired }]}
          >
            <Select
              placeholder={
                <span
                  style={{
                    color: "#4b5563",
                    fontStyle: "italic",
                    fontSize: "14px",
                  }}
                >
                  {text.categoryPlaceholder}
                </span>
              }
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              allowClear
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={text.confirmation}
        centered
        open={isLeaveVisible}
        onCancel={() => setLeaveVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setLeaveVisible(false)}>
            {text.cancel}
          </Button>,
          <Button key="leave" danger onClick={handleLeave}>
            {text.leave}
          </Button>,
        ]}
      >
        <Text>{text.confirmLeaveTitle}</Text>
        <br />
        <Text type="secondary">{text.confirmLeaveDesc}</Text>
      </Modal>

      <Modal
        title={text.confirmation}
        centered
        open={isSubmitVisible}
        onCancel={() => setSubmitVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSubmitVisible(false)}>
            {text.cancel}
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {text.submit}
          </Button>,
        ]}
      >
        <Text>{text.confirmSubmit}</Text>
      </Modal>
    </>
  )
}
