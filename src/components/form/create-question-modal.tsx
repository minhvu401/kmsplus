"use client"

import { Modal, Form, Input, Button, Radio, Checkbox, message } from "antd"
import React, { useEffect, useState } from "react"
import { createQuizQuestion } from "@/action/question-bank/questionBankActions"
import type { Option } from "@/service/questionbank.service"

interface CreateQuestionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type QuestionType = "multiple_choice" | "checkboxes"

// Kiểu dữ liệu cho form, rất quan trọng
type FormValues = {
  question_text: string
  question_type: QuestionType
  // Mảng options luôn có 4 phần tử
  options: { text: string; isCorrect?: boolean }[]
  // Dùng cho Radio, lưu index của đáp án đúng
  correctAnswerIndex?: number
}

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State để thay đổi giao diện giữa Radio và Checkbox
  const questionType = Form.useWatch("question_type", form)

  // Reset form mỗi khi modal mở
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        question_type: "multiple_choice",
        options: Array(4).fill({ text: "" }),
      })
    }
  }, [open, form])

  const handleFinish = async (values: FormValues) => {
    setIsSubmitting(true)
    let formattedOptions: Option[] = []

    // Xử lý dữ liệu tùy thuộc vào loại câu hỏi
    if (values.question_type === "multiple_choice") {
      if (
        values.correctAnswerIndex === undefined ||
        values.correctAnswerIndex === null
      ) {
        message.error("Please select a correct answer for multiple choice.")
        setIsSubmitting(false)
        return
      }
      formattedOptions = values.options.map((opt, index) => ({
        text: opt.text,
        isCorrect: index === values.correctAnswerIndex,
      }))
    } else {
      // Checkboxes
      formattedOptions = values.options.map((opt) => ({
        text: opt.text,
        isCorrect: opt.isCorrect || false,
      }))
    }

    try {
      await createQuizQuestion(
        values.question_text,
        values.question_type,
        "medium", // Mặc định
        "", // category_id: empty string when none
        formattedOptions
      )
      message.success("Question created successfully!")
      onSuccess()
    } catch (error) {
      console.error(error)
      message.error((error as Error).message || "Failed to create question.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title={<span className="font-bold text-xl">Enter your new question</span>}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={isSubmitting}
          onClick={() => form.submit()}
        >
          Save
        </Button>,
      ]}
      width={700}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        autoComplete="off"
      >
        <Form.Item
          name="question_text"
          rules={[{ required: true, message: "Question text is required!" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="[ Your question will be displayed here... ]"
          />
        </Form.Item>

        <Form.Item name="question_type">
          <Radio.Group>
            <Radio.Button value="multiple_choice">Multiple-choice</Radio.Button>
            <Radio.Button value="checkboxes">Checkboxes</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Render 4 dòng đáp án cố định */}
        {questionType === "multiple_choice" ? (
          <Form.Item
            name="correctAnswerIndex"
            label="Options (select one correct answer)"
          >
            <Radio.Group className="w-full">
              <div className="flex flex-col gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Radio value={index} />
                    <Form.Item
                      name={["options", index, "text"]}
                      rules={[
                        {
                          required: true,
                          message: `Option ${index + 1} is required`,
                        },
                      ]}
                      className="flex-grow mb-0"
                    >
                      <Input placeholder={`Option ${index + 1}`} />
                    </Form.Item>
                  </div>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>
        ) : (
          <Form.Item label="Options (select one or more correct answers)">
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Form.Item
                    name={["options", index, "isCorrect"]}
                    valuePropName="checked"
                    className="mb-0"
                  >
                    <Checkbox />
                  </Form.Item>
                  <Form.Item
                    name={["options", index, "text"]}
                    rules={[
                      {
                        required: true,
                        message: `Option ${index + 1} is required`,
                      },
                    ]}
                    className="flex-grow mb-0"
                  >
                    <Input placeholder={`Option ${index + 1}`} />
                  </Form.Item>
                </div>
              ))}
            </div>
          </Form.Item>
        )}

        {/* Phần Tags sẽ được nâng cấp sau */}
        <Form.Item label="Tags assigned">
          <Input placeholder="Enter any tags..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateQuestionModal
