// @/src/app/(main)/courses/components/ManageCoursesClient.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input, Button, Table, Pagination, message, Modal, Tag } from "antd"
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import type { Course } from "@/service/course.service"
import {
  getCourseById,
  deleteCourseAPI,
  approveCourse,
  rejectCourseAction,
} from "@/action/courses/courseAction"
import { COURSE_STATUS_LABELS } from "@/enum/course-status.enum"
import UpdateCourseForm, { CoursePayload } from "./UpdateCourseForm"
import CreateCourseForm from "./CreateCourseForm"

interface ManageCoursesClientProps {
  courses: Course[]
  totalCount: number
  query: string
  page: number
  availableLessons: any[]
  availableQuizzes: any[]
}

export default function ManageCoursesClient({
  courses,
  totalCount,
  query,
  page,
  availableLessons,
  availableQuizzes,
}: ManageCoursesClientProps) {
  console.log("🔥 ManageCoursesClient - Received props:", {
    coursesCount: courses.length,
    availableLessonsCount: availableLessons?.length || 0,
    availableQuizzesCount: availableQuizzes?.length || 0,
    firstLesson: availableLessons?.[0],
    firstQuiz: availableQuizzes?.[0],
  })
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(query)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<
    Course | CoursePayload | null
  >(null)

  // State cho Reject Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectingCourseId, setRejectingCourseId] = useState<number | null>(
    null
  )
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  const handleOpenUpdate = async (course: Course) => {
    const hide = message.loading("Loading course details...", 0)

    try {
      // 1. Gọi API lấy thông tin chi tiết (bao gồm curriculum)
      const res = await getCourseById(course.id)

      // Kiểm tra kết quả trả về từ server action
      // Lưu ý: Tùy thuộc vào cấu trúc trả về của getCourseById mà bạn lấy data
      // Giả sử res trả về { success: true, data: { ... } } hoặc trực tiếp object course
      const fullCourse = (res as any).data || res

      if (!fullCourse) {
        throw new Error("Course data not found")
      }

      console.log("🔥 [DEBUG] Full Course Data fetched:", fullCourse)

      // 2. Xử lý chuẩn hóa dữ liệu Curriculum
      // DB có thể trả về 'curriculum' hoặc 'curriculum_sections', kiểm tra cả 2
      const rawCurriculum =
        (fullCourse as any).curriculum ||
        (fullCourse as any).curriculum_sections ||
        []

      const safeCurriculum = Array.isArray(rawCurriculum)
        ? rawCurriculum.map((section: any) => ({
            ...section,
            id: String(section.id), // ✅ Ép ID Section thành String
            items: Array.isArray(section.items) // Hoặc section.curriculum_items
              ? section.items.map((item: any) => ({
                  ...item,
                  id: String(item.id), // ✅ Ép ID Item thành String
                  resource_id: Number(item.resource_id),
                  type: item.type || "lesson",
                  duration_minutes: item.duration_minutes || 0,
                  question_count: item.question_count || 0,
                }))
              : [],
          }))
        : []

      // 3. Tạo payload
      const payload: CoursePayload = {
        ...fullCourse, // Dùng dữ liệu full vừa fetch được
        description: fullCourse.description ?? undefined,
        thumbnail_url: fullCourse.thumbnail_url ?? undefined,
        duration_hours: fullCourse.duration_hours ?? 0,
        curriculum: safeCurriculum,
      }

      setSelectedCourse(payload)
      setIsUpdateModalOpen(true)
    } catch (error) {
      console.error(error)
      message.error("Failed to load course details.")
    } finally {
      hide()
    }
  }

  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false)
    setSelectedCourse(null)
    router.refresh() // Tải lại dữ liệu bảng
  }
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    router.refresh()
  }
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

  // --- Reject ---
  const openRejectModal = (id: number) => {
    setRejectingCourseId(id)
    setRejectReason("") // Reset lý do
    setIsRejectModalOpen(true)
  }

  const handleSubmitReject = async () => {
    if (!rejectingCourseId) return
    if (!rejectReason.trim()) {
      message.error("Vui lòng nhập lý do từ chối!")
      return
    }

    setIsRejecting(true)
    try {
      const res = await rejectCourseAction(rejectingCourseId, rejectReason)
      if (res.success) {
        message.success("Đã từ chối khóa học thành công.")
        setIsRejectModalOpen(false)
        router.refresh()
      } else {
        message.error(res.error || "Lỗi khi từ chối khóa học")
      }
    } catch (error) {
      message.error("Lỗi hệ thống")
    } finally {
      setIsRejecting(false)
    }
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
        if (status === "rejected") color = "error"

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
    // 👇 CHÈN CỘT MỚI VÀO ĐÂY
    {
      title: "Confirm Course",
      key: "confirm",
      render: (_: any, record: Course) => (
        <div className="flex gap-2">
          {record.status === "pending_approval" ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                className="bg-blue-600 border-none hover:!bg-blue-700"
                onClick={() => handleApprove(record.id, record.title)}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                className="hover:!bg-red-50"
                onClick={() => openRejectModal(record.id)}
              >
                Reject
              </Button>
            </>
          ) : (
            <span className="text-gray-400 text-xs italic pl-2">
              No action needed
            </span>
          )}
        </div>
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
          {/* Nút Edit mới dùng để mở Modal */}
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            // className="border-blue-600 text-blue-600 hover:!border-blue-700 hover:!text-blue-700 hover:bg-blue-50"
            className="text-blue-600 hover:!text-blue-700 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation() // Chặn sự kiện click vào hàng
              handleOpenUpdate(record) // Gọi hàm mở Modal với dữ liệu hàng hiện tại
            }}
          />

          {/* Nút Delete */}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            // ✅ Thêm nền đỏ nhạt khi hover
            className="hover:bg-red-50"
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Course
        </Button>
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
      <Modal
        title={null} // Ẩn tiêu đề mặc định của Modal vì trong Form đã có h1/h2
        open={isUpdateModalOpen}
        onCancel={() => setIsUpdateModalOpen(false)} // Đóng modal khi nhấn X hoặc ra ngoài
        footer={null} // Không dùng nút OK/Cancel mặc định của Modal
        width={1000} // Độ rộng đủ lớn cho Curriculum Builder
        centered
        destroyOnHidden={true}
      >
        {selectedCourse && (
          <UpdateCourseForm
            initialData={selectedCourse as CoursePayload}
            availableLessons={availableLessons}
            availableQuizzes={availableQuizzes}
            onSuccess={handleUpdateSuccess}
          />
        )}
      </Modal>
      <Modal
        title={null}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={1000}
        centered
        destroyOnHidden
      >
        <CreateCourseForm
          availableLessons={availableLessons}
          availableQuizzes={availableQuizzes}
          onSuccess={handleCreateSuccess}
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <span className="text-red-600 font-bold">⛔ Từ chối khóa học</span>
        }
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={handleSubmitReject}
        confirmLoading={isRejecting}
        okText="Xác nhận Từ chối"
        okType="danger"
        cancelText="Hủy bỏ"
        centered
      >
        <div className="py-4">
          <p className="mb-2 text-gray-600">
            Vui lòng nhập lý do từ chối để Creator biết cần sửa những gì:
          </p>
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Video bài 3 bị mờ, nội dung Section 2 chưa đầy đủ..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  )
}
