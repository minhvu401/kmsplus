"use client"

import React, { useEffect, useState } from "react"
import { Card, Spin } from "antd"
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
import { AlertOutlined } from "@ant-design/icons"
import { getCourseDropoffRateMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { CourseDropoffRateData } from "@/service/metrics.service"

export default function CourseDropoffRateChart() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<CourseDropoffRateData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getCourseDropoffRateMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading course dropoff data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <AlertOutlined className="text-orange-600 text-lg" />
          <span>{t("dashboard.metrics.course_dropoff", language)}</span>
        </div>
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-400 py-10">Chưa có dữ liệu</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="courseTitle"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis
              label={{ value: "Tỷ lệ (%)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
              }}
              formatter={(value: any) => `${value}%`}
            />
            <Legend />
            <Bar dataKey="dropoffRate" fill="#ff7875" name="Tỷ lệ bỏ học" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
