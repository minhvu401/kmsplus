/**
 * Top Performing Categories Chart Component
 * Displays top performing categories as Horizontal Bar Chart
 */

"use client"

import React, { useEffect, useState } from "react"
import { Card, Spin, Empty } from "antd"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import MetricCard from "./MetricCard"
import { getTopCategoriesMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { TopCategoryData } from "@/service/metrics.service"

export default function TopCategoriesChart() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<TopCategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const metricsData = await getTopCategoriesMetrics()
        setData(metricsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) return <Card loading />
  if (error)
    return (
      <Card>
        <Empty description={`Error: ${error}`} />
      </Card>
    )

  return (
    <MetricCard
      title={t("dashboard.metrics.top_categories", language)}
      description={t("dashboard.metrics.top_categories_desc", language)}
      info={t("dashboard.metrics.based_enrollments", language)}
      animate="delay-1"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e6f4ff" />
          <XAxis type="number" stroke="#8c8c8c" />
          <YAxis
            dataKey="category"
            type="category"
            width={140}
            stroke="#8c8c8c"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#f6f8fc",
              border: "1px solid #d9e8ff",
              borderRadius: "8px",
            }}
            formatter={(value) => `${value} enrollments`}
            cursor={{ fill: "rgba(24, 144, 255, 0.1)" }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Bar
            dataKey="value"
            fill="#1890ff"
            radius={[0, 8, 8, 0]}
            name={t("dashboard.metrics.enrollment_views", language)}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </MetricCard>
  )
}
