"use client"

import React, { useEffect, useState } from "react"
import { Card, Spin } from "antd"
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { getUnansweredQuestionsMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { UnansweredQuestionData } from "@/service/metrics.service"

const COLORS = ["#52c41a", "#faad14"]

export default function UnansweredQuestionsChart() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<UnansweredQuestionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getUnansweredQuestionsMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading unanswered questions data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const chartData = data
    ? [
        { name: "Đã trả lời", value: data.resolved },
        { name: "Chưa trả lời", value: data.unresolved },
      ]
    : []

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <QuestionCircleOutlined className="text-orange-600 text-lg" />
          <span>{t("dashboard.metrics.unanswered_questions", language)}</span>
        </div>
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : !data ? (
        <div className="text-center text-gray-400 py-10">Chưa có dữ liệu</div>
      ) : (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent = 0 }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 text-center mt-6">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                {t("dashboard.metrics.answered", language)}
              </div>
              <div className="text-2xl font-bold text-green-600">
                {data.resolved}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                {t("dashboard.metrics.unanswered", language)}
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {data.unresolved}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                {t("dashboard.metrics.resolution_rate", language)}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {data.resolutionRate}%
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
