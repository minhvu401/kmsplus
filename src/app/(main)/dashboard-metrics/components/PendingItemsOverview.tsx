"use client"

import React, { useEffect, useState } from "react"
import { Card, Badge, Button, Spin } from "antd"
import { FileTextOutlined, BookOutlined } from "@ant-design/icons"
import { getPendingItemsMetrics } from "@/action/metrics/metricsActions"
import type { PendingItemsData } from "@/service/metrics.service"
import Link from "next/link"

export default function PendingItemsOverview() {
  const [data, setData] = useState<PendingItemsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getPendingItemsMetrics()
        setData(result)
      } catch (error) {
        console.error("Error loading pending items:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Pending Articles */}
      <Card className="shadow-md border-0 hover:shadow-lg transition">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="text-6xl text-blue-600 font-bold">
                {data?.articles || 0}
              </div>
              <Badge
                count={data?.articles || 0}
                className="absolute -top-2 -right-2"
                style={{
                  backgroundColor: data?.articles ? "#ff4d4f" : "#52c41a",
                }}
              />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileTextOutlined className="text-lg" />
                <span className="font-semibold">Bài viết đang chờ duyệt</span>
              </div>
              <p className="text-sm text-gray-500">Cần xem xét và phê duyệt</p>
            </div>
            <Link href="/content-management/articles?status=pending">
              <Button type="primary" ghost>
                Xem chi tiết
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Pending Courses */}
      <Card className="shadow-md border-0 hover:shadow-lg transition">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="text-6xl text-purple-600 font-bold">
                {data?.courses || 0}
              </div>
              <Badge
                count={data?.courses || 0}
                className="absolute -top-2 -right-2"
                style={{
                  backgroundColor: data?.courses ? "#ff4d4f" : "#52c41a",
                }}
              />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BookOutlined className="text-lg" />
                <span className="font-semibold">Khóa học đang chờ duyệt</span>
              </div>
              <p className="text-sm text-gray-500">Cần xem xét và phê duyệt</p>
            </div>
            <Link href="/course-management?status=pending">
              <Button type="primary" ghost>
                Xem chi tiết
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
