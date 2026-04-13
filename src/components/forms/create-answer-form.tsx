"use client"

import { useState, useActionState, startTransition, useEffect } from "react"
import { Form, Input, Select, Button, Typography, Flex, message } from "antd"
import { State, createAnswer } from "@/action/question/questionActions"
import { useRouter } from "next/navigation"
import RichTextEditor from "@/components/ui/RichTextEditor"

const { Text } = Typography

// Wrapper component for Ant Design Form integration
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
      size="compact"
    />
  )
}

export default function CreateAnswerForm({
  userId,
  questionId,
}: {
  userId: number
  questionId: number
}) {
  const [form] = Form.useForm()
  const [contentCount, setContentCount] = useState(0)
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  const initialState: State = { message: null, errors: {} }
  const [state, createAnswerAction, isCreatingAnswer] = useActionState(
    createAnswer,
    initialState
  )

  useEffect(() => {
    if (!state?.message) return

    if (state.message === "Answer created successfully") {
      form.resetFields()
      setContentCount(0)
      messageApi.success("Your answer has been posted successfully.")
      startTransition(() => {
        router.refresh()
      })
      return
    }

    const errorDetails = state.errors
      ? Object.values(state.errors).flat().filter(Boolean).join(" | ")
      : ""

    if (errorDetails) {
      messageApi.error(errorDetails)
      return
    }

    if (
      state.message === "Missing or invalid fields. Failed to create answer."
    ) {
      return
    }

    messageApi.error(state.message)
  }, [state, messageApi, form, router])

  return (
    <>
      {contextHolder}
      <Flex
        vertical
        gap={8}
        style={{ width: "100%", maxWidth: 900, background: "#fff" }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ width: "100%" }}
          onFinish={async (values) => {
            const formData = new FormData()
            formData.append("user_id", String(userId))
            formData.append("question_id", String(questionId))
            formData.append("content", values.content)

            startTransition(() => {
              createAnswerAction(formData)
            })
          }}
        >
          <Form.Item
            name="content"
            style={{ marginBottom: 8 }}
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
              { required: true, message: "Please provide more details" },
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
                  if (plainText.length > 0 && plainText.length < 15) {
                    return Promise.reject(
                      "Answers must be at least 15 characters"
                    )
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <ContentEditor placeholder="Enter your answer here..." />
          </Form.Item>

          <Flex justify="space-between" align="center">
            <Text type="secondary">Character limit {contentCount} / 600</Text>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isCreatingAnswer}
              disabled={contentCount < 15}
              style={{
                opacity: contentCount < 15 ? 0.5 : 1,
                cursor: contentCount < 15 ? "not-allowed" : "pointer",
              }}
            >
              Send
            </Button>
          </Flex>
        </Form>
      </Flex>
    </>
  )
}
