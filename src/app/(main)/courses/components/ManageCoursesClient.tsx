// @/src/app/(main)/courses/components/ManageCoursesClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input, Button, Table, Pagination, message, Modal, Tag } from "antd"
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
} from "@ant-design/icons"
import type { Course } from "@/service/course.service"
import { deleteCourseAPI, approveCourse } from "@/action/courses/courseAction"
import { COURSE_STATUS_LABELS } from "@/enum/course-status.enum"

interface ManageCoursesClientProps {
  courses: Course[]
  totalCount: number
  query: string
  page: number
}

export default function ManageCoursesClient({
  courses,
  totalCount,
  query,
  page,
}: ManageCoursesClientProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(query)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- Search ---
  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set("query", value)
    params.set("page", "1")
    router.push(`/courses/manage?${params.toString()}`)
  }

  // --- Approve (Đã tối ưu) ---
  const handleApprove = (id: number, title: string) => {
    Modal.confirm({
      title: "Approve Course",
      content: (
        <div>
          Are you sure you want to approve <b>"{title}"</b>?
          <br />
          <span className="text-gray-500 text-sm">
            This course will be published and visible to students.
          </span>
        </div>
      ),
      okText: "Approve",
      cancelText: "Cancel",
      okButtonProps: { type: "primary" }, // Màu xanh cho nút Approve
      centered: true,
      // 👇 Modal tự động chờ Promise này chạy xong mới đóng -> Tạo hiệu ứng loading
      onOk: async () => {
        try {
          const res = await approveCourse(id)
          if (res.success) {
            message.success("Course approved successfully! 🎉")
            router.refresh() // Làm mới dữ liệu
          } else {
            message.error(res.error || "Failed to approve course")
          }
        } catch (error) {
          message.error("System error occurred")
        }
      },
    })
  }

  // --- Delete ---
  const handleDelete = (courseId: number, courseTitle: string) => {
    Modal.confirm({
      title: "Delete Course",
      content: `Delete "${courseTitle}"? It will be moved to trash.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      maskClosable: true,
      onOk: async () => {
        try {
          const res = await deleteCourseAPI(courseId)
          if (res.success) {
            message.success("Course moved to trash")
            router.refresh()
          } else {
            message.error(res.error || "Failed to delete")
          }
        } catch (error) {
          message.error("System error occurred")
        }
      },
    })
  }

  // --- Pagination ---
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (query) params.set("query", query)
    params.set("page", String(newPage))
    router.push(`/courses/manage?${params.toString()}`)
  }

  // --- Columns ---
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Course) => (
        <Link
          href={`/courses/${record.id}`}
          className="flex items-center space-x-4 group hover:cursor-pointer"
        >
          {record.thumbnail_url && (
            <img
              src={record.thumbnail_url}
              alt={text}
              className="w-16 h-12 rounded object-cover border border-gray-100"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          )}
          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
            {text}
          </div>
        </Link>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default"
        if (status === "published") color = "success"
        if (status === "pending_approval") color = "processing"
        if (status === "draft") color = "warning"

        return (
          <Tag color={color} className="uppercase text-xs font-semibold">
            {COURSE_STATUS_LABELS[
              status as keyof typeof COURSE_STATUS_LABELS
            ] || status}
          </Tag>
        )
      },
    },
    {
      title: "Enrollments",
      dataIndex: "enrollment_count",
      key: "enrollment_count",
      render: (count: number) => (
        <span className="text-gray-600">{count.toLocaleString()}</span>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration_hours",
      key: "duration_hours",
      render: (hours: number | null) => (
        <span className="text-gray-600">{hours ? `${hours}h` : "--"}</span>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: Date) => (
        <span className="text-gray-500">
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Course) => (
        <div
          className="flex gap-2"
          onClick={(e) => {
            // 🛑 Chặn sự kiện click lan ra ngoài (quan trọng nếu click vào hàng để xem chi tiết)
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {/* Nút Approve */}
          {(record.status === "pending_approval" ||
            record.status === "draft") && (
            <Button
              icon={<CheckOutlined />}
              size="small"
              className="text-blue-600 border-blue-600 hover:!text-blue-500 hover:!border-blue-500"
              onClick={(e) => {
                // 🛑 Ngăn chặn hành vi mặc định và lan truyền
                e.stopPropagation()
                e.preventDefault()

                // 🟢 Kiểm tra Console trình duyệt (F12) xem dòng này có hiện không
                console.log("🟢 Client: Đã bấm nút Approve ID:", record.id)

                handleApprove(record.id, record.title)
              }}
            >
              Approve
            </Button>
          )}

          {/* Nút Edit */}
          <Link
            href={`/courses/${record.id}/update`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button type="primary" icon={<EditOutlined />} size="small" />
          </Link>

          {/* Nút Delete */}
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={(e) => {
              // 🛑 Ngăn chặn hành vi mặc định và lan truyền
              e.stopPropagation()
              e.preventDefault()

              // 🟢 Kiểm tra Console trình duyệt (F12) xem dòng này có hiện không
              console.log("🔴 Client: Đã bấm nút Delete ID:", record.id)

              handleDelete(record.id, record.title)
            }}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Course Management
          </h1>
          <p className="text-gray-600 mt-1">Manage and organize your courses</p>
        </div>
        <Link href="/courses/create">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Create Course
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <Input.Search
          placeholder="Search courses..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={handleSearch}
          size="large"
          allowClear
          enterButton={<SearchOutlined />}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <Table
          columns={columns}
          dataSource={courses}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <div className="py-12 text-gray-500">No courses found</div>
            ),
          }}
        />
      </div>

      {/* Pagination */}
      {totalCount > 10 && (
        <div className="flex justify-center pt-4">
          <Pagination
            current={page}
            total={totalCount}
            pageSize={10}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  )
}
