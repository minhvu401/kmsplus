// @/app/(main)/courses/components/CourseCurriculum.tsx
// COMPONENT: Hiển thị Giáo Trình (Curriculum) với Logic Icon Phân Loại

"use client"

import React from "react"
import { Collapse } from "antd"
import {
  PlayCircleOutlined,
  FilePdfOutlined,
  ReadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons"

// 1. Định nghĩa Type cho bài học (Bổ sung đầy đủ các trường để check logic)
interface CurriculumItem {
  id: string | number
  title: string
  type: "lesson" | "quiz"
  video_url?: string | null
  file_path?: string | null
  content?: string | null // Trường chứa text cho bài đọc
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
  // 2. Hàm helper format thời gian hiển thị ở Header của mỗi Chương
  const formatDuration = (minutes: number) => {
    if (!minutes) return ""
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h} giờ ${m} phút`
    return `${m} phút`
  }

  // 3. Logic phân loại biểu tượng theo yêu cầu của bạn
  const getLessonIcon = (item: CurriculumItem) => {
    // 1. Kiểm tra loại Quiz (Dựa trực tiếp vào cột type trong DB)
    if (item.type === "quiz") {
      return <QuestionCircleOutlined className="text-orange-500 text-lg" />
    }

    // 2. Nếu là Lesson, kiểm tra sâu hơn vào dữ liệu phương tiện (Media)
    if (item.type === "lesson") {
      // Ưu tiên VIDEO: Nếu có video_url thì chắc chắn là Video Lesson
      if (item.video_url && item.video_url.trim() !== "") {
        return <PlayCircleOutlined className="text-blue-500 text-lg" />
      }

      // Ưu tiên PDF: Nếu đường dẫn file có đuôi .pdf
      if (item.file_path?.toLowerCase().endsWith(".pdf")) {
        return <FilePdfOutlined className="text-red-500 text-lg" />
      }

      // Mặc định cho Lesson: Nếu không có video/pdf thì là Bài đọc (Reading)
      return <ReadOutlined className="text-green-500 text-lg" />
    }

    // Trường hợp dự phòng nếu type không xác định
    return <ReadOutlined className="text-gray-400 text-lg" />
  }

  // 4. Cấu hình các item cho Antd Collapse
  const collapseItems = sections.map((section) => {
    const totalDuration = section.items.reduce(
      (acc, item) => acc + (item.duration_minutes || 0),
      0
    )
    const lessonCount = section.items.length

    return {
      key: section.id,
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
                {/* PHẦN BÊN TRÁI: Icon phân loại + Tiêu đề */}
                <div className="flex items-center gap-3">
                  {getLessonIcon(item)}
                  <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors text-sm">
                    {index + 1}. {item.title}
                  </span>
                </div>

                {/* PHẦN BÊN PHẢI: Lược bỏ hoàn toàn metadata */}
                <div />
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
          items={collapseItems}
          defaultActiveKey={[sections[0]?.id]}
          expandIconPosition="start"
          className="bg-white border-gray-200 rounded-lg shadow-sm"
          expandIcon={({ isActive }) => (
            <div
              className={`transform transition-transform duration-200 ${
                isActive ? "rotate-90" : "rotate-0"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
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
