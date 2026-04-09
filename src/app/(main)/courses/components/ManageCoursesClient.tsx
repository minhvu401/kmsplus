// @/src/app/(main)/courses/components/ManageCoursesClient.tsx
"use client"

import React, { useState, useEffect, useTransition } from "react"
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
  InfoCircleOutlined,
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
import useLanguageStore from "@/store/useLanguageStore"

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
  const handledFlashRef = React.useRef<string | null>(null)
  const { language } = useLanguageStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isFilterPending, startFilterTransition] = useTransition()
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
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [courseToReject, setCourseToReject] = useState<Course | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isViewReasonModalOpen, setIsViewReasonModalOpen] = useState(false)
  const [viewReason, setViewReason] = useState<string>("")

  // New: Additional filters and view modes
  // ✅ ĐLCS THÊM: Initialize từ URL params
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(() => {
    const urlSort = searchParams.get("sort")
    return (urlSort as "newest" | "oldest") || "newest"
  })
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const urlStatus = searchParams.get("status")
    return urlStatus || "All"
  })
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Check if user is Training Manager (case-insensitive, handle spaces)
  const normalizedRole = userRole?.toLowerCase().trim() || ""
  const isHeadOfDepartmentView = enforceCreatorOnlyEdit

  const isTrainingManager =
    !isHeadOfDepartmentView &&
    normalizedRole.replace(/\s+/g, "") === "trainingmanager"

  // ✅ THÊM BIẾN NÀY: Kiểm tra xem User có phải Admin hoặc Trưởng phòng không
  const canApproveCourse =
    isHeadOfDepartmentView ||
    normalizedRole.includes("admin") ||
    normalizedRole.includes("head of department") ||
    normalizedRole.includes("director")

  const canEditCourse = (course: Course) => {
    if (!enforceCreatorOnlyEdit) return true
    if (!currentUserId) return false
    return Number(course.creator_id) === Number(currentUserId)
  }

  // Check if any filter is active
  useEffect(() => {
    // ✅ ĐLCS CẬP NHẬT: Include selectedStatus and sortOrder
    const active =
      selectedCategoryList.length > 0 ||
      query !== "" ||
      selectedStatus !== "All" ||
      sortOrder !== "newest"
    setHasActiveFilters(active)
  }, [selectedCategoryList, query, selectedStatus, sortOrder])

  // Show redirect flash message once, then clean it from URL.
  useEffect(() => {
    const flash = searchParams.get("flash")
    if (!flash) return
    if (handledFlashRef.current === flash) return

    handledFlashRef.current = flash

    if (flash === "course-not-found") {
      messageApi.error(
        "We couldn't find that course. It may have been moved or deleted."
      )
    } else if (flash === "course-access-denied") {
      messageApi.error("You do not have permission to manage this course.")
    } else {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("flash")
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }, [messageApi, pathname, router, searchParams])

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
    startFilterTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // ✅ ĐLCS THÊM: Handler cho status change - update URL
  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1") // Reset to first page when filter changes

    if (newStatus === "All") {
      params.delete("status")
    } else {
      params.set("status", newStatus)
    }

    setSelectedStatus(newStatus)
    startFilterTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // ✅ ĐLCS THÊM: Handler cho sort change - update URL
  const handleSortChange = (newSort: "newest" | "oldest") => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1") // Reset to first page when filter changes

    if (newSort === "newest") {
      params.delete("sort")
    } else {
      params.set("sort", newSort)
    }

    setSortOrder(newSort)
    startFilterTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams()
    setSelectedCategoryList([])
    setSearchInput("")
    setSelectedStatus("All")
    setSortOrder("newest")
    startFilterTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleOpenUpdate = async (course: Course) => {
    if (!canEditCourse(course)) {
      messageApi.warning(
        language === "vi"
          ? "Bạn chỉ có thể chỉnh sửa khóa học do bạn tạo."
          : "You can only edit courses that you created."
      )
      return
    }

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
      messageApi.error(
        language === "vi"
          ? "Không thể tải thông tin khóa học."
          : "Unable to load course information."
      )
    } finally {
      hide()
    }
  }

  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false)
    setSelectedCourse(null)
    messageApi.success(
      language === "vi"
        ? "Cập nhật khóa học thành công"
        : "Course updated successfully"
    )
    router.refresh() // Tải lại dữ liệu bảng
  }
  const handleUpdateError = (error?: string) => {
    messageApi.error(
      error ||
        (language === "vi"
          ? "Không thể cập nhật khóa học"
          : "Unable to update course")
    )
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    messageApi.success(
      language === "vi"
        ? "Tạo khóa học thành công"
        : "Course created successfully"
    )
    router.refresh()
  }

  const handleCreateError = (error?: string) => {
    messageApi.error(
      error ||
        (language === "vi"
          ? "Không thể tạo khóa học"
          : "Unable to create course")
    )
  }
  // --- Search ---
  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set("query", value)
    if (selectedCategoryList.length > 0) {
      selectedCategoryList.forEach((cat) => params.append("category", cat))
    }
    params.set("page", "1")
    startFilterTransition(() => {
      router.push(`/courses/management?${params.toString()}`)
    })
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
      content:
        language === "vi" ? "Đang duyệt khóa học..." : "Approving course...",
      duration: 0,
    })

    try {
      const res = await approveCourse(courseToApprove.id)
      if (res.success) {
        messageApi.open({
          key: messageKey,
          type: "success",
          content:
            language === "vi"
              ? "Duyệt khóa học thành công"
              : "Course approved successfully",
          duration: 2,
        })

        setTimeout(() => router.refresh(), 200)
      } else {
        messageApi.open({
          key: messageKey,
          type: "error",
          content:
            res.error ||
            (language === "vi"
              ? "Không thể duyệt khóa học"
              : "Unable to approve course"),
          duration: 3,
        })
      }
    } catch (error) {
      messageApi.open({
        key: messageKey,
        type: "error",
        content: language === "vi" ? "Lỗi hệ thống" : "System error occurred",
        duration: 3,
      })
    } finally {
      setIsApproveModalOpen(false)
      setCourseToApprove(null)
    }
  }

  // --- Reject ---
  const handleReject = (course: Course) => {
    setCourseToReject(course)
    setRejectReason("")
    setIsRejectModalOpen(true)
  }

  const confirmReject = async () => {
    if (!courseToReject) return

    const messageKey = `reject-course-${courseToReject.id}`
    messageApi.open({
      key: messageKey,
      type: "loading",
      content:
        language === "vi" ? "Đang từ chối khóa học..." : "Rejecting course...",
      duration: 0,
    })

    try {
      const res = await rejectCourseAction(courseToReject.id, rejectReason)
      if (res.success) {
        messageApi.open({
          key: messageKey,
          type: "success",
          content:
            language === "vi"
              ? "Từ chối khóa học thành công"
              : "Course rejected successfully",
          duration: 2,
        })
        setTimeout(() => router.refresh(), 200)
      } else {
        messageApi.open({
          key: messageKey,
          type: "error",
          content:
            res.error ||
            (language === "vi"
              ? "Không thể từ chối khóa học"
              : "Unable to reject course"),
          duration: 3,
        })
      }
    } catch (error) {
      messageApi.open({
        key: messageKey,
        type: "error",
        content: language === "vi" ? "Lỗi hệ thống" : "System error occurred",
        duration: 3,
      })
    } finally {
      setIsRejectModalOpen(false)
      setCourseToReject(null)
      setRejectReason("")
    }
  }

  const handleViewReason = (reason: string) => {
    setViewReason(reason)
    setIsViewReasonModalOpen(true)
  }

  // --- Delete ---
  const handleDelete = (course: Course) => {
    if (course.status === "pending_approval") {
      messageApi.warning(
        language === "vi"
          ? "Bạn không thể xóa khóa học đang chờ duyệt."
          : "You cannot delete a course that is pending approval."
      )
      return
    } else if (course.status === "published") {
      messageApi.warning(
        language === "vi"
          ? "Bạn không thể xóa khóa học đã được xuất bản."
          : "You cannot delete a published course."
      )
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
      content:
        language === "vi" ? "Đang xóa khóa học..." : "Deleting course...",
      duration: 0,
    })
    try {
      const res = await deleteCourseAPI(courseToDelete.id)
      if (res.success) {
        messageApi.open({
          key: messageKey,
          type: "success",
          content:
            language === "vi"
              ? "Khóa học đã được chuyển vào thùng rác"
              : "Course has been moved to trash",
          duration: 2,
        })
        router.refresh()
      } else {
        messageApi.open({
          key: messageKey,
          type: "error",
          content:
            res.error ||
            (language === "vi" ? "Không thể xóa" : "Unable to delete course"),
          duration: 3,
        })
      }
    } catch (error) {
      messageApi.open({
        key: messageKey,
        type: "error",
        content: language === "vi" ? "Lỗi hệ thống" : "System error occurred",
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

    // ✅ ĐLCS THÊM: Preserve categories filter
    selectedCategoryList.forEach((cat) => params.append("category", cat))

    // ✅ ĐLCS THÊM: Preserve status and sort filters
    if (selectedStatus !== "All") params.set("status", selectedStatus)
    if (sortOrder !== "newest") params.set("sort", sortOrder)

    params.set("page", String(newPage))
    startFilterTransition(() => {
      router.push(`/courses/management?${params.toString()}`)
    })
  }

  // Status color mapping
  const statusColors: Record<string, string> = {
    published: "success",
    draft: "warning",
    pending_approval: "processing",
    rejected: "error",
  }

  // Status options for filter
  const statusOptions = [
    {
      label: language === "vi" ? "Tất cả trạng thái" : "All Statuses",
      value: "All",
    },
    { label: language === "vi" ? "Nháp" : "Draft", value: "draft" },
    {
      label: language === "vi" ? "Chờ duyệt" : "Pending Approval",
      value: "pending_approval",
    },
    {
      label: language === "vi" ? "Đã xuất bản" : "Published",
      value: "published",
    },
    { label: language === "vi" ? "Đã từ chối" : "Rejected", value: "rejected" },
  ]

  // --- Columns ---
  const allColumns = [
    {
      title: language === "vi" ? "Tên Khóa học" : "Course Name",
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
              <span className="text-gray-400 text-xs">
                {language === "vi" ? "Không có hình ảnh" : "No image available"}
              </span>
            </div>
          )}
          <div className="flex flex-col justify-center">
            <div className="font-semibold text-blue-600 group-hover:text-blue-800 transition-colors text-base line-clamp-1">
              {text}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {record.category_name ||
                (language === "vi" ? "Chưa phân loại" : "Not categorized")}
            </div>
          </div>
        </Link>
      ),
    },
    // Chỉ hiển thị cột Creator nếu không phải Training Manager
    !isTrainingManager && {
      title: language === "vi" ? "Người tạo" : "Creator",
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
              size={32}
              className="flex-shrink-0"
            >
              {!creatorAvatar ? getInitials(creatorName) : null}
            </Avatar>
            <Text className="text-gray-700 font-medium">{creatorName}</Text>
          </div>
        )
      },
    },
    {
      title: language === "vi" ? "Trạng thái" : "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Course) => {
        let color = "default"
        if (status === "published") color = "success"
        if (status === "pending_approval") color = "processing"
        if (status === "draft") color = "warning"
        if (status === "rejected") color = "error"

        return (
          <div className="flex items-center gap-2">
            <Tag
              color={color}
              className="uppercase text-xs font-bold px-2 py-0.5 rounded-full"
            >
              {COURSE_STATUS_LABELS[
                status as keyof typeof COURSE_STATUS_LABELS
              ] || status}
            </Tag>
            {status === "rejected" && record.rejection_reason && (
              <Tooltip
                title={
                  language === "vi"
                    ? "Xem lý do từ chối"
                    : "View rejection reason"
                }
              >
                <InfoCircleOutlined
                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewReason(record.rejection_reason || "")
                  }}
                />
              </Tooltip>
            )}
          </div>
        )
      },
    },
    // Chỉ hiển thị cột Confirm Course cho Admin và Head of Department
    canApproveCourse && {
      title: language === "vi" ? "Duyệt Khóa học" : "Confirm Course",
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
                {language === "vi" ? "Duyệt" : "Approve"}
              </Button>
              <Button
                danger
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReject(record)
                }}
              >
                {language === "vi" ? "Từ chối" : "Reject"}
              </Button>
            </div>
          )
        }
        return (
          <span className="text-gray-500 text-sm">
            {language === "vi" ? "Không cần hành động" : "No action needed"}
          </span>
        )
      },
    },
    {
      title: language === "vi" ? "Ngày tạo" : "Created Date",
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
      title: language === "vi" ? "Hành động" : "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Course) => (
        <div className="flex gap-1 justify-end">
          {/* Nút Edit */}
          <Tooltip
            title={
              canEditCourse(record)
                ? language === "vi"
                  ? "Chỉnh sửa khóa học"
                  : "Edit Course"
                : language === "vi"
                  ? "Bạn chỉ có thể chỉnh sửa khóa học do bạn tạo"
                  : "You can only edit courses that you created"
            }
          >
            <Button
              type="text"
              icon={<EditOutlined />}
              size="middle"
              disabled={!canEditCourse(record)}
              className={
                canEditCourse(record)
                  ? "text-blue-600 hover:!text-blue-700 hover:bg-blue-50 rounded-full"
                  : "!text-gray-400 cursor-not-allowed rounded-full"
              }
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
                ? language === "vi"
                  ? "Khóa học đã được xuất bản"
                  : "Course published"
                : record.status === "pending_approval"
                  ? language === "vi"
                    ? "Khóa học đang chờ duyệt"
                    : "Course pending approval"
                  : language === "vi"
                    ? "Xóa khóa học"
                    : "Delete Course"
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
                ? language === "vi"
                  ? "Khóa học chưa được xuất bản"
                  : "Course not published"
                : language === "vi"
                  ? "Xem ghi danh"
                  : "View Enrollments"
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
                ? language === "vi"
                  ? "Khóa học chưa được xuất bản"
                  : "Course not published"
                : language === "vi"
                  ? "Xem phản hồi"
                  : "View Feedback"
            }
          >
            <Button
              type="text"
              icon={<StarOutlined />}
              size="middle"
              disabled={record.status !== "published"}
              className={
                record.status !== "published"
                  ? "!text-gray-400 cursor-not-allowed rounded-full"
                  : "!text-yellow-700 hover:!text-amber-700 hover:bg-yellow-50 rounded-full"
              }
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
          {language === "vi" ? "Quản lý Khóa học" : "Manage Courses"}
        </h1>
        <div
          className="flex align-center justify-between gap-6"
          style={{ marginBottom: 16 }}
        >
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            {language === "vi"
              ? "Quản lý và tổ chức khóa học của bạn"
              : "Manage and organize your courses"}
          </p>
          <Button
            style={{
              borderWidth: "1.5px",
              fontSize: "12px",
              fontWeight: 500,
              height: "36px",
              paddingInline: "14px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            className="bg-white !text-blue-800 border-blue-800 hover:!bg-slate-50 hover:!text-blue-900 hover:!border-blue-900 rounded-md shadow-[0_2px_8px_rgba(30,64,175,0.12)] hover:shadow-[0_8px_20px_rgba(30,64,175,0.2)] transition-all duration-300"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {language === "vi" ? "Tạo Khóa học" : "Create Course"}
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
                {language === "vi" ? "Danh mục" : "Category"}
              </Text>
              <Select
                mode="multiple"
                placeholder="Select categories..."
                value={selectedCategoryList}
                onChange={handleCategoryChange}
                showSearch
                optionFilterProp="label"
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
                {language === "vi" ? "Trạng thái" : "Status"}
              </Text>
              <Select
                value={selectedStatus}
                onChange={handleStatusChange}
                options={statusOptions}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                {language === "vi" ? " Sắp xếp theo" : "Sort by"}
              </Text>
              <Select
                value={sortOrder}
                onChange={handleSortChange}
                options={[
                  {
                    label: language === "vi" ? "Mới nhất" : "Newest",
                    value: "newest",
                  },
                  {
                    label: language === "vi" ? "Cũ nhất" : "Oldest",
                    value: "oldest",
                  },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-end">
              <Text type="secondary" className="text-sm font-medium mb-2">
                {language === "vi" ? "Chế độ xem" : "View mode"}
              </Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as "list" | "grid")}
                options={[
                  {
                    label: language === "vi" ? "Danh sách" : "List",
                    value: "list",
                  },
                  { label: language === "vi" ? "Lưới" : "Grid", value: "grid" },
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
                    {language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
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
              dataSource={courses}
              loading={isFilterPending}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: 10,
                total: totalCount,
                onChange: handlePageChange,
                showTotal: (total) => (
                  <span>
                    {language === "vi" ? "Tổng cộng" : "Total"} {total}{" "}
                    {language === "vi" ? "khóa học" : "courses"}
                  </span>
                ),
              }}
              bordered
              size="middle"
            />
          </div>
        ) : (
          <Spin spinning={isFilterPending}>
            <div className="p-6">
            {courses.length === 0 ? (
              <div className="text-center py-8">
                {language === "vi"
                  ? "Không tìm thấy khóa học"
                  : "No courses found"}
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {courses.map((course) => (
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
                              {language === "vi"
                                ? "Không có hình ảnh"
                                : "No image available"}
                            </span>
                          </div>
                        )
                      }
                      extra={
                        <div className="flex items-center gap-2">
                          <Tag
                            color={statusColors[course.status] || "default"}
                            className="text-xs"
                          >
                            {COURSE_STATUS_LABELS[
                              course.status as keyof typeof COURSE_STATUS_LABELS
                            ] || course.status}
                          </Tag>
                          {course.status === "rejected" &&
                            course.rejection_reason && (
                              <Tooltip
                                title={
                                  language === "vi"
                                    ? "Xem lý do từ chối"
                                    : "View rejection reason"
                                }
                              >
                                <InfoCircleOutlined
                                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewReason(
                                      course.rejection_reason || ""
                                    )
                                  }}
                                />
                              </Tooltip>
                            )}
                        </div>
                      }
                      className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
                      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
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
                              className="flex-shrink-0"
                              src={
                                (course as any).creator_avatar ||
                                (course as any).creator_avatar_url ||
                                (course as any).avatar_url ||
                                (course as any).user_avatar ||
                                undefined
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
                      <div className="mt-4 space-y-2 mt-auto">
                        {canApproveCourse && course.status === "pending_approval" && (
                          <div className="flex gap-2">
                            <span className="flex-1">
                              <Button
                                type="primary"
                                size="small"
                                className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprove(course)
                                }}
                              >
                                {language === "vi" ? "Duyệt" : "Approve"}
                              </Button>
                            </span>
                            <span className="flex-1">
                              <Button
                                danger
                                size="small"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReject(course)
                                }}
                              >
                                {language === "vi" ? "Từ chối" : "Reject"}
                              </Button>
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {canEditCourse(course) && (
                            <Tooltip
                              title={
                                language === "vi"
                                  ? "Chỉnh sửa khóa học"
                                  : "Edit Course"
                              }
                            >
                              <span className="flex-1">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  className="w-full text-blue-600 hover:!text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenUpdate(course)
                                  }}
                                >
                                  {language === "vi" ? "Chỉnh sửa" : "Edit"}
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                          {(course.status !== "published" && course.status !== "pending_approval") && (
                            <Tooltip
                              title={
                                language === "vi"
                                  ? "Xóa khóa học"
                                  : "Delete Course"
                              }
                            >
                              <span className="flex-1">
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  className="w-full hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(course)
                                  }}
                                >
                                  {language === "vi" ? "Xóa" : "Delete"}
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                        </div>
                        {course.status === "published" && (
                          <div className="flex gap-2">
                            <Tooltip
                              title={
                                course.status !== "published"
                                  ? language === "vi"
                                    ? "Khóa học chưa được xuất bản"
                                    : "Course not published"
                                  : ""
                              }
                            >
                              <span className="w-full">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<ReadOutlined />}
                                  className="w-full text-green-600 hover:!text-green-700 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (course.status !== "published") return
                                    router.push(
                                      `/courses/management/${course.id}/enrollments`
                                    )
                                  }}
                                >
                                  {language === "vi"
                                    ? "Xem Ghi danh"
                                    : "View Enrollments"}
                                </Button>
                              </span>
                            </Tooltip>
                          </div>
                        )}
                        {course.status === "published" && (
                          <div className="flex gap-2">
                            <Tooltip
                              title={
                                course.status !== "published"
                                  ? language === "vi"
                                    ? "Khóa học chưa được xuất bản"
                                    : "Course not published"
                                  : ""
                              }
                            >
                              <span className="w-full">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<StarOutlined />}
                                  className="w-full !text-yellow-700 hover:!text-amber-700 hover:bg-yellow-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (course.status !== "published") return
                                    router.push(
                                      `/courses/management/${course.id}/feedback`
                                    )
                                  }}
                                >
                                  {language === "vi"
                                    ? "Xem phản hồi"
                                    : "View Feedback"}
                                </Button>
                              </span>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            </div>
          </Spin>
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
            onError={handleUpdateError}
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
          onError={handleCreateError}
        />
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        title={language === "vi" ? "Duyệt Khóa học" : "Approve Course"}
        open={isApproveModalOpen}
        onOk={confirmApprove}
        onCancel={() => {
          setIsApproveModalOpen(false)
          setCourseToApprove(null)
        }}
        okText={language === "vi" ? "Duyệt" : "Approve"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
        okButtonProps={{ type: "primary" }}
        centered
      >
        <div>
          {language === "vi" ? (
            <>
              Bạn có chắc chắn muốn duyệt <b>{courseToApprove?.title}</b>?
            </>
          ) : (
            <>
              Are you sure you want to approve <b>{courseToApprove?.title}</b>?
            </>
          )}
          <br />
          <span className="text-gray-500 text-sm">
            {language === "vi"
              ? "Khóa học này sẽ được công bố và hiển thị cho sinh viên."
              : "This course will be published and visible to students."}
          </span>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={language === "vi" ? "Xóa Khóa học" : "Delete Course"}
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText={language === "vi" ? "Xóa" : "Delete"}
        okType="danger"
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
        centered
      >
        <p>
          {language === "vi" ? (
            <>
              Bạn có chắc chắn muốn xóa <b>{courseToDelete?.title}</b>? Hành
              động này sẽ chuyển khóa học vào thùng rác.
            </>
          ) : (
            <>
              Are you sure you want to delete <b>{courseToDelete?.title}</b>?
              This action will move the course to the trash.
            </>
          )}
        </p>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        title={
          language === "vi"
            ? "Từ chối Khóa học - Nhập lý do"
            : "Reject Course - Enter Reason"
        }
        open={isRejectModalOpen}
        onOk={confirmReject}
        onCancel={() => {
          setIsRejectModalOpen(false)
          setCourseToReject(null)
          setRejectReason("")
        }}
        okText={language === "vi" ? "Từ chối" : "Reject"}
        okType="danger"
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
        centered
        okButtonProps={{ disabled: !rejectReason.trim() }}
      >
        <div className="space-y-4">
          <p>
            {language === "vi" ? (
              <>
                Bạn đang từ chối khóa học <b>{courseToReject?.title}</b>. Vui
                lòng nhập lý do từ chối:
              </>
            ) : (
              <>
                You are rejecting the course <b>{courseToReject?.title}</b>.
                Please enter the rejection reason:
              </>
            )}
          </p>
          <Input.TextArea
            rows={4}
            placeholder={
              language === "vi"
                ? "Nhập lý do từ chối khóa học..."
                : "Enter rejection reason..."
            }
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxLength={500}
            showCount
          />
        </div>
      </Modal>

      {/* View Rejection Reason Modal */}
      <Modal
        title={language === "vi" ? "Lý do từ chối" : "Rejection Reason"}
        open={isViewReasonModalOpen}
        onCancel={() => {
          setIsViewReasonModalOpen(false)
          setViewReason("")
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsViewReasonModalOpen(false)
              setViewReason("")
            }}
          >
            {language === "vi" ? "Đóng" : "Close"}
          </Button>,
        ]}
        centered
      >
        <div className="space-y-2">
          {/* <p className="text-gray-600">
            {language === "vi" ? "Lý do từ chối:" : "Rejection reason:"}
          </p> */}
          <p className="text-gray-900 font-medium bg-gray-50 p-4 rounded-lg">
            {viewReason}
          </p>
        </div>
      </Modal>
    </div>
  )
}
