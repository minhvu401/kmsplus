/**
 * Average Content Rating Component
 * Displays content rating with star visualization and trend line
 */

"use client"

import React, { useEffect, useState } from "react"
import { Card, Rate, Empty, Row, Col, Statistic, Space } from "antd"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import MetricCard from "./MetricCard"
import { 
  getContentRatingMetrics,
  getCurrentAverageRatingAction,
} from "@/action/metrics/metricsActions"
import type { ContentRatingData } from "@/service/metrics.service"
import { StarOutlined } from "@ant-design/icons"

export default function ContentRatingChart() {
  const [data, setData] = useState<ContentRatingData[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const metricsData = await getContentRatingMetrics()
        setData(metricsData)
        
        // Calculate average rating
        const avgRating = await getCurrentAverageRatingAction(metricsData)
        setAverageRating(avgRating)
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
      title="Average Content Rating"
      description="Overall satisfaction and quality rating of courses and content"
      info="Based on employee feedback and course reviews"
      animate="delay-2"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Space direction="vertical" className="w-full">
            <Statistic
              title="Current Average Rating"
              value={averageRating}
              suffix="/ 5.0"
              valueStyle={{ color: "#1890ff", fontSize: "2rem", fontWeight: "bold" }}
              prefix={<StarOutlined className="mr-1 text-blue-500" />}
            />
            <div className="mt-4">
              <Rate
                value={Math.round(averageRating * 2) / 2}
                allowHalf
                disabled
                style={{ fontSize: 24, color: "#1890ff" }}
              />
            </div>
          </Space>
        </Col>
        <Col xs={24} lg={16}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6f4ff" />
              <XAxis dataKey="month" stroke="#8c8c8c" />
              <YAxis domain={[0, 5]} stroke="#8c8c8c" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#f6f8fc", 
                  border: "1px solid #d9e8ff",
                  borderRadius: "8px"
                }}
                formatter={(value) => `${value} stars`}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#1890ff"
                strokeWidth={3}
                dot={{ fill: "#1890ff", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name="Rating Trend"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </Col>
      </Row>
    </MetricCard>
  )
}
