"use client"

import React, { useEffect, useState } from "react"
import { Card, Avatar, Table, Tabs, Spin } from "antd"
import { TrophyOutlined } from "@ant-design/icons"
import {
  getTopContributorsMetrics,
  getTopLearnersMetrics,
} from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { ContributorData } from "@/service/metrics.service"

export default function TopContributorsTable() {
  const { language } = useLanguageStore()
  const [contributors, setContributors] = useState<ContributorData[]>([])
  const [learners, setLearners] = useState<ContributorData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contributorsData, learnersData] = await Promise.all([
          getTopContributorsMetrics(),
          getTopLearnersMetrics(),
        ])
        setContributors(contributorsData)
        setLearners(learnersData)
      } catch (error) {
        console.error("Error loading leaderboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const renderLeaderboard = (
    data: ContributorData[],
    type: "contributor" | "learner"
  ) => {
    if (data.length === 0) {
      return (
        <div className="text-center text-gray-400 py-10">
          {t("dashboard.metrics.no_data", language)}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-blue-600 w-8">
                #{index + 1}
              </div>
              <Avatar src={item.avatar} size="large" />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {type === "contributor"
                    ? t("dashboard.metrics.contributor_type", language)
                    : t("dashboard.metrics.learner_type", language)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {item.contributions}
              </div>
              <div className="text-xs text-gray-500">
                {type === "contributor"
                  ? t("dashboard.metrics.contribution", language)
                  : t("dashboard.metrics.courses_completed", language)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-yellow-600 text-lg" />
          <span>{t("dashboard.metrics.top_contributors", language)}</span>
        </div>
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <Tabs
          items={[
            {
              key: "contributors",
              label: t("dashboard.metrics.contributors_tab", language),
              children: renderLeaderboard(contributors, "contributor"),
            },
            {
              key: "learners",
              label: t("dashboard.metrics.learners_tab", language),
              children: renderLeaderboard(learners, "learner"),
            },
          ]}
        />
      )}
    </Card>
  )
}
