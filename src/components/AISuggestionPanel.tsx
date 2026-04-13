"use client"

import React, { useState, useEffect } from "react"
import { Card, Button, Spin, Empty, Alert, Tag, DatePicker } from "antd"
import { CheckOutlined, CloseOutlined } from "@ant-design/icons"
import {
  approveSuggestion,
  dismissSuggestion,
  getLatestSuggestion,
  analyzeQATopics,
} from "@/action/ai-suggestion-action"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"

interface Suggestion {
  id: number
  topic: string
  topic_count: number
  date_range: number
  status: "pending" | "approved" | "dismissed"
}

interface Topic {
  topic: string
  count: number
  confidence: number
}

export default function AISuggestionPanel() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState(30)
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  // Load latest suggestion on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Get latest suggestion
      const suggestionRes = await getLatestSuggestion()
      if (suggestionRes.success && suggestionRes.data) {
        setSuggestion(suggestionRes.data)
      }
    } catch (error) {
      console.error("Error loading suggestion:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeTopics = async () => {
    setLoading(true)
    try {
      const res = await analyzeQATopics(selectedDays)
      if (res.success) {
        setTopics(res.data || [])
      }
    } catch (error) {
      console.error("Error analyzing topics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!suggestion) return

    setActionLoading(true)
    try {
      const res = await approveSuggestion(suggestion.id)
      if (res.success) {
        // Redirect to course management
        router.push(
          "/courses/management?create=true&topic=" +
            encodeURIComponent(suggestion.topic)
        )
      }
    } catch (error) {
      console.error("Error approving suggestion:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (!suggestion) return

    setActionLoading(true)
    try {
      const res = await dismissSuggestion(suggestion.id)
      if (res.success) {
        setSuggestion(null)
        setDismissed(true)
      }
    } catch (error) {
      console.error("Error dismissing suggestion:", error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Suggestion Card */}
      {suggestion && !dismissed && (
        <Card
          className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent"
          title={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  🤖 AI Đề Xuất Khóa Học Mới
                </h3>
              </div>
              <Tag color="blue">Gợi ý từ AI</Tag>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Suggestion Content */}
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 mb-3">
                Trong <strong>{suggestion.date_range} ngày</strong> qua, topic{" "}
                <strong className="text-blue-600">"{suggestion.topic}"</strong>{" "}
                được người dùng nhắc tới{" "}
                <strong>{suggestion.topic_count} lần</strong>.
              </p>
              <p className="text-gray-700">
                Bạn có muốn tạo một khóa học về chủ đề này không?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={actionLoading}
                size="large"
              >
                Đồng ý - Tạo Khóa Học
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleDismiss}
                loading={actionLoading}
                size="large"
              >
                Không - Ẩn Đề Xuất
              </Button>
            </div>
          </div>
        </Card>
      )}

      {dismissed && (
        <Alert
          message="Đề xuất đã được ẩn"
          description="Hệ thống sẽ tạo đề xuất mới khi phát hiện topic khác được nhắc đến nhiều nhất"
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* Topic Analysis Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Phân Tích Topics</h3>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Date Range Selector */}
          <div className="flex gap-4 items-center flex-wrap">
            <label className="font-medium">Phân tích trong:</label>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <Button
                  key={days}
                  type={selectedDays === days ? "primary" : "default"}
                  onClick={() => setSelectedDays(days)}
                >
                  {days} ngày
                </Button>
              ))}
            </div>
            <Button
              type="primary"
              onClick={handleAnalyzeTopics}
              loading={loading}
            >
              Phân Tích
            </Button>
          </div>

          {/* Topics List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Spin />
              <span className="text-gray-500 text-sm">Đang phân tích...</span>
            </div>
          ) : topics.length === 0 ? (
            <Empty description="Chưa có topics để phân tích" />
          ) : (
            <div className="space-y-3">
              {topics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        #{idx + 1} {topic.topic}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Được nhắc tới <strong>{topic.count}</strong> lần
                      </p>
                    </div>
                    <div className="text-right">
                      <Tag color="blue" className="text-xs">
                        {topic.confidence.toFixed(1)}% relevance
                      </Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Info Box */}
      <Alert
        message="Cách Sử Dụng"
        description={
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Hệ thống tự động phân tích các câu hỏi trong Q&A</li>
            <li>Nhóm các câu hỏi tương tự thành các topics</li>
            <li>Gợi ý tạo khóa học cho topic được nhắc đến nhiều nhất</li>
            <li>Bạn có thể chọn đồng ý để nhảy đến trang quản lý khóa học</li>
          </ul>
        }
        type="info"
        showIcon
      />
    </div>
  )
}
