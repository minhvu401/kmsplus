"use client"

import React from "react"
import { Breadcrumb, Tag } from "antd"
import {
  HomeOutlined,
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StarFilled,
} from "@ant-design/icons"
import useLanguageStore from "@/store/useLanguageStore"

interface EnrollmentHeaderProps {
  courseId: string
  courseName: string
  totalEnrolled: number
  avgCompletion: number
  courseRating: number
  reviewCount: number
}

export default function EnrollmentHeader({
  courseId,
  courseName,
  totalEnrolled,
  avgCompletion,
  courseRating,
  reviewCount,
}: EnrollmentHeaderProps) {
  const { language } = useLanguageStore()

  return (
    <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/50 p-6 shadow-sm">
      <Breadcrumb
        className="mb-4"
        items={[
          { title: <HomeOutlined />, href: "/dashboard-metrics" },
          {
            title: language === "vi" ? "Khóa học" : "Courses",
            href: "/courses/management",
          },
          {
            title: (
              <span className="font-semibold text-blue-700">
                {language === "vi" ? "Ghi danh" : "Enrollments"}
              </span>
            ),
          },
        ]}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Tag color="blue" className="!rounded-full px-3 py-0.5 text-xs">
              {language === "vi" ? "Mã khóa học" : "Course ID"}: {courseId}
            </Tag>
            <Tag className="!rounded-full px-3 py-0.5 text-xs text-gray-600">
              {language === "vi"
                ? "Phân tích ghi danh"
                : "Enrollment Analytics"}
            </Tag>
          </div>
          <h1 className="m-0 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-3xl font-bold text-transparent">
            {courseName}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            {language === "vi"
              ? "Theo dõi hiệu suất ghi danh, mức độ hoàn thành của học viên và các chỉ số chất lượng khóa học tại một nơi."
              : "Track enrollment performance, learner completion, and course quality indicators for this course in one place."}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 md:w-auto">
          <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <TeamOutlined className="text-blue-600" />
              {language === "vi" ? "Tổng ghi danh" : "Total Enrolled"}
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {totalEnrolled.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <CheckCircleOutlined className="text-blue-600" />
              {language === "vi"
                ? "Tỷ lệ hoàn thành TB"
                : "Avg Completion"}
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {avgCompletion}%
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <StarFilled className="text-blue-600" />
              {language === "vi" ? "Đánh giá khóa học" : "Course Rating"}
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900">{courseRating}</span>
              <span className="mb-1 text-xs font-semibold text-blue-600">
                {language === "vi"
                  ? `từ ${reviewCount.toLocaleString()} đánh giá`
                  : `from ${reviewCount.toLocaleString()} review(s)`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
