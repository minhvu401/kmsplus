"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input, Button, Table, Pagination, message, Modal } from "antd"
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import type { Course } from "@/service/course.service"
import { deleteCourse } from "@/action/courses/courseAction"

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

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set("query", value)
    params.set("page", "1")
    router.push(`/courses/manage?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (query) params.set("query", query)
    params.set("page", String(newPage))
    router.push(`/courses/manage?${params.toString()}`)
  }

  const handleDelete = async (courseId: number, courseTitle: string) => {
    Modal.confirm({
      title: "Delete Course",
      content: `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setIsDeleting(true)
          const formData = new FormData()
          formData.append("id", String(courseId))
          await deleteCourse(formData)
          message.success("Course deleted successfully")
          router.refresh()
        } catch (error) {
          message.error("Failed to delete course")
          console.error(error)
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Course) => (
        <div className="flex items-center gap-3">
          {record.thumbnail_url && (
            <img
              src={record.thumbnail_url}
              alt={text}
              className="w-16 h-12 object-cover rounded"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  "https://placehold.co/64x48/E2E8F0/31343C?text=No+Image"
              }}
            />
          )}
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            status === "published"
              ? "bg-green-100 text-green-800"
              : status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Enrollments",
      dataIndex: "enrollment_count",
      key: "enrollment_count",
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: "Duration",
      dataIndex: "duration_hours",
      key: "duration_hours",
      render: (hours: number | null) => (hours ? `${hours} hours` : "N/A"),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Course) => (
        <div className="flex gap-2">
          <Link href={`/courses/${record.id}/update`}>
            <Button type="primary" icon={<EditOutlined />} size="small">
              Edit
            </Button>
          </Link>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id, record.title)}
            loading={isDeleting}
          >
            Delete
          </Button>
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Input.Search
          placeholder="Search courses by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={handleSearch}
          size="large"
          allowClear
          enterButton={<SearchOutlined />}
        />
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          dataSource={courses}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <div className="py-8">
                <p className="text-gray-500">No courses found</p>
                {query && (
                  <p className="text-sm text-gray-400 mt-2">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            ),
          }}
        />
      </div>

      {/* Pagination */}
      {totalCount > 10 && (
        <div className="flex justify-center">
          <Pagination
            current={page}
            total={totalCount}
            pageSize={10}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} courses`
            }
          />
        </div>
      )}
    </div>
  )
}
