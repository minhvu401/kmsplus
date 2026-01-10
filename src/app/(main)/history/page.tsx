// @/app/(main)/history/page.tsx
// TRANG CHI TIẾT LỊCH SỬ HỌC CỦA HỌC VIÊN

"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Table,
  Tag,
  Progress,
  Card,
  Button,
  Input,
  Select,
  Avatar,
  Pagination,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  Search,
  Download,
  Award,
  PlayCircle,
  BookOpen,
  CheckCircle,
  TrendingUp,
} from "lucide-react"
// 👇 1. IMPORT ACTION THẬT
import { getPersonalHistory } from "@/action/progress/progressAction"
import { useEffect } from "react" // Import thêm useEffec

// --- 1. MOCK DATA (Dữ liệu giả lập theo ảnh) ---
const MOCK_STATS = [
  {
    title: "Total Enrolled",
    value: 12,
    sub: "+2 this month",
    icon: <BookOpen className="text-blue-600" size={24} />,
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    title: "Courses Completed",
    value: 8,
    sub: "66% completion rate",
    icon: <CheckCircle className="text-green-600" size={24} />,
    bg: "bg-green-50",
    text: "text-green-600",
  },
  {
    title: "Avg. Score",
    value: "94%",
    sub: "Top 5% of learners",
    icon: <TrendingUp className="text-purple-600" size={24} />,
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
]

const MOCK_COURSES = [
  {
    id: 1,
    title: "Cybersecurity Awareness 101",
    category: "Security Compliance",
    enrolledOn: "Oct 12, 2023",
    progress: 100,
    status: "completed",
    image: "https://api.dicebear.com/7.x/icons/svg?seed=Security", // Ảnh giả
  },
  {
    id: 2,
    title: "Advanced Excel Macros",
    category: "Technical Skills",
    enrolledOn: "Nov 01, 2023",
    progress: 45,
    status: "in_progress",
    image: "https://api.dicebear.com/7.x/icons/svg?seed=Excel",
  },
  {
    id: 3,
    title: "Workplace Safety Standards",
    category: "Health & Safety",
    enrolledOn: "Jan 15, 2024",
    progress: 10,
    status: "in_progress",
    image: "https://api.dicebear.com/7.x/icons/svg?seed=Safety",
  },
  {
    id: 4,
    title: "Emotional Intelligence",
    category: "Soft Skills",
    enrolledOn: "Sep 20, 2023",
    progress: 100,
    status: "completed",
    image: "https://api.dicebear.com/7.x/icons/svg?seed=Emotional",
  },
  {
    id: 5,
    title: "Marketing Fundamentals",
    category: "Marketing",
    enrolledOn: "Aug 05, 2023",
    progress: 100,
    status: "completed",
    image: "https://api.dicebear.com/7.x/icons/svg?seed=Marketing",
  },
]

// --- 2. COMPONENT CHÍNH ---
export default function PersonalHistoryPage() {
  const [data, setData] = useState(MOCK_COURSES) // Dùng dữ liệu giả

  // Cấu hình cột cho bảng
  const columns: ColumnsType<(typeof MOCK_COURSES)[0]> = [
    {
      title: "COURSE NAME",
      dataIndex: "title",
      key: "title",
      width: 350,
      render: (text, record) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            <img
              src={record.image}
              alt={text}
              className="w-8 h-8 object-cover"
            />
          </div>
          <div>
            <Link
              href={`/courses/${record.id}`}
              className="font-bold text-gray-800 hover:text-green-600 text-base block mb-0.5"
            >
              {text}
            </Link>
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {record.category}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "ENROLLED ON",
      dataIndex: "enrolledOn",
      key: "enrolledOn",
      className: "text-gray-500 font-medium",
    },
    {
      title: "PROGRESS",
      dataIndex: "progress",
      key: "progress",
      width: 200,
      render: (percent) => (
        <div className="pr-4">
          <div className="flex justify-between text-xs mb-1 font-semibold text-gray-600">
            <span>{percent}%</span>
          </div>
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor={percent === 100 ? "#10b981" : "#3b82f6"}
            trailColor="#e5e7eb"
            size="small"
            className="mb-0"
          />
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isCompleted = status === "completed"
        return (
          <Tag
            color={isCompleted ? "success" : "warning"}
            className={`px-3 py-1 rounded-full border-0 font-semibold flex items-center gap-1 w-fit ${
              isCompleted
                ? "bg-green-50 text-green-600"
                : "bg-yellow-50 text-yellow-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-green-600" : "bg-yellow-600"}`}
            ></span>
            {isCompleted ? "Completed" : "In Progress"}
          </Tag>
        )
      },
    },
    {
      title: "ACTION",
      key: "action",
      align: "right",
      render: (_, record) => {
        if (record.status === "completed") {
          return (
            <Button
              icon={<Award size={16} />}
              className="text-gray-600 border-gray-300 hover:!text-green-600 hover:!border-green-600 flex items-center gap-2"
            >
              Certificate
            </Button>
          )
        }
        return (
          <Link href={`/courses/${record.id}`}>
            <Button
              type="primary"
              className="bg-green-500 hover:!bg-green-600 border-none shadow-md flex items-center gap-2"
            >
              Continue <PlayCircle size={16} />
            </Button>
          </Link>
        )
      },
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Personal Learning History
            </h1>
            <p className="text-gray-500">
              Track your progress, view enrollments, and access completion
              certificates.
            </p>
          </div>
          <Button
            type="primary"
            icon={<Download size={18} />}
            className="bg-green-500 hover:!bg-green-600 h-10 px-5 border-none shadow-sm font-medium"
          >
            Export Report
          </Button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_STATS.map((stat, idx) => (
            <Card
              key={idx}
              bordered={false}
              className="shadow-sm rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}
                  >
                    {stat.icon}
                  </div>
                  <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">
                    {stat.title}
                  </h3>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold mt-2 ${stat.text}`}>
                    {stat.sub}
                  </p>
                </div>
                {/* Có thể thêm chart nhỏ ở đây nếu muốn giống y hệt ảnh */}
              </div>
              {/* Fake progress bar dưới cùng card */}
              <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stat.text.replace("text", "bg")}`}
                  style={{ width: "70%" }}
                ></div>
              </div>
            </Card>
          ))}
        </div>

        {/* FILTERS & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select
              defaultValue="all"
              className="w-32"
              options={[
                { value: "all", label: "Status: All" },
                { value: "completed", label: "Completed" },
                { value: "progress", label: "In Progress" },
              ]}
            />
            <Select
              defaultValue="6months"
              className="w-40"
              options={[
                { value: "6months", label: "Date: Last 6 Months" },
                { value: "year", label: "Date: Last Year" },
              ]}
            />
            <Select
              defaultValue="all_cat"
              className="w-40"
              options={[
                { value: "all_cat", label: "Category: All" },
                { value: "tech", label: "Technical" },
              ]}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-gray-400 font-medium uppercase">
              Sort by:
            </span>
            <Select
              defaultValue="recent"
              variant="borderless"
              className="font-semibold text-gray-700 w-32"
              options={[{ value: "recent", label: "Most Recent" }]}
            />
            <div className="relative">
              <Input
                placeholder="Search courses..."
                prefix={<Search size={16} className="text-gray-400" />}
                className="rounded-lg w-full md:w-64 bg-gray-50 border-gray-200 hover:bg-white focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={false}
            className="custom-history-table"
          />

          {/* Custom Pagination Footer giống ảnh */}
          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing 1-5 of 12 courses
            </span>
            <Pagination
              defaultCurrent={1}
              total={12}
              pageSize={5}
              showSizeChanger={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
