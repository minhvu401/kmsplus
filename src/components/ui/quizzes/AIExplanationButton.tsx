"use client"

import { useState, useEffect } from "react"
import { Button, message, Card } from "antd"
import { BulbOutlined, LoadingOutlined, CloseOutlined } from "@ant-design/icons"
import { getQuestionExplanation } from "@/action/quiz/quizActions"
import ReactMarkdown from "react-markdown"

interface AIExplanationButtonProps {
  attemptId: number
  questionId: number | string
  questionText: string
}

export default function AIExplanationButton({
  attemptId,
  questionId,
  questionText,
}: AIExplanationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [explanation, setExplanation] = useState<string>("")
  const [showExplanation, setShowExplanation] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Reset explanation when question changes
  useEffect(() => {
    setExplanation("")
    setRetryCount(0)
    setShowExplanation(false)
    setErrorMessage("")
  }, [questionId])

  const handleGetExplanation = async (currentRetry: number = 0) => {
    if (currentRetry === 0) {
      setIsLoading(true)
      setRetryCount(0)
      setErrorMessage("")
    }

    try {
      const numQuestionId =
        typeof questionId === "string" ? Number(questionId) : questionId
      const response = await getQuestionExplanation({
        attemptId,
        questionId: numQuestionId,
      })

      if (response.success && response.explanation) {
        setExplanation(response.explanation)
        setShowExplanation(true)
        message.success("Explanation generated successfully!")
        setIsLoading(false)
        setErrorMessage("")
      } else {
        const errorMsg = response.error || "Failed to generate explanation"

        // Retry for temporary service unavailable errors with exponential backoff
        if (errorMsg.includes("temporarily unavailable") && currentRetry < 3) {
          const delay = 2000 * Math.pow(2, currentRetry) // 2s, 4s, 8s
          setRetryCount(currentRetry + 1)
          message.loading(
            `Retrying in ${delay / 1000}s... (Attempt ${currentRetry + 1}/3)`
          )
          // Wait with exponential backoff before retrying
          setTimeout(() => {
            handleGetExplanation(currentRetry + 1)
          }, delay)
        } else {
          setErrorMessage(errorMsg)
          setIsLoading(false)
        }
      }
    } catch (error: any) {
      console.error("Error fetching explanation:", error)
      const errorMsg =
        (error as Error).message || "Failed to generate explanation"
      setErrorMessage(errorMsg)
      setIsLoading(false)
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <Button
        type="default"
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
        onClick={() => handleGetExplanation()}
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Get AI Explanation"}
      </Button>

      {errorMessage && !showExplanation && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 16px",
            background: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: 6,
            color: "#d4380d",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {showExplanation && explanation && (
        <Card
          style={{
            marginTop: 16,
            background: "linear-gradient(135deg, #f5f7ff 0%, #e8f0ff 100%)",
            border: "1px solid #1677ff20",
            animation: "slideDown 0.3s ease-out",
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BulbOutlined style={{ color: "#1677ff", fontSize: 16 }} />
              <span style={{ color: "#1677ff", fontWeight: 600 }}>
                AI Explanation
              </span>
            </div>
          }
          extra={
            <button
              onClick={() => setShowExplanation(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                fontSize: 16,
                padding: 0,
              }}
            >
              <CloseOutlined />
            </button>
          }
          bodyStyle={{
            color: "#262626",
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: "#595959" }}>Question:</strong>
            <p
              style={{
                marginTop: 4,
                marginBottom: 0,
                color: "#595959",
                fontStyle: "italic",
              }}
            >
              {questionText}
            </p>
          </div>

          <div
            style={{
              borderTop: "1px solid #1677ff30",
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <div
              style={{
                lineHeight: 1.8,
                color: "#595959",
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p style={{ marginBottom: 12, fontSize: 13 }} {...props} />
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
                    <li style={{ marginBottom: 6, fontSize: 13 }} {...props} />
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
                        fontSize: 13,
                      }}
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) =>
                    (props as any).inline ? (
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
                          fontSize: 12,
                        }}
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
        </Card>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
