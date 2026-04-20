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
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

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
  const { language } = useLanguageStore()

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
                  {t("ai_suggestion.title", language)}
                </h3>
              </div>
              <Tag color="blue">{t("ai_suggestion.tag_from_ai", language)}</Tag>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Suggestion Content */}
            <div className="bg-white p-4 rounded-lg">
              <p
                className="text-gray-600 mb-3"
                dangerouslySetInnerHTML={{
                  __html: t("ai_suggestion.suggestion_text", language)
                    .replace("{days}", suggestion.date_range.toString())
                    .replace("{topic}", suggestion.topic)
                    .replace("{count}", suggestion.topic_count.toString()),
                }}
              />
              <p className="text-gray-700">
                {t("ai_suggestion.question_create", language)}
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
                {t("ai_suggestion.btn_approve", language)}
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleDismiss}
                loading={actionLoading}
                size="large"
              >
                {t("ai_suggestion.btn_dismiss", language)}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {dismissed && (
        <Alert
          message={t("ai_suggestion.dismissed_message", language)}
          description={t("ai_suggestion.dismissed_desc", language)}
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* Topic Analysis Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {t("ai_suggestion.analysis_title", language)}
            </h3>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Date Range Selector */}
          <div className="flex gap-4 items-center flex-wrap">
            <label className="font-medium">
              {t("ai_suggestion.analyze_within", language)}
            </label>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <Button
                  key={days}
                  type={selectedDays === days ? "primary" : "default"}
                  onClick={() => setSelectedDays(days)}
                >
                  {days === 7 && t("ai_suggestion.btn_days_7", language)}
                  {days === 14 && t("ai_suggestion.btn_days_14", language)}
                  {days === 30 && t("ai_suggestion.btn_days_30", language)}
                </Button>
              ))}
            </div>
            <Button
              type="primary"
              onClick={handleAnalyzeTopics}
              loading={loading}
            >
              {t("ai_suggestion.btn_analyze", language)}
            </Button>
          </div>

          {/* Topics List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Spin />
              <span className="text-gray-500 text-sm">
                {t("ai_suggestion.loading", language)}
              </span>
            </div>
          ) : topics.length === 0 ? (
            <Empty description={t("ai_suggestion.no_topics", language)} />
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
                        {t("ai_suggestion.mentioned", language)}{" "}
                        <strong>{topic.count}</strong>{" "}
                        {t("ai_suggestion.times_label", language)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Tag color="blue" className="text-xs">
                        {topic.confidence.toFixed(1)}%{" "}
                        {t("ai_suggestion.relevance_label", language)}
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
        message={t("ai_suggestion.how_to_use", language)}
        description={
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>{t("ai_suggestion.help_1", language)}</li>
            <li>{t("ai_suggestion.help_2", language)}</li>
            <li>{t("ai_suggestion.help_3", language)}</li>
            <li>{t("ai_suggestion.help_4", language)}</li>
          </ul>
        }
        type="info"
        showIcon
      />
    </div>
  )
}
