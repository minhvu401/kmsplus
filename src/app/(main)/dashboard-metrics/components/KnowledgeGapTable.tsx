"use client"

import React, { useEffect, useState } from "react"
import { Table, Card, Spin } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { getKnowledgeGapMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { KnowledgeGapData } from "@/service/metrics.service"

export default function KnowledgeGapTable() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<KnowledgeGapData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getKnowledgeGapMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading knowledge gap data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const columns = [
    {
      title: language === "vi" ? "Từ khóa" : "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: t("dashboard.metrics.search_count", language),
      dataIndex: "searchCount",
      key: "searchCount",
      sorter: (a: KnowledgeGapData, b: KnowledgeGapData) =>
        b.searchCount - a.searchCount,
      render: (count: number) => (
        <span className="text-red-600 font-semibold">{count}</span>
      ),
    },
    {
      title: language === "vi" ? "Trạng thái" : "Status",
      key: "action",
      render: () => (
        <span className="text-orange-600 font-medium">
          {t("dashboard.metrics.no_results", language)}
        </span>
      ),
    },
  ]

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <SearchOutlined className="text-blue-600 text-lg" />
          <span>{t("dashboard.metrics.knowledge_gap", language)}</span>
        </div>
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data.map((item, index) => ({
            ...item,
            key: index,
          }))}
          pagination={{ pageSize: 5 }}
          size="small"
          className="bg-white"
        />
      )}
    </Card>
  )
}
