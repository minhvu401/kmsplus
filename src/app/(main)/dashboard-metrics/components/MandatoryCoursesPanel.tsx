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
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type { MandatoryCourseData } from "@/service/metrics.service"
import Link from "next/link"

export default function MandatoryCoursesPanel() {
  const { user } = useUserStore()
  const { language } = useLanguageStore()
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
    if (course.isOverdue) {
      return `${t("dashboard.metrics.days_overdue", language)} ${Math.abs(course.daysUntilDue)} ${t("dashboard.metrics.days_unit", language)}`
    }
    if (course.daysUntilDue <= 0)
      return t("dashboard.metrics.today_is_due", language)
    return `${t("dashboard.metrics.days_unit", language)} ${course.daysUntilDue} ${t("dashboard.metrics.days_unit", language)}`
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined className="text-red-600 text-lg" />
          <span>{t("dashboard.metrics.mandatory_courses", language)}</span>
        </div>
      }
      className="shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : courses.length === 0 ? (
        <Empty
          description={t("dashboard.metrics.no_mandatory_courses", language)}
        />
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
                    {t("dashboard.metrics.due_date", language)}{" "}
                    {new Date(course.dueDate).toLocaleDateString(
                      language === "vi" ? "vi-VN" : "en-GB"
                    )}
                  </div>
                }
              />
              <div className="flex items-center gap-2">
                <Tag color={getStatusColor(course)}>
                  {course.status === "pending"
                    ? t("dashboard.metrics.not_started", language)
                    : t("dashboard.metrics.in_progress", language)}
                </Tag>
                <Link href={`/courses/${course.id}`}>
                  <Button type="primary" size="small">
                    {t("dashboard.metrics.start_learning", language)}
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
