"use client"

import React, { useEffect, useState } from "react"
import { Card, List, Badge, Button, Tag, Empty, Spin } from "antd"
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"
import { getMandatoryCoursesMetrics } from "@/action/metrics/metricsActions"
import useUserStore from "@/store/useUserStore"
import type { MandatoryCourseData } from "@/service/metrics.service"
import Link from "next/link"

export default function MandatoryCoursesPanel() {
  const { user } = useUserStore()
  const [courses, setCourses] = useState<MandatoryCourseData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        const result = await getMandatoryCoursesMetrics(user.id)
        setCourses(result)
      } catch (error) {
        console.error("Error loading mandatory courses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const getStatusColor = (course: MandatoryCourseData) => {
    if (course.isOverdue) return "red"
    if (course.daysUntilDue <= 7) return "orange"
    return "default"
  }

  const getStatusIcon = (course: MandatoryCourseData) => {
    if (course.isOverdue) return <ExclamationCircleOutlined />
    if (course.daysUntilDue <= 7) return <ClockCircleOutlined />
    return <CheckCircleOutlined />
  }

  const getStatusText = (course: MandatoryCourseData) => {
    if (course.isOverdue) return `Quá hạn ${Math.abs(course.daysUntilDue)} ngày`
    if (course.daysUntilDue <= 0) return "Hôm nay là hạn"
    return `Còn ${course.daysUntilDue} ngày`
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined className="text-red-600 text-lg" />
          <span>Khóa học bắt buộc sắp hết hạn</span>
        </div>
      }
      className="shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : courses.length === 0 ? (
        <Empty description="Không có khóa học bắt buộc sắp hết hạn" />
      ) : (
        <List
          dataSource={courses}
          renderItem={(course) => (
            <List.Item
              key={course.id}
              className={`!p-4 border-l-4 ${
                course.isOverdue ? "border-l-red-500" : "border-l-orange-500"
              } rounded`}
            >
              <List.Item.Meta
                avatar={getStatusIcon(course)}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{course.title}</span>
                    <Badge
                      color={getStatusColor(course)}
                      text={getStatusText(course)}
                    />
                  </div>
                }
                description={
                  <div className="text-sm text-gray-600">
                    Hạn: {new Date(course.dueDate).toLocaleDateString("vi-VN")}
                  </div>
                }
              />
              <div className="flex items-center gap-2">
                <Tag color={getStatusColor(course)}>
                  {course.status === "pending" ? "Chưa bắt đầu" : "Đang học"}
                </Tag>
                <Link href={`/courses/${course.id}`}>
                  <Button type="primary" size="small">
                    Đi học
                  </Button>
                </Link>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
