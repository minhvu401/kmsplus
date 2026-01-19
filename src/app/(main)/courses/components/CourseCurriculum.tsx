// @/app/(main)/courses/components/CourseCurriculum.tsx
// COMPONENT: Hiển thị Giáo Trình (Curriculum) của Khóa Học

"use client"

import React from "react"
import { Collapse, Tag } from "antd"
import {
  PlayCircleOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons"

// Định nghĩa lại Type cho props (khớp với dữ liệu từ Service trả về)
interface CurriculumItem {
  id: string | number
  title: string
  type: "lesson" | "quiz"
  duration_minutes?: number | null
  question_count?: number
}

interface Section {
  id: string | number
  title: string
  order: number
  items: CurriculumItem[]
}

interface CourseCurriculumProps {
  sections: Section[]
}

export default function CourseCurriculum({ sections }: CourseCurriculumProps) {
  // Hàm helper để render Icon dựa trên loại bài học
  const renderIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <PlayCircleOutlined className="text-blue-500 text-lg" />
      case "quiz":
        return <QuestionCircleOutlined className="text-orange-500 text-lg" />
      default:
        return <FileTextOutlined className="text-gray-500 text-lg" />
    }
  }

  // Hàm helper format thời gian (ví dụ: 5 -> 05:00 hoặc 5 phút)
  const formatDuration = (minutes: number) => {
    if (!minutes) return ""
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h} giờ ${m} phút`
    return `${m} phút`
  }

  // Cấu hình dữ liệu cho Antd Collapse
  const items = sections.map((section) => {
    const totalDuration = section.items.reduce(
      (acc, item) => acc + (item.duration_minutes || 0),
      0
    )
    const lessonCount = section.items.length

    return {
      key: section.id,
      // Header của Section (Ví dụ: Chương 1: Giới thiệu...)
      label: (
        <div className="flex justify-between items-center w-full pr-4">
          <span className="font-semibold text-gray-800 text-base">
            {section.title}
          </span>
          <span className="text-xs text-gray-500 font-normal hidden sm:block">
            {lessonCount} bài học • {formatDuration(totalDuration)}
          </span>
        </div>
      ),
      // Nội dung bên trong (Danh sách bài học)
      children: (
        <div className="flex flex-col">
          {section.items.length === 0 ? (
            <div className="text-gray-400 italic pl-8 py-2">
              Chưa có nội dung
            </div>
          ) : (
            section.items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {renderIcon(item.type)}
                  <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                    {index + 1}. {item.title}
                  </span>
                </div>

                {/* Metadata bên phải (Thời lượng hoặc số câu hỏi) */}
                <div className="text-xs text-gray-500">
                  {item.type === "lesson" && item.duration_minutes ? (
                    <span className="flex items-center gap-1">
                      <ClockCircleOutlined />{" "}
                      {formatDuration(item.duration_minutes)}
                    </span>
                  ) : item.type === "quiz" ? (
                    <Tag color="orange">{item.question_count} câu hỏi</Tag>
                  ) : (
                    <Tag>PDF</Tag> // Nếu bạn có loại file
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ),
    }
  })

  return (
    <div className="curriculum-container">
      {sections.length > 0 ? (
        <Collapse
          items={items}
          defaultActiveKey={[sections[0]?.id]} // Mặc định mở chương đầu tiên
          expandIconPosition="start"
          className="bg-white border-gray-200 rounded-lg shadow-sm"
          // Tùy chỉnh style cho header của Collapse để giống hình mẫu
          expandIcon={({ isActive }) => (
            <div
              className={`transform transition-transform duration-200 ${
                isActive ? "rotate-90" : "rotate-0"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-chevron-right text-gray-400 w-4 h-4"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          )}
        />
      ) : (
        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
          Chưa có giáo trình nào được cập nhật.
        </div>
      )}
    </div>
  )
}
