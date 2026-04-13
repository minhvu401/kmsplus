"use client"

import React from "react"
import { Flex } from "antd"
import useLanguageStore from "@/store/useLanguageStore"

type FeedbackPageTextProps = {
  courseTitle: string
  courseId: number
  currentPage: number
  pageSize: number
  totalCount: number
  currentCount: number
}

export default function FeedbackPageText({
  courseTitle,
  courseId,
  currentPage,
  pageSize,
  totalCount,
  currentCount,
}: FeedbackPageTextProps) {
  const { language } = useLanguageStore()
  const start = currentCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const end = Math.min(currentPage * pageSize, totalCount)

  return (
    <>
      <Flex className="mb-6 flex items-center justify-between">
        <h1 className="text-gray-600 text-3xl font-bold">
          {language === "vi" ? "Quản lý đánh giá khóa học" : "Manage course reviews"}
        </h1>
      </Flex>

      <Flex className="mb-4 text-gray-500 text-sm">
        {language === "vi" ? "Tên khóa học" : "Course Name"}: {courseTitle || `Course #${courseId}`}
      </Flex>

      <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
        {language === "vi" ? "Hiển thị" : "Showing"} {start}-{end} {language === "vi" ? "trên" : "of"} {totalCount} {language === "vi" ? "đánh giá" : "reviews"}
      </Flex>
    </>
  )
}
