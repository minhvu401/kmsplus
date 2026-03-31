// @/src/app/(main)/courses/components/ManageCoursesClient.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Input,
  Button,
  Table,
  Pagination,
  message,
  Modal,
  Tag,
  Divider,
  Typography,
  Tooltip,
  Flex,
  Select,
  Card,
  Row,
  Col,
  Spin,
  Avatar,
  Segmented,
  type TableProps,
} from "antd"
import {
  SearchOutlined,
  ReadOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ClearOutlined,
  UserOutlined,
} from "@ant-design/icons"
import type { Course } from "@/service/course.service"
import type { Category } from "@/service/question.service"
import {
  getCourseById,
  deleteCourseAPI,
  approveCourse,
  rejectCourseAction,
} from "@/action/courses/courseAction"
import { COURSE_STATUS_LABELS } from "@/enum/course-status.enum"
import UpdateCourseForm, { CoursePayload } from "./UpdateCourseForm"
import CreateCourseForm from "./CreateCourseForm"

const { Text } = Typography

interface ManageCoursesClientProps {
  courses: Course[]
  totalCount: number
  currentUserId?: number | null
  enforceCreatorOnlyEdit?: boolean
  query: string
  page: number
  selectedCategories: string[]
  categories: Category[]
  availableLessons: any[]
  availableQuizzes: any[]
  userRole?: string // ✅ Bổ sung thêm dòng này
}

export default function ManageCoursesClient({
  courses,
  totalCount,
  currentUserId,
  enforceCreatorOnlyEdit = false,
  query,
  page,
  selectedCategories,
  categories,
  availableLessons,
  availableQuizzes,
  userRole = "", // ✅ Nhận prop userRole
}: ManageCoursesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [messageApi, contextHolder] = message.useMessage()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(query)
  const [selectedCategoryList, setSelectedCategoryList] =
    useState<string[]>(selectedCategories)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<
    Course | CoursePayload | null
  >(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [courseToApprove, setCourseToApprove] = useState<Course | null>(null)

  // New: Additional filters and view modes
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses)

  // Check if user is Training Manager (case-insensitive, handle spaces)
  const isTrainingManager =
    userRole?.toLowerCase().replace(/\s+/g, "") === "trainingmanager"

  // ✅ THÊM BIẾN NÀY: Kiểm tra xem User có phải Admin hoặc Trưởng phòng không
  const canApproveCourse =
    userRole?.toLowerCase().includes("admin") ||
    userRole?.toLowerCase().includes("head of department") ||
    userRole?.toLowerCase().includes("director")

  const canEditCourse = (course: Course) => {
    if (!enforceCreatorOnlyEdit) return true
    if (!currentUserId) return false
    return Number(course.creator_id) === Number(currentUserId)
  }

  // Check if any filter is active
  useEffect(() => {
    const active = selectedCategoryList.length > 0 || query !== ""
    setHasActiveFilters(active)
  }, [selectedCategoryList, query])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...courses]

    // Filter by status
    if (selectedStatus !== "All") {
      filtered = filtered.filter((course) => course.status === selectedStatus)
    }

    // Sort courses
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

    setFilteredCourses(filtered)
  }, [courses, selectedStatus, sortOrder])

  const handleCategoryChange = (values: string[]) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")

    if (values.length === 0) {
      params.delete("category")
    } else {
      // Remove old category params and add new ones
      params.delete("category")
      values.forEach((cat) => params.append("category", cat))
    }

    setSelectedCategoryList(values)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams()
    setSelectedCategoryList([])
    setSearchInput("")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleOpenUpdate = async (course: Course) => {
    const hide = messageApi.loading("Loading course details...", 0)

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
      messageApi.error("Không thể tải thông tin khóa học.")
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
    if (selectedCategoryList.length > 0) {
      selectedCategoryList.forEach((cat) => params.append("category", cat))
    }
    params.set("page", "1")
    router.push(`/courses/management?${params.toString()}`)
  }

  // --- Approve ---
  const handleApprove = (course: Course) => {
    setCourseToApprove(course)
    setIsApproveModalOpen(true)
  }

  const confirmApprove = async () => {
    if (!courseToApprove) return

    const messageKey = `approve-course-${courseToApprove.id}`
    messageApi.open({
      key: messageKey,
      type: "loading",
      content: "Đang duyệt khóa học...",
      duration: 0,
    })

    try {
      const res = await approveCourse(courseToApprove.id)
      if (res.success) {
        messageApi.open({
          key: messageKey,
          type: "success",
          content: "Duyệt khóa học thành công",
          duration: 2,
        })

        setTimeout(() => router.refresh(), 200)
      } else {
        messageApi.open({
          key: messageKey,
          type: "error",
          content: res.error || "Không thể duyệt khóa học",
          duration: 3,
        })
      }
    } catch (error) {
      messageApi.open({
        key: messageKey,
        type: "error",
        content: "System error occurred",
        duration: 3,
      })
    } finally {
      setIsApproveModalOpen(false)
      setCourseToApprove(null)
    }
  }

  // --- Reject ---
  const handleReject = (id: number, title: string) => {
    Modal.confirm({
      title: "Từ chối Khóa học",
      content: `Bạn có chắc chắn muốn từ chối "${title}"? Khóa học này sẽ được chuyển về trạng thái Nháp.`,
      okText: "Từ chối",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          // Tại đây bạn sẽ gọi API để cập nhật status thành 'draft'
          messageApi.info(
            "Khóa học đã bị từ chối và chuyển về trạng thái Nháp."
          )
          router.refresh()
        } catch (error) {
          message.error("Lỗi hệ thống")
        }
      },
    })
  }

  // --- Delete ---
  const handleDelete = (course: Course) => {
    if (course.status === "pending_approval") {
      messageApi.warning("Bạn không thể xóa khóa học đang chờ duyệt.")
      return
    } else if (course.status === "published") {
      messageApi.warning("Bạn không thể xóa khóa học đã được xuất bản.")
      return
    }

    setCourseToDelete(course)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return

    const messageKey = `delete-course-${courseToDelete.id}`
    messageApi.open({
      key: messageKey,
      type: "loading",
      content: "Đang xóa khóa học...",
      duration: 0,
    })
    try {
      const res = await deleteCourseAPI(courseToDelete.id)
      if (res.success) {
        messageApi.open({
          key: messageKey,
          type: "success",
          content: "Khóa học đã được chuyển vào thùng rác",
          duration: 2,
        })
        router.refresh()
      } else {
        messageApi.open({
          key: messageKey,
          type: "error",
          content: res.error || "Không thể xóa",
          duration: 3,
        })
      }
    } catch (error) {
      messageApi.open({
        key: messageKey,
        type: "error",
        content: "System error occurred",
        duration: 3,
      })
    } finally {
      setIsDeleteModalOpen(false)
      setCourseToDelete(null)
    }
  }

  // --- Pagination ---
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (query) params.set("query", query)
    params.set("page", String(newPage))
    router.push(`/courses/management?${params.toString()}`)
  }

  // Status color mapping
  const statusColors: Record<string, string> = {
    published: "green",
    draft: "blue",
    pending_approval: "gold",
    rejected: "red",
  }

  // Status options for filter
  const statusOptions = [
    { label: "Tất cả trạng thái", value: "All" },
    { label: "Nháp", value: "draft" },
    { label: "Chờ duyệt", value: "pending_approval" },
    { label: "Đã xuất bản", value: "published" },
    { label: "Đã từ chối", value: "rejected" },
  ]

  // --- Columns ---
  const allColumns = [
    {
      title: "Tên Khóa học",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Course) => (
        <Link
          href={`/courses/${record.id}`}
          className="flex items-center space-x-4 group hover:cursor-pointer"
        >
          {record.thumbnail_url ? (
            <img
              src={record.thumbnail_url}
              alt={text}
              className="w-20 h-14 rounded object-cover border border-gray-200 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="w-20 h-14 rounded bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Không có hình ảnh</span>
            </div>
          )}
          <div className="flex flex-col justify-center">
            <div className="font-semibold text-blue-600 group-hover:text-blue-800 transition-colors text-base line-clamp-1">
              {text}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {record.category_name || "Chưa phân loại"}
            </div>
          </div>
        </Link>
      ),
    },
    // Chỉ hiển thị cột Creator nếu không phải Training Manager
    !isTrainingManager && {
      title: "Người tạo",
      key: "creator",
      render: (_: any, record: Course) => {
        const creatorName =
          (record as any).creator_name ||
          (record as any).creator_full_name ||
          (record as any).full_name ||
          "Unknown user"
        const creatorAvatar =
          (record as any).creator_avatar ||
          (record as any).creator_avatar_url ||
          (record as any).avatar_url ||
          (record as any).user_avatar ||
          null

        const getInitials = (name: string) =>
          name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "U"

        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={creatorAvatar || undefined}
              icon={!creatorAvatar ? <UserOutlined /> : undefined}
              size={32}
            >
              {!creatorAvatar ? getInitials(creatorName) : null}
            </Avatar>
            <Text className="text-gray-700 font-medium">{creatorName}</Text>
          </div>
        )
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default"
        if (status === "published") color = "success"
        if (status === "pending_approval") color = "processing"
        if (status === "draft") color = "warning"
        if (status === "rejected") color = "error"

        return (
          <Tag
            color={color}
            className="uppercase text-xs font-bold px-2 py-0.5 rounded-full"
          >
            {COURSE_STATUS_LABELS[
              status as keyof typeof COURSE_STATUS_LABELS
            ] || status}
          </Tag>
        )
      },
    },
    // Chỉ hiển thị cột Confirm Course cho Admin và Head of Department
    canApproveCourse && {
      title: "Duyệt Khóa học",
      key: "confirm_course",
      align: "center" as const,
      render: (_: any, record: Course) => {
        if (record.status === "pending_approval") {
          return (
            <div className="flex gap-2 justify-center">
              <Button
                type="primary"
                size="small"
                className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  handleApprove(record)
                }}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReject(record.id, record.title)
                }}
              >
                Từ chối
              </Button>
            </div>
          )
        }
        return (
          <span className="text-gray-500 text-sm">Không cần hành động</span>
        )
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: Date) => (
        <span className="text-gray-500 font-medium">
          {new Date(date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Course) => (
        <div className="flex gap-1 justify-end">
          {/* Nút Edit */}
          <Tooltip title="Chỉnh sửa khóa học">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="middle"
              className="text-blue-600 hover:!text-blue-700 hover:bg-blue-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenUpdate(record)
              }}
            />
          </Tooltip>

          {/* Nút Delete */}
          <Tooltip
            title={
              record.status === "published"
                ? "Khóa học đã được xuất bản"
                : record.status === "pending_approval"
                  ? "Khóa học đang chờ duyệt"
                  : "Xóa khóa học"
            }
          >
            <Button
              type="text"
              danger={record.status !== "published"}
              icon={<DeleteOutlined />}
              size="middle"
              disabled={
                record.status === "published" ||
                record.status === "pending_approval"
              }
              className={
                record.status === "published" ||
                record.status === "pending_approval"
                  ? "!text-gray-400 cursor-not-allowed rounded-full"
                  : "hover:bg-red-50 rounded-full"
              }
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleDelete(record)
              }}
            />
          </Tooltip>

          {/* Nút Enrollments */}
          <Tooltip
            title={
              record.status !== "published"
                ? "Khóa học chưa được xuất bản"
                : "Xem ghi danh"
            }
          >
            <Button
              type="text"
              icon={<ReadOutlined />}
              size="middle"
              disabled={record.status !== "published"}
              className={
                record.status !== "published"
                  ? "!text-gray-400 cursor-not-allowed rounded-full"
                  : "text-green-600 hover:!text-green-700 hover:bg-green-50 rounded-full"
              }
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (record.status !== "published") return
                router.push(`/courses/management/${record.id}/enrollments`)
              }}
            />
          </Tooltip>

          {/* Nút Feedback */}
          <Tooltip
            title={
              record.status !== "published"
                ? "Khóa học chưa được xuất bản"
                : "Xem phản hồi"
            }
          >
            <Button
              type="text"
              icon={<StarOutlined />}
              size="middle"
              disabled={record.status !== "published"}
              style={
                record.status === "published" ? { color: "#ca8a04" } : undefined
              }
              className={
                record.status !== "published"
                  ? "!text-gray-400 cursor-not-allowed rounded-full"
                  : "hover:bg-yellow-50 rounded-full"
              }
              onMouseEnter={(e) => {
                if (record.status !== "published") return
                e.currentTarget.style.color = "#b45309"
              }}
              onMouseLeave={(e) => {
                if (record.status !== "published") return
                e.currentTarget.style.color = "#ca8a04"
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (record.status !== "published") return
                router.push(`/courses/management/${record.id}/feedback`)
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  // Filter out false values from conditional columns
  const columns = allColumns.filter(Boolean) as any[]

  return (
    <div className="space-y-6">
      {contextHolder}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          Quản lý Khóa học
        </h1>
        <div
          className="flex align-center justify-between gap-6"
          style={{ marginBottom: 16 }}
        >
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Quản lý và tổ chức khóa học của bạn
          </p>
          <Button
            style={{
              background: "#ffffff",
              borderColor: "#1e40af",
              borderWidth: "1.5px",
              borderRadius: "0.375rem",
              color: "#1e40af",
              fontSize: "12px",
              fontWeight: 500,
              height: "36px",
              paddingInline: "14px",
              boxShadow: "0 2px 8px rgba(30, 64, 175, 0.12)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            onMouseEnter={(e) => {
              const button = e.currentTarget as HTMLButtonElement
              button.style.background = "#f8fafc"
              button.style.boxShadow = "0 8px 20px rgba(30, 64, 175, 0.2)"
              button.style.borderColor = "#1e3a8a"
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget as HTMLButtonElement
              button.style.background = "#ffffff"
              button.style.boxShadow = "0 2px 8px rgba(30, 64, 175, 0.12)"
              button.style.borderColor = "#1e40af"
            }}
          >
            Tạo Khóa học
          </Button>
        </div>
        <Divider
          style={{ borderColor: "rgba(37, 99, 235, 0.15)", margin: "16px 0" }}
        />
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="space-y-3">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder="Search courses..."
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            size="middle"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ marginBottom: 12 }}
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Danh mục
              </Text>
              <Select
                mode="multiple"
                placeholder="Select categories..."
                value={selectedCategoryList}
                onChange={handleCategoryChange}
                options={categories.map((cat: any) => ({
                  label: cat.name,
                  value: String(cat.id),
                }))}
                maxTagCount="responsive"
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Trạng thái
              </Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={statusOptions}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Sắp xếp theo
              </Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: "Mới nhất", value: "newest" },
                  { label: "Cũ nhất", value: "oldest" },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-end">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Chế độ xem
              </Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as "list" | "grid")}
                options={[
                  { label: "Danh sách", value: "list" },
                  { label: "Lưới", value: "grid" },
                ]}
                block
              />
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col justify-end">
                <Tooltip title="Xóa tất cả bộ lọc">
                  <Button
                    type="dashed"
                    danger
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    Xóa bộ lọc
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table/Grid View */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {viewMode === "list" ? (
          <div className="p-6">
            <Table
              columns={columns}
              dataSource={filteredCourses}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: 10,
                total: totalCount,
                onChange: handlePageChange,
                showTotal: (total) => `Tổng cộng ${total} khóa học`,
              }}
              bordered
              size="middle"
            />
          </div>
        ) : (
          <div className="p-6">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8">Không tìm thấy khóa học</div>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredCourses.map((course) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={course.id}>
                    <Card
                      hoverable
                      cover={
                        course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="h-40 w-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/240x160?text=Không có hình ảnh"
                            }}
                          />
                        ) : (
                          <div className="h-40 w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">
                              Không có hình ảnh
                            </span>
                          </div>
                        )
                      }
                      extra={
                        <Tag
                          color={statusColors[course.status] || "default"}
                          className="text-xs"
                        >
                          {COURSE_STATUS_LABELS[
                            course.status as keyof typeof COURSE_STATUS_LABELS
                          ] || course.status}
                        </Tag>
                      }
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        if (!canEditCourse(course)) return
                        handleOpenUpdate(course)
                      }}
                    >
                      <Card.Meta
                        title={
                          <Link
                            href={`/courses/${course.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {course.title}
                          </Link>
                        }
                        description={
                          <div className="mt-2 flex items-center gap-2 text-gray-500">
                            <span className="text-xs">by</span>
                            <Avatar
                              size={22}
                              src={
                                (course as any).creator_avatar ||
                                (course as any).creator_avatar_url ||
                                (course as any).avatar_url ||
                                (course as any).user_avatar ||
                                undefined
                              }
                              icon={
                                !(
                                  (course as any).creator_avatar ||
                                  (course as any).creator_avatar_url ||
                                  (course as any).avatar_url ||
                                  (course as any).user_avatar
                                ) ? (
                                  <UserOutlined />
                                ) : undefined
                              }
                            >
                              {!(course as any).creator_avatar &&
                              !(course as any).creator_avatar_url &&
                              !(course as any).avatar_url &&
                              !(course as any).user_avatar
                                ? (
                                    ((course as any).creator_name ||
                                      (course as any).creator_full_name ||
                                      (course as any).full_name ||
                                      "Unknown user") as string
                                  )
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0]?.toUpperCase())
                                    .join("") || "U"
                                : null}
                            </Avatar>
                            <Text className="!mb-0 !text-gray-600 text-sm">
                              {(course as any).creator_name ||
                                (course as any).creator_full_name ||
                                (course as any).full_name ||
                                "Unknown user"}
                            </Text>
                          </div>
                        }
                      />
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <Text type="secondary">Danh mục:</Text>
                          <Text strong>{course.category_name || "--"}</Text>
                        </div>
                        <div className="flex justify-between">
                          <Text type="secondary">Ngày tạo:</Text>
                          <Text strong>
                            {new Date(course.created_at).toLocaleDateString(
                              "vi-VN"
                            )}
                          </Text>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          {canEditCourse(course) ? (
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              className="flex-1 text-blue-600 hover:!text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenUpdate(course)
                              }}
                            >
                              Chỉnh sửa
                            </Button>
                          ) : null}
                          <Tooltip
                            title={
                              course.status === "published"
                                ? "Khóa học đã được xuất bản"
                                : course.status === "pending_approval"
                                  ? "Khóa học đang chờ duyệt"
                                  : ""
                            }
                          >
                            <span className="flex-1">
                              <Button
                                type="text"
                                danger={course.status !== "published"}
                                size="small"
                                icon={<DeleteOutlined />}
                                disabled={
                                  course.status === "published" ||
                                  course.status === "pending_approval"
                                }
                                className={
                                  course.status === "published" ||
                                  course.status === "pending_approval"
                                    ? "w-full !text-gray-400 cursor-not-allowed"
                                    : "w-full hover:bg-red-50"
                                }
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(course)
                                }}
                              >
                                Xóa
                              </Button>
                            </span>
                          </Tooltip>
                        </div>
                        <div className="flex gap-2">
                          <Tooltip
                            title={
                              course.status !== "published"
                                ? "Khóa học chưa được xuất bản"
                                : ""
                            }
                          >
                            <span className="w-full">
                              <Button
                                type="text"
                                size="small"
                                icon={<ReadOutlined />}
                                disabled={course.status !== "published"}
                                className={
                                  course.status !== "published"
                                    ? "w-full !text-gray-400 cursor-not-allowed"
                                    : "w-full text-green-600 hover:!text-green-700 hover:bg-green-50"
                                }
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (course.status !== "published") return
                                  router.push(
                                    `/courses/management/${course.id}/enrollments`
                                  )
                                }}
                              >
                                Xem Ghi danh
                              </Button>
                            </span>
                          </Tooltip>
                        </div>
                        <div className="flex gap-2">
                          <Tooltip
                            title={
                              course.status !== "published"
                                ? "Khóa học chưa được xuất bản"
                                : ""
                            }
                          >
                            <span className="w-full">
                              <Button
                                type="text"
                                size="small"
                                icon={<StarOutlined />}
                                disabled={course.status !== "published"}
                                className={
                                  course.status !== "published"
                                    ? "w-full !text-gray-400 cursor-not-allowed"
                                    : "w-full hover:bg-yellow-50"
                                }
                                style={
                                  course.status === "published"
                                    ? { color: "#ca8a04" }
                                    : undefined
                                }
                                onMouseEnter={(e) => {
                                  if (course.status !== "published") return
                                  e.currentTarget.style.color = "#b45309"
                                }}
                                onMouseLeave={(e) => {
                                  if (course.status !== "published") return
                                  e.currentTarget.style.color = "#ca8a04"
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (course.status !== "published") return
                                  router.push(
                                    `/courses/management/${course.id}/feedback`
                                  )
                                }}
                              >
                                Xem Phản hồi
                              </Button>
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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
            userRole={userRole} // ✅ TRUYỀN THÊM PROP NÀY XUỐNG FORM UPDATE
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

      {/* Approve Confirmation Modal */}
      <Modal
        title="Duyệt Khóa học"
        open={isApproveModalOpen}
        onOk={confirmApprove}
        onCancel={() => {
          setIsApproveModalOpen(false)
          setCourseToApprove(null)
        }}
        okText="Duyệt"
        cancelText="Hủy"
        okButtonProps={{ type: "primary" }}
        centered
      >
        <div>
          Bạn có chắc chắn muốn duyệt <b>"{courseToApprove?.title}"</b>?
          <br />
          <span className="text-gray-500 text-sm">
            Khóa học này sẽ được công bố và hiển thị cho sinh viên.
          </span>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa Khóa học"
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        centered
      >
        <p>
          Bạn có chắc chắn muốn xóa "<b>{courseToDelete?.title}</b>"? Hành động
          này sẽ chuyển khóa học vào thùng rác.
        </p>
      </Modal>
    </div>
  )
}
