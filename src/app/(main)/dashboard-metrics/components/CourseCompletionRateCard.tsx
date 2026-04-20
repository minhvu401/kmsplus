/**
 * Course Completion Rate Card Component
 * Displays overall course completion rate as Big Number Card with change indicator
 */

"use client"

import React, { useEffect, useState } from "react"
import { Card, Statistic, Row, Col, Empty, Space, Tag } from "antd"
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  BookOutlined,
} from "@ant-design/icons"
import MetricCard from "./MetricCard"
import { getCourseCompletionRateMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { CourseCompletionRateData } from "@/service/metrics.service"

export default function CourseCompletionRateCard() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<CourseCompletionRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const metricsData = await getCourseCompletionRateMetrics()
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
  if (!data)
    return (
      <Card>
        <Empty />
      </Card>
    )

  const isIncreased = data.change > 0
  const percentageIcon = isIncreased ? (
    <ArrowUpOutlined className="text-green-500" />
  ) : (
    <ArrowDownOutlined className="text-red-500" />
  )

  return (
    <MetricCard
      title={t("dashboard.metrics.course_completion_rate", language)}
      description={t("dashboard.metrics.training_effectiveness", language)}
      info={t("dashboard.metrics.completion_percent", language)}
      animate="delay-0"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Statistic
            title={t("dashboard.metrics.completion_rate", language)}
            value={data.completionRate}
            suffix="%"
            valueStyle={{
              color: "#1890ff",
              fontSize: "2.5rem",
              fontWeight: "bold",
            }}
            prefix={<BookOutlined className="mr-2" />}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Space direction="vertical" className="w-full">
            <div>
              <span className="text-gray-500">
                {t("dashboard.metrics.previous_month", language)}{" "}
              </span>
              <span className="text-lg font-semibold">
                {data.previousMonthRate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                {t("dashboard.metrics.change", language)}{" "}
              </span>
              <Tag
                color={isIncreased ? "success" : "error"}
                icon={percentageIcon}
              >
                {isIncreased ? "+" : ""}
                {data.change}%
              </Tag>
            </div>
          </Space>
        </Col>
      </Row>
    </MetricCard>
  )
}
