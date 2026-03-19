/**
 * Active Users Chart Component
 * Displays Total Active Users (MAU/DAU) as Line Chart
 */

"use client"

import React, { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, Spin, Empty } from "antd"
import MetricCard from "./MetricCard"
import { getActiveUsersMetrics } from "@/action/metrics/metricsActions"
import type { ActiveUsersData } from "@/service/metrics.service"

export default function ActiveUsersChart() {
  const [data, setData] = useState<ActiveUsersData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const metricsData = await getActiveUsersMetrics()
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
  if (error) return <Card><Empty description={`Error: ${error}`} /></Card>

  return (
    <MetricCard
      title="Total Active Users"
      description="Monthly Active Users (MAU) and Daily Active Users (DAU) trend"
      info="Track user engagement and platform adoption over time"
      animate="delay-0"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6f4ff" />
          <XAxis dataKey="month" stroke="#8c8c8c" />
          <YAxis stroke="#8c8c8c" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#f6f8fc", 
              border: "1px solid #d9e8ff",
              borderRadius: "8px"
            }}
            formatter={(value) => `${value} users`}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Line
            type="monotone"
            dataKey="activeUsers"
            stroke="#1890ff"
            strokeWidth={3}
            dot={{ fill: "#1890ff", r: 5, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 7, strokeWidth: 2 }}
            name="Active Users"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </MetricCard>
  )
}
