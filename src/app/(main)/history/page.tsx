// @/app/(main)/history/page.tsx
// TRANG CHI TIẾT LỊCH SỬ HỌC CỦA HỌC VIÊN

"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Table,
  Tag,
  Progress,
  Card,
  Button,
  Input,
  Select,
  Pagination,
  Skeleton,
  Empty,
  message,
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
import { getPersonalHistory } from "@/action/progress/progressAction"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

// Định nghĩa kiểu dữ liệu trả về từ API (khớp với câu SQL trong service)
interface HistoryItem {
  enrollment_id: number
  enrolled_at: string
  progress_percentage: number
  status: string
  completed_at: string | null
  course_id: number
  course_name: string
  thumbnail_url: string
}

export default function PersonalHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HistoryItem[]>([])
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { language } = useLanguageStore()

  // --- 1. FETCH DỮ LIỆU TỪ SERVER ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPersonalHistory()
        if (res.success && Array.isArray(res.data)) {
          setData(res.data as HistoryItem[])
        } else {
          // Nếu lỗi hoặc không có data, set mảng rỗng để không crash
          setData([])
          if (res.error) message.error(res.error)
        }
      } catch (error) {
        console.error("Failed to fetch history", error)
        message.error(t("error.loading_failed", language))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- 2. TÍNH TOÁN THỐNG KÊ (REALTIME) ---
  const stats = useMemo(() => {
    const totalEnrolled = data.length
    const completedCourses = data.filter((c) => c.status === "completed").length

    // Tính % trung bình của tất cả khóa học
    const totalProgress = data.reduce(
      (acc, curr) => acc + (curr.progress_percentage || 0),
      0
    )
    const avgScore =
      totalEnrolled > 0 ? Math.round(totalProgress / totalEnrolled) : 0
    const finalAvgScore = isNaN(avgScore) ? 0 : avgScore

    return [
      {
        title: t("history.total_courses", language),
        value: totalEnrolled,
        sub: t("history.stat_lifelong_access", language),
        icon: <BookOpen className="text-blue-600" size={24} />,
        bg: "bg-blue-50",
        text: "text-blue-600",
      },
      {
        title: t("history.filter_completed", language),
        value: completedCourses,
        sub: `${totalEnrolled > 0 ? Math.round((completedCourses / totalEnrolled) * 100) : 0}% ${t("history.stat_completion_rate", language).toLowerCase()}`,
        icon: <CheckCircle className="text-blue-600" size={24} />,
        bg: "bg-blue-50",
        text: "text-blue-600",
      },
      {
        title: t("history.avg_progress", language),
        value: `${finalAvgScore}%`,
        sub: t("history.stat_continue_learning", language),
        icon: <TrendingUp className="text-purple-600" size={24} />,
        bg: "bg-purple-50",
        text: "text-purple-600",
      },
    ]
  }, [data, language])

  // --- 3. FILTER & SEARCH CLIENT-SIDE ---
  const filteredData = data.filter((item) => {
    const matchesSearch = item.course_name
      .toLowerCase()
      .includes(searchText.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // --- 4. CẤU HÌNH CỘT (MAPPING DB FIELDS) ---
  const columns: ColumnsType<HistoryItem> = [
    {
      title: t("history.table_course_name", language),
      dataIndex: "course_name", // Khớp với SQL: c.title as course_name
      key: "course_name",
      width: 350,
      render: (text, record) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            {record.thumbnail_url ? (
              <img
                src={record.thumbnail_url}
                alt={text}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen size={20} className="text-gray-400" />
            )}
          </div>
          <div>
            <Link
              href={`/courses/${record.course_id}`}
              className="font-bold text-gray-800 hover:text-blue-600 text-base block mb-0.5 line-clamp-1"
            >
              {text}
            </Link>
            {/* Giả lập category vì SQL chưa join bảng categories, bạn có thể update SQL sau */}
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {t("history.category_general", language)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t("history.table_join_date", language),
      dataIndex: "enrolled_at", // Khớp với SQL
      key: "enrolled_at",
      className: "text-gray-500 font-medium",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "--", // Format ngày, xử lý TH null
    },
    {
      title: t("history.table_progress", language),
      dataIndex: "progress_percentage", // Khớp với SQL
      key: "progress_percentage",
      width: 200,
      render: (percent) => (
        <div className="pr-4">
          <div className="flex justify-between text-xs mb-1 font-semibold text-gray-600">
            <span>{Math.round(percent)}%</span>
          </div>
          <Progress
            percent={Math.round(percent)}
            showInfo={false}
            strokeColor="#3b82f6"
            trailColor="#e5e7eb"
            size="small"
            className="mb-0"
          />
        </div>
      ),
    },
    {
      title: t("history.table_status", language),
      dataIndex: "status",
      render: (status) => {
        if (status === "assigned") {
          return (
            <Tag
              color="error"
              className="bg-red-50 text-red-600 rounded-full border-0 font-semibold px-3 py-1"
            >
              {t("history.status_required", language)}
            </Tag>
          )
        }
        const isCompleted = status === "completed"
        return (
          <Tag
            color={isCompleted ? "processing" : "warning"}
            className={`px-3 py-1 rounded-full border-0 font-semibold flex items-center gap-1 w-fit ${
              isCompleted
                ? "bg-blue-50 text-blue-600"
                : "bg-yellow-50 text-yellow-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompleted ? "bg-blue-600" : "bg-yellow-600"
              }`}
            ></span>
            {isCompleted
              ? t("history.status_completed", language)
              : t("history.status_in_progress", language)}
          </Tag>
        )
      },
    },
    {
      title: t("history.table_action", language),
      key: "action",
      align: "right",
      render: (_, record) => {
        // Nếu là khóa học Bắt buộc, đổi chữ nút bấm
        if (record.status === "assigned") {
          return (
            <Link href={`/courses/${record.course_id}`}>
              <Button
                type="primary"
                danger
                className="bg-red-500 flex items-center gap-2 border-none shadow-md"
              >
                {t("history.action_start_now", language)}{" "}
                <PlayCircle size={16} />
              </Button>
            </Link>
          )
        }
        if (record.status === "completed") {
          return (
            <Button
              icon={<Award size={16} />}
              className="text-gray-600 border-gray-300 hover:!text-blue-600 hover:!border-blue-600 flex items-center gap-2"
              onClick={() =>
                message.info(t("history.msg_certificate_coming", language))
              }
            >
              {t("history.action_certificate", language)}
            </Button>
          )
        }
        return (
          <Link href={`/courses/${record.course_id}/learning`}>
            <Button
              type="primary"
              className="bg-blue-600 hover:!bg-blue-700 border-none shadow-md flex items-center gap-2"
            >
              {t("history.action_continue", language)} <PlayCircle size={16} />
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
              {t("history.page_title", language)}
            </h1>
            <p className="text-gray-500">
              {t("history.page_subtitle", language)}
            </p>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? // Skeleton loading cho Cards
              [1, 2, 3].map((i) => (
                <Card key={i} bordered={false} className="shadow-sm rounded-xl">
                  <Skeleton active avatar paragraph={{ rows: 1 }} />
                </Card>
              ))
            : stats.map((stat, idx) => (
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
                  </div>
                  <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stat.text.replace(
                        "text",
                        "bg"
                      )}`}
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
              onChange={setStatusFilter}
              options={[
                { value: "all", label: t("history.filter_all", language) },
                {
                  value: "completed",
                  label: t("history.filter_completed", language),
                },
                {
                  value: "in_progress",
                  label: t("history.filter_in_progress", language),
                },
                {
                  value: "assigned",
                  label: t("history.filter_assigned", language),
                },
              ]}
            />
            {/* Các filter khác có thể thêm sau nếu API hỗ trợ */}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Input
                placeholder={t("history.search_placeholder", language)}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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
            dataSource={filteredData}
            // ✅ ĐÃ SỬA LỖI KEY BỊ TRÙNG Ở ĐÂY
            rowKey={(record) => `${record.enrollment_id}_${record.course_id}`}
            loading={loading}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              total: filteredData.length,
              showTotal: (total, range) =>
                t("history.pagination_show_total", language)
                  .replace("{{start}}", String(range[0]))
                  .replace("{{end}}", String(range[1]))
                  .replace("{{total}}", String(total)),
            }}
            locale={{
              emptyText: (
                <Empty description={t("history.empty_state", language)} />
              ),
            }}
            className="custom-history-table"
          />
        </div>
      </div>
    </div>
  )
}
