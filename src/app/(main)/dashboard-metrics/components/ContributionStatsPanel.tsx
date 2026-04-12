"use client"

import React, { useEffect, useState } from "react"
import { Card, Spin, Row, Col } from "antd"
import {
  FileTextOutlined,
  QuestionCircleOutlined,
  CommentOutlined,
} from "@ant-design/icons"
import { getContributionStatsMetrics } from "@/action/metrics/metricsActions"
import useUserStore from "@/store/useUserStore"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { ContributionStatsData } from "@/service/metrics.service"

export default function ContributionStatsPanel() {
  const { user } = useUserStore()
  const { language } = useLanguageStore()
  const [stats, setStats] = useState<ContributionStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        const result = await getContributionStatsMetrics(user.id)
        setStats(result)
      } catch (error) {
        console.error("Error loading contribution stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const StatItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ReactNode
    label: string
    value: number
  }) => (
    <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition">
      <div className="text-3xl text-blue-600">{Icon}</div>
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-700">{value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
      </div>
    </div>
  )

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <CommentOutlined className="text-purple-600 text-lg" />
          <span>{t("dashboard.metrics.contribution_stats", language)}</span>
        </div>
      }
      className="shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : stats ? (
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={8}>
            <StatItem
              icon={<FileTextOutlined />}
              label={t("dashboard.metrics.articles", language)}
              value={stats.articles}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatItem
              icon={<QuestionCircleOutlined />}
              label={t("dashboard.metrics.questions", language)}
              value={stats.questions}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatItem
              icon={<CommentOutlined />}
              label={t("dashboard.metrics.answers", language)}
              value={stats.answers}
            />
          </Col>
        </Row>
      ) : null}
    </Card>
  )
}
