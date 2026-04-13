/**
 * System Adoption Rate Component
 * Displays System Adoption Rate as Gauge Chart
 */

"use client"

import React, { useEffect, useState } from "react"
import { Card, Spin, Empty, Row, Col, Statistic } from "antd"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import MetricCard from "./MetricCard"
import { getAdoptionRateMetrics } from "@/action/metrics/metricsActions"
import type { AdoptionRateData } from "@/service/metrics.service"
import { ArrowUpOutlined } from "@ant-design/icons"

export default function SystemAdoptionRateChart() {
  const [data, setData] = useState<AdoptionRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const metricsData = await getAdoptionRateMetrics()
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
  if (!data) return <Card><Empty /></Card>

  // Prepare gauge data: adoption rate vs remaining
  const gaugeData = [
    { name: "Adopted", value: data.adoptionRate },
    { name: "Not Adopted", value: 100 - data.adoptionRate },
  ]

  const COLORS = ["#1890ff", "#e6f4ff"]

  return (
    <MetricCard
      title="System Adoption Rate"
      description="Percentage of employees using the platform"
      info="Higher adoption indicates better platform integration"
      animate="delay-1"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                fill="#1890ff"
                paddingAngle={2}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Col>
        <Col xs={24} lg={12}>
          <div className="flex flex-col justify-center h-full gap-6">
            <Statistic
              title="Adoption Rate"
              value={data.adoptionRate}
              suffix="%"
              prefix={<ArrowUpOutlined className="text-green-500" />}
              valueStyle={{ color: "#1890ff", fontSize: "2.5rem" }}
            />
            <Statistic
              title="Active Users"
              value={data.activeUsers}
              suffix={`/ ${data.totalUsers}`}
              valueStyle={{ fontSize: "1.5rem" }}
            />
          </div>
        </Col>
      </Row>
    </MetricCard>
  )
}
