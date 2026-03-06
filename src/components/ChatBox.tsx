"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button, Spin, Empty, Tooltip, Drawer, Dropdown } from "antd"
import type { MenuProps } from "antd"
import {
  SendOutlined,
  CopyOutlined,
  CloseOutlined,
  HistoryOutlined,
  EllipsisOutlined,
} from "@ant-design/icons"

// Helper function to parse inline markdown (bold, italic) for a single text string
const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  const processedText: React.ReactNode[] = []
  let currentIndex = 0

  const boldStrongRegex = /\*\*([^*]+)\*\*/g
  const boldRegex = /\*([^*]+)\*/g
  const underscoreStrongRegex = /__([^_]+)__/g
  const underscoreRegex = /_([^_]+)_/g

  let match: RegExpExecArray | null
  const matches: Array<{
    start: number
    end: number
    text: string
    tag: string
  }> = []

  // Find all matches, prioritize double markers first
  while ((match = boldStrongRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
      tag: "strong",
    })
  }
  while ((match = underscoreStrongRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
      tag: "strong",
    })
  }
  while ((match = boldRegex.exec(text)) !== null) {
    // Skip if it's part of ** already processed
    const isPartOfDouble = matches.some(
      (m) => m.start <= match!.index && match!.index < m.end
    )
    if (!isPartOfDouble) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        tag: "em",
      })
    }
  }
  while ((match = underscoreRegex.exec(text)) !== null) {
    // Skip if it's part of __ already processed
    const isPartOfDouble = matches.some(
      (m) => m.start <= match!.index && match!.index < m.end
    )
    if (!isPartOfDouble) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        tag: "em",
      })
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start)

  // Build processed text
  currentIndex = 0
  matches.forEach((match) => {
    if (currentIndex < match.start) {
      processedText.push(text.substring(currentIndex, match.start))
    }
    const Tag = match.tag as keyof JSX.IntrinsicElements
    processedText.push(
      React.createElement(
        Tag,
        { key: `${match.tag}-${match.start}` },
        match.text
      )
    )
    currentIndex = match.end
  })

  if (currentIndex < text.length) {
    processedText.push(text.substring(currentIndex))
  }

  return processedText.length > 0 ? processedText : [text]
}

// Helper function to parse markdown and render as JSX
const parseMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Regex patterns for markdown elements
  const patterns = [
    { pattern: /\*\*([^*]+)\*\*/g, tag: "strong" }, // **bold**
    { pattern: /\*([^*]+)\*/g, tag: "em" }, // *italic*
    { pattern: /__([^_]+)__/g, tag: "strong" }, // __bold__
    { pattern: /_([^_]+)_/g, tag: "em" }, // _italic_
  ]

  // Split by lines first to handle block-level formatting
  const lines = text.split("\n")
  const processedLines: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    // Check for headings and list items
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    const listMatch = line.match(/^[\*\-\+]\s+(.+)$/)

    if (headingMatch) {
      const level = Math.min(headingMatch[1].length + 2, 6) // Convert # count to h3-h6
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
      processedLines.push(
        React.createElement(
          HeadingTag,
          { key: `heading-${lineIdx}`, className: "font-bold mt-2 mb-1" },
          headingMatch[2]
        )
      )
    } else if (listMatch) {
      // Parse inline markdown within list item content
      const listContent = parseInlineMarkdown(listMatch[1])
      processedLines.push(
        <div key={`list-${lineIdx}`} className="ml-4 flex gap-2">
          <span>•</span>
          <span>{listContent}</span>
        </div>
      )
    } else if (line.trim()) {
      // Process inline markdown formatting for regular lines
      const inlineFormatted = parseInlineMarkdown(line)
      processedLines.push(
        <div
          key={`line-${lineIdx}`}
          className="whitespace-pre-wrap break-words"
        >
          {inlineFormatted}
        </div>
      )
    }
  })

  return processedLines
}

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  createdAt: string
}

interface Conversation {
  id: number
  title: string | null
  createdAt: string
  updatedAt: string
}

interface ChatBoxProps {
  isModal?: boolean
  hideHeader?: boolean
  initialConversation?: Conversation | null
}

const ChatBox = React.forwardRef<any, ChatBoxProps>(
  (
    { isModal = false, hideHeader = false, initialConversation = null },
    ref
  ) => {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversation, setCurrentConversation] =
      useState<Conversation | null>(initialConversation)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [listLoading, setListLoading] = useState(false)
    const [skipNextLoadMessages, setSkipNextLoadMessages] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [authenticated, setAuthenticated] = useState<boolean>(false)
    const [authLoading, setAuthLoading] = useState(true)
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

    // Update currentConversation when initialConversation prop changes
    useEffect(() => {
      if (initialConversation) {
        setCurrentConversation(initialConversation)
      }
    }, [initialConversation?.id])

    // Check authentication from HTTP-only cookie
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" })
          setAuthenticated(res.ok)
          if (res.ok) {
            // Load conversations after auth check
            loadConversations()
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          setAuthenticated(false)
        } finally {
          setAuthLoading(false)
        }
      }

      checkAuth()
    }, [])

    // Load conversations when component mounts
    useEffect(() => {
      if (!authenticated) return
      // Already loaded in checkAuth, no need to reload
    }, [authenticated])

    // Load messages when conversation changes
    useEffect(() => {
      if (!currentConversation || !authenticated) return
      // Skip loading if we just sent a message (messages already set locally)
      if (skipNextLoadMessages) {
        setSkipNextLoadMessages(false)
        return
      }
      loadMessages(currentConversation.id)
    }, [currentConversation, authenticated, skipNextLoadMessages])

    // Scroll to bottom when messages change
    useEffect(() => {
      scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const loadConversations = async () => {
      try {
        setListLoading(true)
        const res = await fetch("/api/chat", {
          credentials: "include", // HTTP-only cookies included automatically
        })

        if (!res.ok) throw new Error("Failed to load conversations")

        const data = await res.json()
        const conversationsList = data.data || []
        setConversations(conversationsList)
        // Don't auto-select any conversation
        // User will select from history or start a new conversation
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setListLoading(false)
      }
    }

    const loadMessages = async (conversationId: number) => {
      try {
        setLoading(true)
        const res = await fetch(`/api/chat/${conversationId}`, {
          credentials: "include", // HTTP-only cookies included automatically
        })

        if (!res.ok) throw new Error("Failed to load messages")

        const data = await res.json()
        setMessages(data.messages || [])
      } catch (error) {
        console.error("Error loading messages:", error)
      } finally {
        setLoading(false)
      }
    }

    const handleSendMessage = async () => {
      if (!input.trim() || !authenticated) return

      const userMessage = input.trim()
      setInput("")

      // Create temporary user message with negative ID (temporary marker)
      const tempUserMessageId = -Date.now()
      const tempUserMessage: Message = {
        id: tempUserMessageId,
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString(),
      }

      // Show user message immediately for better UX
      setMessages((prev) => [...prev, tempUserMessage])

      // Handle API call in the background
      const sendToAI = async () => {
        try {
          setLoading(true)

          const res = await fetch("/api/chat/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              conversationId: currentConversation?.id || null,
              message: userMessage,
            }),
          })

          if (!res.ok) throw new Error("Failed to send message")

          const data = await res.json()

          // Update conversation if it's new
          if (!currentConversation) {
            setCurrentConversation(data.conversation)
            setSkipNextLoadMessages(true)
          }

          // Replace temp user message with real one and add AI response
          setMessages((prev) => {
            // Remove temporary user message
            const withoutTemp = prev.filter((m) => m.id !== tempUserMessageId)
            return [
              ...withoutTemp,
              {
                id: data.userMessage.id,
                role: "user",
                content: data.userMessage.content,
                createdAt: data.userMessage.createdAt,
              },
              {
                id: data.assistantMessage.id,
                role: "assistant",
                content: data.assistantMessage.content,
                createdAt: data.assistantMessage.createdAt,
              },
            ]
          })

          // Reload conversations to update the list
          loadConversations()
        } catch (error) {
          console.error("Error sending message:", error)
          // Remove temporary message on error
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMessageId))
          // Restore user input so they can retry
          setInput(userMessage)
        } finally {
          setLoading(false)
        }
      }

      // Run API call in background without blocking UI
      sendToAI()
    }

    const handleNewConversation = () => {
      setCurrentConversation(null)
      setMessages([])
      setInput("")
    }

    // Expose methods to parent via ref
    React.useImperativeHandle(ref, () => ({
      handleNewConversation,
      setCurrentConversation,
      setConversations,
    }))

    return (
      <div
        className={`flex flex-col ${isModal ? "max-h-screen" : "h-full"} bg-white ${!isModal ? "lg:flex-row" : ""} ${hideHeader ? "h-full" : ""}`}
        style={
          isModal && !hideHeader
            ? { height: "calc(100vh + 600px)" }
            : hideHeader
              ? { height: "100%" }
              : undefined
        }
      >
        {/* Header - Only in modal mode and not hidden */}
        {isModal && !hideHeader && (
          <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3 bg-white flex-shrink-0 relative z-10">
            <h2 className="text-lg font-bold text-gray-900">
              {currentConversation?.title || "Cuộc trò chuyện mới"}
            </h2>
            <div className="flex items-center gap-2">
              <Dropdown
                menu={
                  {
                    items: [
                      {
                        key: "new-conversation",
                        label: "New Conversation",
                        onClick: handleNewConversation,
                      },
                    ],
                  } as MenuProps
                }
              >
                <Tooltip title="Menu">
                  <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    className="text-lg"
                  />
                </Tooltip>
              </Dropdown>
              <Tooltip title="Xem lịch sử">
                <Button
                  type="text"
                  icon={<HistoryOutlined />}
                  onClick={() => setShowHistoryDrawer(true)}
                  className="text-lg"
                />
              </Tooltip>
              <Tooltip title="Đóng">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setCurrentConversation(null)
                    setMessages([])
                    setInput("")
                  }}
                  className="text-lg"
                />
              </Tooltip>
            </div>
          </div>
        )}

        {/* Sidebar - Hidden in modal view */}
        {!isModal && (
          <div className="hidden lg:flex lg:w-72 flex-col bg-white border-r border-gray-200 p-4 gap-4">
            <Button
              type="primary"
              className="w-full"
              onClick={handleNewConversation}
            >
              Cuộc hội thoại mới
            </Button>

            <div className="flex-1 overflow-y-auto space-y-2">
              {listLoading ? (
                <Spin />
              ) : conversations.length === 0 ? (
                <Empty description="Không có cuộc hội thoại" />
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      currentConversation?.id === conv.id
                        ? "bg-blue-100 border border-blue-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => setCurrentConversation(conv)}
                  >
                    <div className="font-semibold text-sm truncate">
                      {conv.title || "Cuộc hội thoại mới"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(conv.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Main Area */}
        <div
          className={`flex flex-col flex-1 bg-gray-50 ${isModal ? "overflow-hidden" : ""}`}
        >
          {messages.length === 0 && !currentConversation && !loading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {authLoading
                  ? "Đang kiểm tra đăng nhập..."
                  : authenticated
                    ? "Hãy bắt đầu cuộc hội thoại"
                    : "Vui lòng đăng nhập để chat"}
              </h2>
              <p className="text-gray-600">
                {authenticated &&
                  "Nhập câu hỏi hoặc thông báo của bạn bên dưới"}
              </p>
            </div>
          ) : loading && messages.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <Spin tip="Đang tải..." />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white text-gray-900 border border-gray-300 rounded-bl-none"
                    }`}
                  >
                    <div className="break-words text-sm leading-relaxed">
                      {msg.role === "user"
                        ? msg.content
                        : parseMarkdown(msg.content)}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <small
                        className={
                          msg.role === "user"
                            ? "text-blue-100"
                            : "text-gray-600"
                        }
                      >
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN")}
                      </small>
                      <Tooltip title="Sao chép">
                        <CopyOutlined
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content)
                          }}
                          className={`cursor-pointer transition-colors ${
                            msg.role === "user"
                              ? "text-blue-200 hover:text-white"
                              : "text-gray-500 hover:text-blue-500"
                          }`}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-300 bg-white p-4 flex gap-2 items-end flex-shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  handleSendMessage()
                }
              }}
              placeholder={
                authLoading
                  ? "Đang kiểm tra đăng nhập..."
                  : authenticated
                    ? "Nhập câu hỏi... (Ctrl+Enter để gửi)"
                    : "Vui lòng đăng nhập để chat"
              }
              rows={3}
              disabled={!authenticated || authLoading}
              className="flex-1 p-2 border border-gray-300 rounded-lg resize-none text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={loading}
              disabled={
                !input.trim() || loading || !authenticated || authLoading
              }
              className="h-10 py-2"
            >
              Gửi
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

ChatBox.displayName = "ChatBox"

export default ChatBox
