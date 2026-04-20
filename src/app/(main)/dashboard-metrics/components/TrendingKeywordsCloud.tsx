"use client"

import React, { useEffect, useState } from "react"
import { Card, Spin } from "antd"
import { CloudOutlined } from "@ant-design/icons"
import { getTrendingKeywordsMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { TrendingKeywordData } from "@/service/metrics.service"

export default function TrendingKeywordsCloud() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<TrendingKeywordData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getTrendingKeywordsMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading trending keywords:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Normalize frequencies for font sizing
  const maxFreq =
    data.length > 0 ? Math.max(...data.map((d) => d.frequency)) : 1
  const minFreq =
    data.length > 0 ? Math.min(...data.map((d) => d.frequency)) : 1

  const getSize = (frequency: number) => {
    const minSize = 12
    const maxSize = 32
    const normalized = (frequency - minFreq) / (maxFreq - minFreq || 1)
    return minSize + normalized * (maxSize - minSize)
  }

  const colors = [
    "text-blue-600",
    "text-purple-600",
    "text-pink-600",
    "text-indigo-600",
    "text-cyan-600",
    "text-teal-600",
  ]

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <CloudOutlined className="text-blue-600 text-lg" />
          <span>{t("dashboard.metrics.trending_keywords_desc", language)}</span>
        </div>
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-center items-center p-8">
          {data.map((item, index) => (
            <div
              key={index}
              className={`${colors[index % colors.length]} hover:opacity-80 cursor-default transition-opacity`}
              style={{ fontSize: `${getSize(item.frequency)}px` }}
              title={`${item.frequency} ${t("dashboard.metrics.times", language)}`}
            >
              {item.keyword}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
