// @/src/app/(main)/courses/components/UpdateCourseForm.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import dayjs from "dayjs"
import {
  updateCourseAPI,
  getCategoriesAPI,
} from "@/action/courses/courseAction"
import { getAllDepartments } from "@/action/department/departmentActions"
import { getAllUsers } from "@/action/user/userActions"
import {
  createNewLessonAPI,
  updateLessonAPI,
  deleteLessonAPI,
} from "@/action/lesson/lessonActions"
import { COURSE_STATUS_LABELS } from "@/enum/course-status.enum"
import RichTextEditor from "@/components/ui/RichTextEditor"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  BookOpen,
  FileQuestion,
  Edit2,
  Trash2,
  Search,
  X,
  Plus,
  PlusCircle,
  Lock,
} from "lucide-react"
import {
  Input,
  Button,
  Steps,
  Modal,
  Select,
  message,
  Upload,
  Form,
  Radio,
  Popconfirm,
  DatePicker,
  InputNumber,
  Card,
  Divider,
  Alert,
} from "antd"
import {
  PlusOutlined,
  CheckCircleFilled,
  InboxOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons"

const { TextArea } = Input
const { Dragger } = Upload
const CLOUDINARY_CLOUD_NAME = "dhclot8lh"
const CLOUDINARY_UPLOAD_PRESET = "kms-plus"

// --- TYPES ---
export type Lesson = {
  id: number | bigint
  title: string
  duration_minutes: number | null
  type?: "text_media" | "video" | "pdf"
  content?: string
  category_id?: number | null
  video_url?: string | null // ✅ Thêm
  file_path?: string | null // ✅ Thêm
}
export type Quiz = { id: number; title: string; question_count: number }
export type CurriculumItem = {
  id: string
  order: number
  resource_id: number
  type: "lesson" | "quiz"
  title: string
  duration_minutes?: number | null
  question_count?: number
  // ✅ ĐLCS THÊM: lessondetails for editing
  lesson_type?: string
  video_url?: string | null
  file_path?: string | null
  lesson_content?: string | null
}
export type Section = {
  id: string
  title: string
  order: number
  items: CurriculumItem[]
}

export type AssignmentRulePayload = {
  id: string | number
  target_type: "all_employees" | "department" | "user" | "role"
  department_id?: number | null
  user_id?: number | null
  role_id?: number | null
  due_type: "relative" | "fixed" | "none" | null | undefined
  due_days?: number | null
  due_date?: any
}

export type CoursePayload = {
  id?: number
  creator_id?: number
  category_id?: number | null
  title?: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  visibility?: "public" | "private"
  assignment_rules?: AssignmentRulePayload[]
  curriculum: Section[]
}

const steps = ["Thông Tin Cơ Bản", "Thông Tin Nâng Cao"]
type StepStatus = "pending" | "valid" | "invalid"

interface UpdateCourseFormProps {
  initialData: CoursePayload
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  onSuccess: () => void
  onError?: (error?: string) => void
  userRole?: string // ✅ THÊM DÒNG NÀY
}

function SortableItem({
  id,
  children,
}: {
  id: string
  children: (listeners: any) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
    position: "relative" as "relative",
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  )
}

function ContentBankItem({ icon, title, meta, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="group flex items-center justify-between p-2 bg-white border rounded shadow-sm hover:shadow-md transition-shadow mb-2">
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <span className="text-blue-600 flex-shrink-0">{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium m-0 truncate" title={title}>
            {title}
          </p>
          <p className="text-xs text-gray-500 m-0">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 pl-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (onEdit) onEdit()
          }}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
          title="Edit"
        >
          <Edit2 size={14} />
        </button>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Popconfirm
            title="Delete this item?"
            description="Are you sure to delete this content?"
            onConfirm={(e) => {
              e?.stopPropagation()
              if (onDelete) onDelete()
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes"
            cancelText="No"
          >
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </Popconfirm>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors ml-1"
          title="Add to Curriculum"
        >
          <PlusCircle size={18} />
        </button>
      </div>
    </div>
  )
}

function FormModal({
  title,
  label,
  placeholder,
  initialValue = "",
  onClose,
  onSave,
}: any) {
  const [value, setValue] = useState(initialValue)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(value)
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full border px-3 py-2 rounded border-gray-300"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UpdateCourseForm({
  initialData,
  availableLessons: initialLessons = [],
  availableQuizzes: initialQuizzes = [],
  onSuccess,
  onError,
  userRole = "", // ✅ NHẬN PROP Ở ĐÂY
}: UpdateCourseFormProps) {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([])
  const [users, setUsers] = useState<
    { id: number; name: string; email: string }[]
  >([])
  const [availableLessons, setAvailableLessons] =
    useState<Lesson[]>(initialLessons)
  const [availableQuizzes, setAvailableQuizzes] =
    useState<Quiz[]>(initialQuizzes)

  // 🔥 KIỂM TRA TRẠNG THÁI PUBLISHED ĐỂ KHÓA UI
  const isLocked = initialData.status === "published"

  useEffect(() => {
    setAvailableLessons(initialLessons)
    setAvailableQuizzes(initialQuizzes)
  }, [initialLessons, initialQuizzes])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, departmentsData, usersData] = await Promise.all([
          getCategoriesAPI(),
          getAllDepartments(),
          getAllUsers(),
        ])
        setCategories(categoriesData)
        setDepartments(departmentsData || [])
        setUsers(
          usersData?.map((user: any) => ({
            id: user.id,
            name: user.name || user.email,
            email: user.email,
          })) || []
        )
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    fetchData()
  }, [])

  const handleLessonCreated = (newLesson: Lesson) =>
    setAvailableLessons((prev) => [newLesson, ...prev])
  const handleLessonUpdated = (updatedLesson: Lesson) => {
    setAvailableLessons((prev) =>
      prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    )
    setPayload((prev) => ({
      ...prev,
      curriculum: prev.curriculum.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.resource_id === Number(updatedLesson.id)
            ? {
                ...item,
                title: updatedLesson.title,
                duration_minutes: updatedLesson.duration_minutes,
              }
            : item
        ),
      })),
    }))
  }
  const handleLessonDeleted = (deletedId: number) => {
    setAvailableLessons((prev) =>
      prev.filter((l) => Number(l.id) !== deletedId)
    )
    setPayload((prev) => ({
      ...prev,
      curriculum: prev.curriculum.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.resource_id !== deletedId),
      })),
    }))
  }

  const router = useRouter()
  const [modal, contextHolder] = Modal.useModal()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  const [payload, setPayload] = useState<CoursePayload>({
    ...initialData,
    visibility: initialData.visibility || "private",
    assignment_rules: initialData.assignment_rules || [],
  })

  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("valid")
  )
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData.thumbnail_url || null
  )
  const [cropModalVisible, setCropModalVisible] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (payload.curriculum.length > 0 && !activeSectionId)
      setActiveSectionId(payload.curriculum[0].id)
  }, [payload.curriculum, activeSectionId])

  const handleUploadThumbnail = async (options: any) => {
    if (isLocked) return
    const { file, onSuccess, onError } = options
    const hide = message.loading("Đang tải ảnh lên...", 0)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      )
      if (!res.ok) throw new Error("Upload thất bại")
      const data = await res.json()
      setImageUrl(data.secure_url)
      update("thumbnail_url", data.secure_url)
      if (onSuccess) onSuccess("Ok")
      message.success("Tải ảnh thành công!")
    } catch (error: any) {
      message.error(`Lỗi tải ảnh: ${error.message}`)
      if (onError) onError({ error })
    } finally {
      hide()
    }
  }

  const findSectionId = (itemId: string) => {
    if (payload.curriculum.find((s) => s.id === itemId)) return itemId
    return payload.curriculum.find((s) => s.items.some((i) => i.id === itemId))
      ?.id
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (isLocked) return
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return
    const activeSectionId = findSectionId(activeId)
    const overSectionId = findSectionId(overId)
    if (!activeSectionId || !overSectionId) return
    setPayload((prev) => {
      const newCurriculum = [...prev.curriculum]
      const activeSectionIndex = newCurriculum.findIndex(
        (s) => s.id === activeSectionId
      )
      const overSectionIndex = newCurriculum.findIndex(
        (s) => s.id === overSectionId
      )
      if (activeSectionIndex === -1 || overSectionIndex === -1) return prev
      if (activeSectionId === overSectionId) {
        const section = newCurriculum[activeSectionIndex]
        const oldIndex = section.items.findIndex((i) => i.id === activeId)
        const newIndex = section.items.findIndex((i) => i.id === overId)
        newCurriculum[activeSectionIndex] = {
          ...section,
          items: arrayMove(section.items, oldIndex, newIndex),
        }
      } else {
        const sourceItems = [...newCurriculum[activeSectionIndex].items]
        const destItems = [...newCurriculum[overSectionIndex].items]
        const activeItemIndex = sourceItems.findIndex((i) => i.id === activeId)
        const [movedItem] = sourceItems.splice(activeItemIndex, 1)
        const overItemIndex = destItems.findIndex((i) => i.id === overId)
        const insertIndex =
          overItemIndex >= 0 ? overItemIndex : destItems.length + 1
        destItems.splice(insertIndex, 0, movedItem)
        newCurriculum[activeSectionIndex].items = sourceItems
        newCurriculum[overSectionIndex].items = destItems
      }
      return { ...prev, curriculum: newCurriculum }
    })
  }

  function update<K extends keyof CoursePayload>(
    key: K,
    value: CoursePayload[K]
  ) {
    setPayload((p) => ({ ...p, [key]: value }))
    setStepStatus((prev) => {
      const newStatus = [...prev]
      newStatus[current] = "pending"
      return newStatus
    })
  }

  function validateStep(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        if (!payload.title?.trim()) return false
        // ✅ THÊM: Bắt buộc chọn đúng dữ liệu khi thiết lập Assignment Rules
        if (payload.assignment_rules && payload.assignment_rules.length > 0) {
          const isRulesValid = payload.assignment_rules.every((rule) => {
            if (rule.target_type === "department" && !rule.department_id)
              return false
            if (rule.target_type === "role" && !rule.role_id) return false
            if (rule.target_type === "user" && !rule.user_id) return false
            if (rule.due_type === "relative" && !rule.due_days) return false
            if (rule.due_type === "fixed" && !rule.due_date) return false
            return true
          })
          if (!isRulesValid) return false
        }
        return true
      case 1:
        // ✅ THÊM: Khóa học nháp thì không ép buộc có khung chương trình
        if (payload.status === "draft") return true
        return (
          payload.curriculum.length > 0 &&
          payload.curriculum.every((s) => s.items.length > 0)
        )
      default:
        return false
    }
  }

  function changeStep(newIndex: number) {
    if (newIndex === current || newIndex < 0 || newIndex >= steps.length) return
    const isCurrentStepValid = validateStep(current)
    setStepStatus((prev) => {
      const newStatus = [...prev]
      newStatus[current] = isCurrentStepValid ? "valid" : "invalid"
      return newStatus
    })
    if (newIndex > current && !isCurrentStepValid) {
      message.error("Vui lòng điền đủ thông tin trước khi tiếp tục")
      return
    }
    setCurrent(newIndex)
  }

  async function handleSubmit() {
    const allStepsValidResults = steps.map((_, i) => validateStep(i))
    const isAllValid = allStepsValidResults.every((isValid) => isValid)
    setStepStatus((prev) =>
      prev.map((_, i) => (allStepsValidResults[i] ? "valid" : "invalid"))
    )

    if (!isAllValid) {
      const firstInvalid = allStepsValidResults.findIndex((v) => !v)
      if (firstInvalid !== -1) setCurrent(firstInvalid)
      message.error("Vui lòng hoàn thành tất cả các trường bắt buộc.")
      return
    }

    if (!payload.id) return

    setLoading(true)
    try {
      const finalPayload = {
        title: payload.title,
        description: payload.description,
        thumbnail_url: payload.thumbnail_url,
        status: payload.status,
        duration_hours: payload.duration_hours,
        category_id: payload.category_id,
        visibility: payload.visibility || "private",
        assignment_rules: payload.assignment_rules?.map((rule) => ({
          target_type: rule.target_type,
          department_id:
            rule.target_type === "department" ? rule.department_id : null,
          role_id: rule.target_type === "role" ? rule.role_id : null,
          user_id: rule.target_type === "user" ? rule.user_id : null,
          due_type: (rule.due_type === "none" || !rule.due_type
            ? undefined
            : rule.due_type) as "relative" | "fixed" | undefined,
          due_days: rule.due_type === "relative" ? rule.due_days : undefined,
          due_date:
            rule.due_type === "fixed" && rule.due_date
              ? dayjs(rule.due_date).toISOString()
              : undefined,
        })),
        curriculum: payload.curriculum,
      }

      const res = await updateCourseAPI(payload.id, finalPayload)
      if (res.success) {
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        if (onError) onError(res.error || "Cập nhật thất bại")
      }
    } catch (err) {
      if (onError) onError("Đã xảy ra lỗi hệ thống.")
    } finally {
      setLoading(false)
    }
  }

  const totalItems = payload.curriculum.reduce(
    (acc, s) => acc + s.items.length,
    0
  )

  return (
    <div className="bg-white flex flex-col h-[85vh] rounded-lg relative">
      {contextHolder}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {payload.title
            ? `Cập Nhật Khóa Học: ${payload.title}`
            : "Cập Nhật Khóa Học"}
        </h1>
        <div className="text-sm text-gray-500 mb-6">
          Step {current + 1} / {steps.length}
        </div>

        {/* 🔥 THÔNG BÁO KHÓA CHỈNH SỬA KHI ĐÃ PUBLISHED */}
        {isLocked && (
          <Alert
            message="Khóa học này đã Xuất Bản"
            description="Bạn chỉ có thể cấu hình Hiển thị thư viện và Phân công bắt buộc. Các nội dung khác đã bị khóa để bảo vệ tiến độ của học viên."
            type="warning"
            showIcon
            icon={<Lock />}
            className="mb-6"
          />
        )}

        <Steps
          className="mb-6"
          current={current}
          onChange={changeStep}
          items={steps.map((s, i) => ({
            title: s,
            status:
              stepStatus[i] === "valid"
                ? "finish"
                : stepStatus[i] === "invalid"
                  ? "error"
                  : "wait",
            description: i === 1 ? `${totalItems} items` : undefined,
          }))}
        />

        <div className="pb-4">
          {current === 0 && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <Input
                      disabled={isLocked}
                      value={payload.title || ""}
                      onChange={(e) => update("title", e.target.value)}
                      maxLength={255}
                      status={
                        stepStatus[0] === "invalid" && !payload.title?.trim()
                          ? "error"
                          : ""
                      }
                      showCount
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Danh mục
                    </label>
                    <Select
                      disabled={isLocked}
                      placeholder="Chọn danh mục"
                      className="w-full"
                      value={
                        payload.category_id
                          ? String(payload.category_id)
                          : undefined
                      }
                      onChange={(val) => update("category_id", Number(val))}
                      options={categories.map((c) => ({
                        value: String(c.id),
                        label: c.name,
                      }))}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mô tả ngắn
                    </label>
                    <TextArea
                      disabled={isLocked}
                      value={payload.description || ""}
                      onChange={(e) => update("description", e.target.value)}
                      rows={4}
                      showCount
                      maxLength={500}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ảnh đại diện
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isLocked
                        ? "border-gray-200 bg-gray-100 opacity-70 cursor-not-allowed"
                        : "border-gray-300 hover:border-blue-400 bg-gray-50"
                    }`}
                  >
                    {imageUrl ? (
                      <div className="relative group">
                        <img
                          src={imageUrl}
                          alt="Thumbnail"
                          className="w-full h-48 object-cover rounded-md border"
                        />
                        {!isLocked && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 hidden group-hover:flex flex-col gap-2 items-center justify-center rounded-md">
                            <Upload
                              accept="image/*"
                              showUploadList={false}
                              customRequest={handleUploadThumbnail}
                            >
                              <Button ghost>Thay Đổi Ảnh</Button>
                            </Upload>
                            <Button
                              ghost
                              onClick={() => setCropModalVisible(true)}
                            >
                              Cắt Ảnh
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Upload
                        disabled={isLocked}
                        accept="image/*"
                        showUploadList={false}
                        customRequest={handleUploadThumbnail}
                      >
                        <div className="py-8 flex flex-col items-center cursor-pointer">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
                            <InboxOutlined className="text-2xl" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            Nhấn để tải ảnh đại diện lên
                          </p>
                        </div>
                      </Upload>
                    )}
                  </div>
                  {!isLocked && (
                    <Input
                      value={payload.thumbnail_url || ""}
                      onChange={(e) => {
                        update("thumbnail_url", e.target.value)
                        setImageUrl(e.target.value)
                      }}
                      placeholder="Hoặc dán URL ảnh vào đây"
                      className="mt-3"
                    />
                  )}
                </div>
              </div>
              <Divider />
              {/* PHẦN ĐƯỢC PHÉP SỬA (KỂ CẢ KHI PUBLISHED) */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Cấu Hình Hiển Thị & Quy Tắc Ghi Danh
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block font-semibold text-gray-700 mb-2">
                        1. Hiển Thị Trong Thư Viện
                      </label>
                      <Radio.Group
                        value={payload.visibility || "private"}
                        onChange={(e) => update("visibility", e.target.value)}
                        className="space-y-2 w-full flex flex-col"
                      >
                        <Radio
                          value="public"
                          className="bg-white p-3 border rounded-md shadow-sm w-full"
                        >
                          <span className="font-semibold text-blue-600">
                            Công Khai (Thư Viện Mở)
                          </span>
                          <span className="block text-xs text-gray-500 mt-1">
                            Bất kỳ ai cũng có thể xem và tự ghi danh vào khóa
                            học này.
                          </span>
                        </Radio>
                        <Radio
                          value="private"
                          className="bg-white p-3 border rounded-md shadow-sm w-full m-0"
                        >
                          <span className="font-semibold text-orange-600">
                            Riêng Tư (Ẩn)
                          </span>
                          <span className="block text-xs text-gray-500 mt-1">
                            Ẩn khỏi thư viện. Chỉ người dùng được phân công mới
                            có thể xem.
                          </span>
                        </Radio>
                      </Radio.Group>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <label className="block font-semibold text-blue-900 mb-1">
                          2. Phân Công Bắt Buộc
                        </label>
                        <p className="text-xs text-blue-700">
                          Buộc các nhóm cụ thể phải tham gia khóa học này.
                        </p>
                      </div>
                      <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const newRule: AssignmentRulePayload = {
                            id: Date.now(),
                            target_type: "department",
                            due_type: "relative",
                            due_days: 14,
                          }
                          update("assignment_rules", [
                            ...(payload.assignment_rules || []),
                            newRule,
                          ])
                        }}
                      >
                        Thêm Quy Tắc
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] custom-scrollbar">
                      {!payload.assignment_rules ||
                      payload.assignment_rules.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-lg text-blue-400">
                          <SafetyCertificateOutlined className="text-2xl mb-2" />
                          <span className="text-sm">
                            Chưa có quy tắc bắt buộc nào được đặt.
                          </span>
                        </div>
                      ) : (
                        payload.assignment_rules.map((rule, index) => (
                          <Card
                            key={rule.id}
                            size="small"
                            className="shadow-sm border-blue-100 relative"
                          >
                            <div className="space-y-3">
                              <div className="flex gap-2 pr-6">
                                <Select
                                  value={rule.target_type}
                                  onChange={(val) => {
                                    const rules = [...payload.assignment_rules!]
                                    rules[index] = {
                                      ...rule,
                                      target_type: val,
                                      department_id: null,
                                      role_id: null,
                                      user_id: null,
                                    }
                                    update("assignment_rules", rules)
                                  }}
                                  className="w-32 flex-shrink-0"
                                  options={[
                                    {
                                      value: "all_employees",
                                      label: "Tất Cả NV",
                                    },
                                    { value: "department", label: "Phòng Ban" },
                                    { value: "role", label: "Vai Trò" },
                                    { value: "user", label: "Người Dùng" },
                                  ]}
                                />
                                <div className="flex-1">
                                  {rule.target_type === "department" && (
                                    <Select
                                      placeholder="Chọn Phòng Ban..."
                                      className="w-full"
                                      value={rule.department_id}
                                      onChange={(val) => {
                                        const r = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        r[index].department_id = val
                                        update("assignment_rules", r)
                                      }}
                                      options={departments.map((d) => ({
                                        value: d.id,
                                        label: d.name,
                                      }))}
                                      showSearch
                                      filterOption={(input, option) =>
                                        (option?.label ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                    />
                                  )}
                                  {rule.target_type === "role" && (
                                    <Select
                                      placeholder="Chọn Vai Trò..."
                                      className="w-full"
                                      value={rule.role_id}
                                      onChange={(val) => {
                                        const r = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        r[index].role_id = val
                                        update("assignment_rules", r)
                                      }}
                                      options={[
                                        {
                                          value: 1,
                                          label: "Quản Lý (Manager)",
                                        },
                                        {
                                          value: 2,
                                          label: "Nhân Viên (Staff)",
                                        },
                                      ]}
                                    />
                                  )}
                                  {rule.target_type === "user" && (
                                    <Select
                                      placeholder="Tìm người dùng..."
                                      className="w-full"
                                      value={rule.user_id}
                                      onChange={(val) => {
                                        const r = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        r[index].user_id = val
                                        update("assignment_rules", r)
                                      }}
                                      options={users.map((u) => ({
                                        value: u.id,
                                        label: `${u.name} (${u.email})`,
                                      }))}
                                      showSearch
                                      filterOption={(input, option) =>
                                        (option?.label ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                    />
                                  )}
                                  {rule.target_type === "all_employees" && (
                                    <Input
                                      disabled
                                      value="Toàn Công Ty"
                                      className="bg-gray-50 text-center"
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                                <span className="text-xs font-semibold text-gray-500 w-16">
                                  Hạn:
                                </span>
                                <Select
                                  size="small"
                                  value={rule.due_type}
                                  className="w-24"
                                  onChange={(val) => {
                                    const r = [
                                      ...(payload.assignment_rules || []),
                                    ]
                                    r[index].due_type = val
                                    update("assignment_rules", r)
                                  }}
                                  options={[
                                    { value: "none", label: "Không" },
                                    { value: "relative", label: "Ngày" },
                                    { value: "fixed", label: "Cố Định" },
                                  ]}
                                />
                                <div className="flex-1 flex justify-end">
                                  {rule.due_type === "relative" && (
                                    <InputNumber
                                      size="small"
                                      min={1}
                                      value={rule.due_days}
                                      onChange={(v) => {
                                        const r = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        r[index].due_days = v
                                        update("assignment_rules", r)
                                      }}
                                      addonAfter="ngày"
                                      className="w-full"
                                    />
                                  )}
                                  {rule.due_type === "fixed" && (
                                    <DatePicker
                                      size="small"
                                      value={
                                        rule.due_date
                                          ? dayjs(rule.due_date)
                                          : null
                                      }
                                      onChange={(d) => {
                                        const r = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        r[index].due_date = d
                                        update("assignment_rules", r)
                                      }}
                                      format="DD/MM/YYYY"
                                      className="w-full"
                                    />
                                  )}
                                  {(rule.due_type === "none" ||
                                    !rule.due_type) && (
                                    <span className="text-xs text-gray-400 italic">
                                      Không giới hạn
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="text"
                              danger
                              size="small"
                              className="absolute top-1 right-1"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                const r = [...payload.assignment_rules!]
                                r.splice(index, 1)
                                update("assignment_rules", r)
                              }}
                            />
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {current === 1 && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Trạng Thái
                  </label>
                  <Select
                    disabled={isLocked}
                    value={payload.status}
                    onChange={(v) => update("status", v)}
                    className="w-full"
                    // ✅ THAY ĐỔI OPTIONS THÀNH LOGIC LỌC
                    options={Object.entries(COURSE_STATUS_LABELS)
                      .filter(([v]) => {
                        // Nếu là Training Manager, chỉ cho thấy Draft và Pending
                        const isTM =
                          userRole.toLowerCase().replace(/\s+/g, "") ===
                          "trainingmanager"
                        if (isTM)
                          return v === "draft" || v === "pending_approval"
                        // Nếu là Admin/HoD thì cho thấy hết
                        return true
                      })
                      .map(([v, l]) => ({ value: v, label: l }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Thời Lượng (giờ)
                  </label>
                  <Input
                    disabled={isLocked}
                    type="number"
                    value={String(payload.duration_hours ?? "")}
                    onChange={(e) =>
                      update(
                        "duration_hours",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              </div>
              <hr className="my-6 border-gray-200" />
              <div>
                <CurriculumContentBank
                  modal={modal}
                  availableLessons={availableLessons}
                  availableQuizzes={availableQuizzes}
                  value={payload.curriculum}
                  onChange={(nc) => update("curriculum", nc)}
                  hasError={
                    stepStatus[1] === "invalid" &&
                    (payload.curriculum.length === 0 ||
                      payload.curriculum.some((s) => s.items.length === 0))
                  }
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                  activeSectionId={activeSectionId}
                  setActiveSectionId={setActiveSectionId}
                  onLessonCreated={handleLessonCreated}
                  onLessonUpdated={handleLessonUpdated}
                  onLessonDeleted={handleLessonDeleted}
                  categories={categories}
                  courseCategoryId={payload.category_id}
                  isLocked={isLocked} // 🔥 Truyền cờ khóa UI xuống dưới
                />
                {stepStatus[1] === "invalid" && (
                  <p className="mt-2 text-sm text-red-600">
                    Chương trình phải có ít nhất một chương, và mỗi chương phải
                    có ít nhất một mục.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="bg-white border-t p-4 flex justify-between rounded-b-lg shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 mt-auto shrink-0">
        <div>
          {current > 0 && (
            <Button size="large" onClick={() => changeStep(current - 1)}>
              Quay Lại
            </Button>
          )}
        </div>
        <div>
          {current < steps.length - 1 ? (
            <Button
              type="primary"
              size="large"
              onClick={() => changeStep(current + 1)}
            >
              Tiếp Tục Đến Chương Trình
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              style={{ backgroundColor: "#10b981" }}
              className="font-bold px-8 shadow-md"
            >
              Lưu Thay Đổi
            </Button>
          )}
        </div>
      </div>

      <Modal
        title="Cắt Ảnh"
        open={cropModalVisible}
        onCancel={() => setCropModalVisible(false)}
        onOk={() => setCropModalVisible(false)}
        width={600}
      >
        <div className="text-center">
          {imageUrl && (
            <img src={imageUrl} alt="Crop Preview" className="max-w-full" />
          )}
          <p className="mt-2 text-gray-500">Chức năng cắt ảnh placeholder.</p>
        </div>
      </Modal>
    </div>
  )
}

interface CurriculumContentBankProps {
  modal: any
  value: Section[]
  onChange: (v: Section[]) => void
  hasError: boolean
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  sensors: any
  onDragEnd: (e: DragEndEvent) => void
  activeSectionId: string | null
  setActiveSectionId: (id: string | null) => void
  onLessonCreated: (l: Lesson) => void
  onLessonUpdated: (l: Lesson) => void
  onLessonDeleted: (id: number) => void
  categories: { id: number; name: string }[]
  courseCategoryId?: number | null
  isLocked?: boolean // 🔥 Nhận biến khóa
}

function CurriculumContentBank({
  value: sections,
  onChange,
  hasError,
  availableLessons,
  availableQuizzes,
  sensors,
  onDragEnd,
  modal,
  activeSectionId,
  setActiveSectionId,
  onLessonCreated,
  onLessonUpdated,
  onLessonDeleted,
  categories,
  courseCategoryId,
  isLocked,
}: CurriculumContentBankProps) {
  const router = useRouter()
  const [modalState, setModalState] = useState<{
    type: "Section"
    sectionId?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<"lessons" | "quizzes">("lessons")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<
    number | null
  >(null)

  const [form] = Form.useForm()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [createdLessonName, setCreatedLessonName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [contentType, setContentType] = useState<
    "text_media" | "video" | "pdf"
  >("text_media")
  const [videoUrl, setVideoUrl] = useState("")
  const [pdfFile, setPdfFile] = useState<{ name: string; url: string } | null>(
    null
  )
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)

  // 🔥 NẾU ĐÃ PUBLIC: CHỈ HIỂN THỊ CHƯƠNG TRÌNH DƯỚI DẠNG READ-ONLY
  if (isLocked) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Chương Trình Khóa Học (Chỉ xem)
        </h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border rounded">
              <div className="p-3 bg-gray-100 border-b font-medium text-gray-700">
                {section.title}
              </div>
              <div className="p-3 space-y-2">
                {section.items.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chương trống</p>
                ) : (
                  section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-2 border rounded bg-white"
                    >
                      <div className="flex items-center gap-2">
                        {item.type === "lesson" ? (
                          <BookOpen size={14} className="text-gray-400" />
                        ) : (
                          <FileQuestion size={14} className="text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {item.type === "lesson"
                          ? `${item.duration_minutes || 0} min`
                          : `${item.question_count || 0} Qs`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 👇 PHẦN BÊN DƯỚI DÀNH CHO TRƯỜNG HỢP KHÔNG BỊ KHÓA (DRAFT / PENDING)

  const handleAddSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      order: sections.length,
      items: [],
    }
    onChange([...sections, newSection])
    setActiveSectionId(newSection.id)
  }
  const handleEditSection = (id: string) =>
    setModalState({ type: "Section", sectionId: id })
  const handleSaveSection = (title: string) => {
    if (modalState?.sectionId)
      onChange(
        sections.map((s) =>
          s.id === modalState.sectionId ? { ...s, title } : s
        )
      )
    setModalState(null)
  }
  const handleDeleteSection = (id: string | number) => {
    modal.confirm({
      title: "Xóa Chương",
      content: (
        <div className="text-gray-600">
          Bạn có chắc chắn muốn xóa chương này?
          <br />
          <b className="text-red-500">Tất cả bài học bên trong sẽ bị xóa.</b>
        </div>
      ),
      okText: "Xóa",
      okType: "danger",
      onOk: () => {
        onChange(sections.filter((s) => String(s.id) !== String(id)))
        if (String(activeSectionId) === String(id)) setActiveSectionId(null)
      },
    })
  }
  const handleAddItem = (
    sectionId: string,
    item: any,
    type: "lesson" | "quiz"
  ) => {
    // ✅ Logic check Duplicate
    const isDuplicate = sections.some((s) =>
      s.items.some((i) => i.resource_id === item.id && i.type === type)
    )
    if (isDuplicate) {
      message.warning("Nội dung này đã tồn tại trong chương trình khóa học!")
      return
    }

    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: `item-${Date.now()}`,
                  order: s.items.length,
                  resource_id: item.id,
                  type,
                  title: item.title,
                  duration_minutes:
                    type === "lesson" ? item.duration_minutes : undefined,
                  question_count:
                    type === "quiz" ? item.question_count : undefined,
                },
              ],
            }
          : s
      )
    )
  }
  const handleRemoveItem = (
    secId: string | number,
    itemId: string | number
  ) => {
    modal.confirm({
      title: "Xóa Mục",
      content: "Bạn có chắc chắn muốn xóa mục này?",
      okText: "Xóa",
      okType: "danger",
      centered: true,
      onOk: () => {
        onChange(
          sections.map((s) =>
            String(s.id) === String(secId)
              ? {
                  ...s,
                  items: s.items.filter((i) => String(i.id) !== String(itemId)),
                }
              : s
          )
        )
        message.success("Đã xóa mục")
      },
    })
  }

  const handleUploadPDF = async (file: File) => {
    const hide = message.loading("Đang tải PDF lên...", 0)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      )
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setPdfFile({ name: file.name, url: data.secure_url })
      form.setFieldsValue({ content: data.secure_url })
      message.success("Đã tải PDF lên thành công!")
    } catch (error) {
      message.error("Tải lên thất bại")
    } finally {
      hide()
    }
    return false
  }

  const getYoutubeEmbedId = (url: string) => {
    if (!url) return null
    const match = url.match(
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    )
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleEditItemAction = (item: any, type: "lesson" | "quiz") => {
    if (type === "quiz")
      return message.info("Chức năng sửa bài kiểm tra sắp ra mắt")
    const lesson = item as Lesson
    setEditingLessonId(Number(lesson.id))
    setIsCreateModalOpen(true)

    // ✅ ĐLCS CẬP NHẬT: Use lesson_content, lesson_type, video_url, file_path from curriculum item if available
    const lessonType =
      (lesson as any).lesson_type || lesson.type || "text_media"

    // Determine content based on type
    let existingContent = ""
    if (lessonType === "video") {
      existingContent = (lesson as any).video_url || ""
    } else if (lessonType === "pdf") {
      existingContent = (lesson as any).file_path || ""
    } else {
      existingContent = (lesson as any).lesson_content || lesson.content || ""
    }

    form.setFieldsValue({
      title: lesson.title,
      type: lessonType,
      content: existingContent,
      category_id: lesson.category_id ? String(lesson.category_id) : undefined,
    })

    setContentType(lessonType)
    if (lessonType === "video" && existingContent) setVideoUrl(existingContent)
    if (lessonType === "pdf" && existingContent)
      setPdfFile({ name: "Tệp hiện có", url: existingContent })
  }

  const handleDeleteItemAction = async (
    id: number,
    type: "lesson" | "quiz"
  ) => {
    if (type === "quiz") return
    try {
      await deleteLessonAPI(id)
      onLessonDeleted(id)
    } catch (error) {
      message.error("Không thể xóa bài học")
    }
  }

  const handleCreateSubmit = async (values: any) => {
    setIsCreating(true)
    try {
      if (editingLessonId) {
        const updated = await updateLessonAPI(editingLessonId, {
          title: values.title,
          type: values.type,
          content: values.content,
          category_id: values.category_id ? Number(values.category_id) : null,
        })
        onLessonUpdated(updated as unknown as Lesson)
        message.success("Đã cập nhật bài học!")
        setIsCreateModalOpen(false)
        setEditingLessonId(null)
      } else {
        const newLessonResponse = await createNewLessonAPI({
          title: values.title,
          type: values.type,
          content: values.content,
          category_id: values.category_id ? Number(values.category_id) : null,
        })
        if (onLessonCreated)
          onLessonCreated(newLessonResponse as unknown as Lesson)
        setIsCreateModalOpen(false)
        setCreatedLessonName(newLessonResponse.title)
        setIsSuccessModalOpen(true)
      }
      form.resetFields()
      setVideoUrl("")
      setPdfFile(null)
    } catch (error) {
      message.error(editingLessonId ? "Cập nhật thất bại" : "Tạo thất bại")
    } finally {
      setIsCreating(false)
    }
  }

  const filteredLessons = useMemo(() => {
    return availableLessons.filter((l) => {
      const matchSearch = l.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchCategory = selectedFilterCategory
        ? l.category_id != null &&
          Number(l.category_id) === Number(selectedFilterCategory)
        : true
      return matchSearch && matchCategory
    })
  }, [availableLessons, searchTerm, selectedFilterCategory])

  const filteredQuizzes = useMemo(
    () =>
      availableQuizzes.filter((q) =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [availableQuizzes, searchTerm]
  )

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md ${hasError ? "border-red-500" : "border-gray-200"}`}
    >
      <div className="bg-gray-50 p-4 rounded border flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold m-0">Nội Dung Có Sẵn</h3>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingLessonId(null)
              form.resetFields()
              form.setFieldsValue({
                category_id: courseCategoryId
                  ? String(courseCategoryId)
                  : undefined,
              })
              setVideoUrl("")
              setPdfFile(null)
              setContentType("text_media")
              setIsCreateModalOpen(true)
            }}
            className="bg-[#1677ff] hover:bg-blue-500 shadow-sm"
          >
            Bài Học Mới
          </Button>
        </div>
        {sections.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Chọn Chương Để Thêm Vào
            </label>
            <Select
              className="w-full"
              value={activeSectionId || undefined}
              onChange={setActiveSectionId}
              options={sections.map((s) => ({ value: s.id, label: s.title }))}
              placeholder="Chọn chương..."
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Select
            allowClear
            placeholder="Lọc danh mục..."
            className="w-full"
            value={selectedFilterCategory}
            onChange={setSelectedFilterCategory}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Input
            placeholder="Tìm tên bài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<Search size={14} className="text-gray-400" />}
          />
        </div>

        <div className="flex border-b mb-2 mt-2">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === "lessons" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("lessons")}
          >
            Bài Học
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === "quizzes" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("quizzes")}
          >
            Bài Kiểm Tra
          </button>
        </div>
        <div className="overflow-y-auto flex-1 max-h-[400px] pr-1">
          {activeTab === "lessons" &&
            filteredLessons.map((l) => (
              <ContentBankItem
                key={String(l.id)}
                icon={<BookOpen size={16} />}
                title={l.title}
                meta={`${l.duration_minutes || 0} min`}
                onEdit={() => handleEditItemAction(l, "lesson")}
                onDelete={() => handleDeleteItemAction(Number(l.id), "lesson")}
                onAdd={() =>
                  activeSectionId
                    ? handleAddItem(activeSectionId, l, "lesson")
                    : message.warning("Vui lòng chọn một chương trước")
                }
              />
            ))}
          {activeTab === "quizzes" &&
            filteredQuizzes.map((q) => (
              <ContentBankItem
                key={q.id}
                icon={<FileQuestion size={16} />}
                title={q.title}
                meta={`${q.question_count} Qs`}
                onEdit={() => handleEditItemAction(q, "quiz")}
                onDelete={() => handleDeleteItemAction(q.id, "quiz")}
                onAdd={() =>
                  activeSectionId
                    ? handleAddItem(activeSectionId, q, "quiz")
                    : message.warning("Vui lòng chọn một chương trước")
                }
              />
            ))}
          {activeTab === "lessons" && filteredLessons.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">
              Không có bài học nào khớp với bộ lọc.
            </p>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold mb-4">Chương Trình Khóa Học</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`bg-white border rounded transition-colors ${activeSectionId === section.id ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                onClick={() => setActiveSectionId(section.id)}
              >
                <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                  <span className="font-medium flex items-center gap-2">
                    <GripVertical size={16} className="text-gray-400" />{" "}
                    {section.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSection(section.id)
                      }}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSection(section.id)
                      }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-3 space-y-2 min-h-[50px]">
                  <SortableContext
                    id={section.id}
                    items={section.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {section.items.map((item) => (
                      <SortableItem key={item.id} id={item.id}>
                        {(listeners: any) => (
                          <div className="flex justify-between items-center p-2 border rounded bg-white hover:bg-gray-50">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div
                                {...listeners}
                                className="cursor-grab p-1 text-gray-400"
                              >
                                <GripVertical size={14} />
                              </div>
                              {item.type === "lesson" ? (
                                <BookOpen
                                  size={14}
                                  className="text-gray-500 flex-shrink-0"
                                />
                              ) : (
                                <FileQuestion
                                  size={14}
                                  className="text-gray-500 flex-shrink-0"
                                />
                              )}
                              <span className="text-sm truncate">
                                {item.title}
                              </span>
                            </div>
                            <X
                              size={14}
                              className="cursor-pointer text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveItem(section.id, item.id)
                              }}
                            />
                          </div>
                        )}
                      </SortableItem>
                    ))}
                  </SortableContext>
                  {section.items.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-2 italic">
                      Chương trống
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddSection}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus size={18} /> Thêm Chương
          </button>
        </div>
      </DndContext>

      {modalState?.type === "Section" && (
        <FormModal
          title="Sửa tên chương"
          label="Tiêu đề"
          initialValue={
            sections.find((s) => s.id === modalState.sectionId)?.title
          }
          onClose={() => setModalState(null)}
          onSave={handleSaveSection}
        />
      )}

      <Modal
        title={
          <span className="text-lg font-bold">
            {editingLessonId ? "Sửa Bài Học" : "Tạo Bài Học Mới"}
          </span>
        }
        open={isCreateModalOpen}
        forceRender
        onCancel={() => {
          setIsCreateModalOpen(false)
          form.resetFields()
          setVideoUrl("")
          setPdfFile(null)
          setContentType("text_media")
          setEditingLessonId(null)
        }}
        footer={null}
        width={750}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ type: "text_media" }}
          className="mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              className="md:col-span-2"
              name="title"
              label={
                <span className="font-semibold">
                  Tiêu đề bài học <span className="text-red-500">*</span>
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input placeholder="ví dụ: Giới thiệu chung" size="large" />
            </Form.Item>
          </div>
          <Form.Item
            name="category_id"
            label={<span className="font-semibold">Danh mục bài học</span>}
          >
            <Select
              placeholder="Chọn danh mục phân loại"
              size="large"
              allowClear
              showSearch
              options={categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={<span className="font-semibold">Loại Nội Dung</span>}
          >
            <Radio.Group
              onChange={(e) => {
                setContentType(e.target.value)
                form.setFieldValue("content", "")
                setVideoUrl("")
                setPdfFile(null)
              }}
              buttonStyle="solid"
              className="w-full flex"
              value={contentType}
            >
              <Radio.Button value="text_media" className="flex-1 text-center">
                Văn bản & Media
              </Radio.Button>
              <Radio.Button value="video" className="flex-1 text-center">
                Video Link
              </Radio.Button>
              <Radio.Button value="pdf" className="flex-1 text-center">
                Tải lên PDF
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {contentType === "text_media" && (
            <Form.Item
              name="content"
              label={<span className="font-semibold">Nội dung Bài Học</span>}
              rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
            >
              <RichTextEditor
                value={form.getFieldValue("content")}
                onChange={(val: any) => {
                  const content = typeof val === "string" ? val : ""
                  if (content !== form.getFieldValue("content"))
                    form.setFieldValue("content", content)
                }}
                placeholder="Bắt đầu nhập..."
              />
            </Form.Item>
          )}
          {contentType === "video" && (
            <div className="space-y-4">
              <Form.Item
                name="content"
                label={<span className="font-semibold">Nhập URL Video</span>}
                rules={[
                  { required: true, message: "Vui lòng nhập URL video" },
                  { type: "url", message: "Vui lòng nhập URL hợp lệ" },
                ]}
                help="Hỗ trợ: YouTube, Vimeo, Wistia."
              >
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) => setVideoUrl(e.target.value)}
                  prefix={<PlayCircleOutlined className="text-gray-400" />}
                />
              </Form.Item>
              <div className="bg-gray-100 rounded-lg p-4 text-center min-h-[200px] flex items-center justify-center border border-gray-200">
                {getYoutubeEmbedId(videoUrl) ? (
                  <div className="w-full aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeEmbedId(videoUrl)}`}
                      title="Video Preview"
                      frameBorder="0"
                      allowFullScreen
                      className="rounded shadow-sm"
                    ></iframe>
                  </div>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <PlayCircleOutlined
                      style={{ fontSize: "32px", marginBottom: "8px" }}
                    />
                    <span>Preview video sẽ hiển thị ở đây</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {contentType === "pdf" && (
            <div>
              <Form.Item
                name="content"
                label={<span className="font-semibold">Tệp PDF</span>}
                rules={[{ required: true, message: "Vui lòng tải lên PDF" }]}
                style={{ display: "none" }}
              >
                <Input />
              </Form.Item>
              <div className="mb-4">
                <Dragger
                  accept=".pdf"
                  showUploadList={false}
                  beforeUpload={handleUploadPDF}
                  height={160}
                  className="bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: "#3b82f6" }} />
                  </p>
                  <p className="ant-upload-text">
                    Kéo thả hoặc nhấp để tải PDF lên
                  </p>
                </Dragger>
              </div>
              {pdfFile && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FilePdfOutlined className="text-red-500 text-xl" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm m-0">
                        {pdfFile.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setPdfFile(null)
                      form.setFieldValue("content", "")
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button
              size="large"
              onClick={() => {
                setIsCreateModalOpen(false)
                form.resetFields()
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
              size="large"
              className="bg-[#1677ff] hover:bg-blue-700 font-semibold px-8 shadow-md"
            >
              {editingLessonId ? "Lưu Thay Đổi" : "Tạo Bài Học"}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={isSuccessModalOpen}
        onCancel={() => setIsSuccessModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div className="text-center py-4">
          <CheckCircleFilled className="text-green-500 text-5xl mb-4" />
          <h2 className="text-xl font-bold mb-2">Thành Công!</h2>
          <p className="text-gray-500 mb-6">
            Bài học <strong>"{createdLessonName}"</strong> đã được lưu.
          </p>
          <Button
            block
            type="primary"
            size="large"
            onClick={() => setIsSuccessModalOpen(false)}
          >
            Đóng
          </Button>
        </div>
      </Modal>
    </div>
  )
}
