/**
 * MetricCard Component
 * Reusable card wrapper with enhanced styling for metric displays
 */

import React from "react"
import { Card, Tooltip } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"

interface MetricCardProps {
  title: string
  description?: string
  children: React.ReactNode
  info?: string
  className?: string
  animate?: "delay-0" | "delay-1" | "delay-2"
}

export default function MetricCard({
  title,
  description,
  children,
  info,
  className = "",
  animate = "delay-0",
}: MetricCardProps) {
  const animationDelayMap = {
    "delay-0": "animate-fadeIn",
    "delay-1": "animate-fadeInUp",
    "delay-2": "animate-fadeInUp",
  }

  const delayMap = {
    "delay-0": "0s",
    "delay-1": "0.15s",
    "delay-2": "0.3s",
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">{title}</span>
          {info && (
            <Tooltip title={info}>
              <InfoCircleOutlined className="text-gray-400 hover:text-blue-500 transition-colors cursor-help" />
            </Tooltip>
          )}
        </div>
      }
      variant="borderless"
      className={`
        h-full shadow-sm
        bg-gradient-to-br from-white via-blue-50/30 to-white
        border border-blue-100/40
        rounded-lg
        transition-all duration-500
        hover:shadow-lg hover:border-blue-200/60
        hover:from-white hover:via-blue-50/50 hover:to-blue-50/20
        ${animationDelayMap[animate]}
        ${className}
      `}
      style={{
        animationDelay: delayMap[animate],
      }}
      styles={{
        body: {
          padding: "24px",
        },
        header: {
          borderBottom: "1px solid rgba(24, 144, 255, 0.1)",
          paddingBottom: "16px",
          background: "transparent",
        },
      }}
    >
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {children}
    </Card>
  )
}
