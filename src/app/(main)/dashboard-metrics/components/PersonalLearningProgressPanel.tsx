"use client"

import React, { useEffect, useState } from "react"
import { Card, Progress, List, Empty, Spin, Space } from "antd"
import { BookOutlined, CalendarOutlined } from "@ant-design/icons"
import { getPersonalLearningProgressMetrics } from "@/action/metrics/metricsActions"
import useUserStore from "@/store/useUserStore"
import type { PersonalLearningProgressData } from "@/service/metrics.service"
import Link from "next/link"

export default function PersonalLearningProgressPanel() {
  const { user } = useUserStore()
  const [progress, setProgress] = useState<PersonalLearningProgressData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        const result = await getPersonalLearningProgressMetrics(user.id)
        setProgress(result)
      } catch (error) {
        console.error("Error loading personal learning progress:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const getProgressColor = (percentage: number) => {
    if (percentage < 33) return "red"
    if (percentage < 66) return "orange"
    return "green"
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BookOutlined className="text-blue-600 text-lg" />
          <span>Tiến độ học tập của tôi</span>
        </div>
      }
      className="shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : progress.length === 0 ? (
        <Empty description="Chưa có khóa học nào" />
      ) : (
        <List
          dataSource={progress}
          renderItem={(item) => (
            <List.Item
              key={item.courseId}
              className="!p-4 border-b border-gray-200 hover:bg-gray-50 transition"
            >
              <List.Item.Meta
                title={
                  <Link
                    href={`/courses/${item.courseId}`}
                    className="font-semibold hover:text-blue-600"
                  >
                    {item.courseTitle}
                  </Link>
                }
                description={
                  <Space size="small">
                    <CalendarOutlined className="text-xs" />
                    <span className="text-xs text-gray-500">
                      Cập nhật:{" "}
                      {new Date(item.lastUpdated).toLocaleDateString("vi-VN")}
                    </span>
                  </Space>
                }
              />
              <div className="flex items-center gap-4">
                <div style={{ width: 200 }}>
                  <Progress
                    percent={item.progressPercentage}
                    status={
                      item.progressPercentage === 100 ? "success" : "active"
                    }
                    strokeColor={getProgressColor(item.progressPercentage)}
                  />
                </div>
                <span className="font-semibold min-w-12 text-right">
                  {item.progressPercentage}%
                </span>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
