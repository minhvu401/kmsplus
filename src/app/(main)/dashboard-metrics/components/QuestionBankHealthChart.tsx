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
  Cell,
} from "recharts"
import { BankOutlined } from "@ant-design/icons"
import { getQuestionBankHealthMetrics } from "@/action/metrics/metricsActions"
import type { QuestionBankHealthData } from "@/service/metrics.service"

export default function QuestionBankHealthChart() {
  const [data, setData] = useState<QuestionBankHealthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getQuestionBankHealthMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading question bank health data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Transform data for display
  const chartData = [
    {
      name: "Ngân hàng câu hỏi",
      Dễ: data.find((d) => d.difficulty === "Dễ")?.count || 0,
      TB: data.find((d) => d.difficulty === "TB")?.count || 0,
      Khó: data.find((d) => d.difficulty === "Khó")?.count || 0,
    },
  ]

  const colors = {
    Dễ: "#52c41a",
    TB: "#faad14",
    Khó: "#f5222d",
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BankOutlined className="text-blue-600 text-lg" />
          <span>Sức khỏe ngân hàng câu hỏi (Question Bank Health)</span>
        </div>
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Dễ" stackId="a" fill={colors.Dễ} />
              <Bar dataKey="TB" stackId="a" fill={colors.TB} />
              <Bar dataKey="Khó" stackId="a" fill={colors.Khó} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {data.map((item) => (
              <div
                key={item.difficulty}
                className="bg-gray-50 p-4 rounded-lg text-center"
              >
                <div className="text-sm font-medium mb-2">
                  {item.difficulty}
                </div>
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl font-bold"
                  style={{
                    backgroundColor:
                      colors[item.difficulty as keyof typeof colors],
                  }}
                >
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
