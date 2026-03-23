"use client"

import { useState } from "react"
import { Button, Modal, Spin, message, Space, Divider } from "antd"
import { BulbOutlined, LoadingOutlined } from "@ant-design/icons"
import { getQuestionExplanation } from "@/action/quiz/quizActions"
import ReactMarkdown from "react-markdown"

interface AIExplanationButtonProps {
  attemptId: number
  questionId: number
  questionText: string
}

export default function AIExplanationButton({
  attemptId,
  questionId,
  questionText,
}: AIExplanationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [explanation, setExplanation] = useState<string>("")

  const handleGetExplanation = async () => {
    setIsLoading(true)
    try {
      const response = await getQuestionExplanation({
        attemptId,
        questionId,
      })

      if (response.success && response.explanation) {
        setExplanation(response.explanation)
        setIsModalVisible(true)
      } else {
        message.error(response.error || "Failed to generate explanation")
      }
    } catch (error: any) {
      console.error("Error:", error)
      message.error("Failed to generate explanation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        icon={
          isLoading ? (
            <LoadingOutlined style={{ color: "#1677ff" }} />
          ) : (
            <BulbOutlined />
          )
        }
        style={{
          borderColor: "#1677ff",
          color: "#1677ff",
          borderRadius: 6,
        }}
        onClick={handleGetExplanation}
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Get AI Explanation"}
      </Button>

      <Modal
        title={
          <Space>
            <BulbOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <span>Deeper Explanation - AI Coach</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
        style={{ maxHeight: "80vh" }}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 16 }}>
          <div style={{ marginBottom: 16, color: "#595959" }}>
            <strong>Question: </strong>
            <p style={{ marginTop: 8 }}>{questionText}</p>
          </div>

          <Divider />

          <div style={{ color: "#262626" }}>
            <strong style={{ fontSize: 14, color: "#1677ff" }}>
              📚 Detailed Explanation
            </strong>
            <div
              style={{
                marginTop: 12,
                lineHeight: 1.8,
                fontSize: 14,
                color: "#595959",
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p style={{ marginBottom: 12 }} {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      style={{ marginLeft: 20, marginBottom: 12 }}
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      style={{ marginLeft: 20, marginBottom: 12 }}
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li style={{ marginBottom: 6 }} {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong style={{ color: "#1677ff" }} {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em style={{ fontStyle: "italic" }} {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      style={{
                        borderLeft: "4px solid #1677ff",
                        paddingLeft: 12,
                        marginLeft: 0,
                        marginBottom: 12,
                        fontStyle: "italic",
                        color: "#595959",
                        background: "#f5f5f5",
                        padding: "12px 12px 12px 12px",
                        borderRadius: 4,
                      }}
                      {...props}
                    />
                  ),
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code
                        style={{
                          background: "#f5f5f5",
                          padding: "2px 6px",
                          borderRadius: 3,
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                        {...props}
                      />
                    ) : (
                      <pre
                        style={{
                          background: "#f5f5f5",
                          padding: 12,
                          borderRadius: 4,
                          overflowX: "auto",
                          marginBottom: 12,
                        }}
                        {...props}
                      >
                        <code {...props} />
                      </pre>
                    ),
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
