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
import { UserAddOutlined } from "@ant-design/icons"
import { getNewUsersGrowthMetrics } from "@/action/metrics/metricsActions"
import type { NewUsersGrowthData } from "@/service/metrics.service"

export default function NewUsersGrowthChart() {
  const [data, setData] = useState<NewUsersGrowthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getNewUsersGrowthMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading new users growth:", error)
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
          <UserAddOutlined className="text-green-600 text-lg" />
          <span>Tốc độ tăng trưởng người dùng mới</span>
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
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis
              label={{
                value: "Người dùng mới",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
              }}
            />
            <Legend />
            <Bar dataKey="newUsers" fill="#52c41a" name="Người dùng mới" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
