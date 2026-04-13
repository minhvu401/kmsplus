/**
 * StatCard Component
 * Quick stat display with icon and change indicator
 */

import React from "react"
import { Card, Row, Col } from "antd"
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  unit?: string
  change?: string
  positive?: boolean
}

export default function StatCard({
  icon,
  title,
  value,
  unit,
  change,
  positive = true,
}: StatCardProps) {
  return (
    <Card
      variant="borderless"
      className="
        bg-white rounded-lg
        border border-blue-100/50
        shadow-sm
        transition-all duration-300
        hover:shadow-md hover:border-blue-200
        cursor-default
        animate-fadeIn
      "
      styles={{ body: { padding: "20px" } }}
    >
      <Row gutter={16} align="middle">
        <Col>
          <div
            className="
              flex items-center justify-center
              w-12 h-12 rounded-lg
              bg-gradient-to-br from-blue-100 to-blue-50
              text-blue-600 text-xl
            "
          >
            {icon}
          </div>
        </Col>
        <Col flex="auto">
          <div className="text-sm text-gray-500 font-medium mb-1">{title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {change && (
            <div className="text-xs mt-2 flex items-center gap-1">
              <span
                className={`flex items-center gap-0.5 font-semibold ${
                  positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {change}
              </span>
              <span className="text-gray-400">from last month</span>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  )
}
