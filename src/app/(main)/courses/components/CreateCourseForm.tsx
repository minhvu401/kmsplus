// @/src/app/(main)/courses/components/CreateCourseForm.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import dayjs from "dayjs" // Cần để xử lý DatePicker của AntD
import {
  getCategoriesAPI,
  createCourseAPI,
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

// --- TYPES CẬP NHẬT ---
export type Lesson = {
  id: number
  title: string
  duration_minutes: number | null
  type?: "text_media" | "video" | "pdf"
  content?: string
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
}
export type Section = {
  id: string
  title: string
  order: number
  items: CurriculumItem[]
}

// ✅ Type mới cho Assignment Rule
export type AssignmentRulePayload = {
  id: string | number // ID tạm để render list
  target_type: "all_employees" | "department" | "user" | "role"
  department_id?: number | null
  user_id?: number | null
  role_id?: number | null
  due_type: "relative" | "fixed" | "none"
  due_days?: number | null
  due_date?: any // dayjs object
}

// ✅ Cập nhật Create Payload
export type CreateCoursePayload = {
  title?: string
  description?: string
  thumbnail_url?: string
  category_id?: number | null
  status?: string
  duration_hours?: number
  visibility?: "public" | "private"
  global_due_type?: "relative" | "fixed" | "none"
  global_due_days?: number | null
  global_due_date?: any
  assignment_rules?: AssignmentRulePayload[]
  curriculum: Section[]
}

export type ContentType = "text_media" | "video" | "pdf"

export type ModalState = {
  type: "Section"
  sectionId?: string
} | null

export type UploadOptions = {
  file: File
  onSuccess?: (result: string) => void
  onError?: (error: any) => void
}

const steps = ["Thông Tin Cơ Bản", "Thông Tin Nâng Cao"]
type StepStatus = "pending" | "valid" | "invalid"

interface CreateCourseFormProps {
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  onSuccess: () => void
}

// --- SORTABLE ITEM COMPONENT ---
function SortableItem({
  id,
  children,
}: {
  id: string
  children: (
    listeners: ReturnType<typeof useSortable>["listeners"]
  ) => React.ReactNode
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

// --- HELPER COMPONENTS ---
function ContentBankItem({ icon, title, meta, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="group flex items-center justify-between p-2 bg-white border rounded shadow-sm hover:shadow-md transition-shadow mb-2">
      {/* Phần thông tin (Bên trái) */}
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <span className="text-blue-600 flex-shrink-0">{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium m-0 truncate" title={title}>
            {title}
          </p>
          <p className="text-xs text-gray-500 m-0">{meta}</p>
        </div>
      </div>

      {/* Phần Action Buttons (Bên phải - Hiện khi hover) */}
      <div className="flex items-center gap-1 pl-2">
        {/* Nút Edit */}
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

        {/* Nút Delete (Có xác nhận Popconfirm) */}
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

        {/* Nút Add (Luôn hiện) */}
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

// --- MAIN COMPONENT ---
export default function CreateCourseForm({
  availableLessons: initialLessons = [],
  availableQuizzes: initialQuizzes = [],
  onSuccess,
}: CreateCourseFormProps) {
  const [availableLessons, setAvailableLessons] =
    useState<Lesson[]>(initialLessons)
  const [availableQuizzes, setAvailableQuizzes] =
    useState<Quiz[]>(initialQuizzes)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([])
  const [users, setUsers] = useState<
    { id: number; name: string; email: string }[]
  >([])

  useEffect(() => {
    setAvailableLessons(initialLessons)
    setAvailableQuizzes(initialQuizzes)
  }, [initialLessons, initialQuizzes])

  // Fetch danh mục
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

  const handleLessonCreated = (newLesson: Lesson) => {
    setAvailableLessons((prev) => [newLesson, ...prev])
  }

  const handleLessonUpdated = (updatedLesson: Lesson) => {
    setAvailableLessons((prev) =>
      prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    )
  }

  const handleLessonDeleted = (deletedId: number) => {
    setAvailableLessons((prev) => prev.filter((l) => l.id !== deletedId))
    setPayload((prev) => ({
      ...prev,
      curriculum: prev.curriculum.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.resource_id !== deletedId),
      })),
    }))
    message.success("Lesson deleted successfully")
  }

  const router = useRouter()
  const [modal, contextHolder] = Modal.useModal()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  // ✅ KHỞI TẠO STATE MỚI
  const [payload, setPayload] = useState<CreateCoursePayload>({
    status: "pending_approval",
    duration_hours: 0,
    curriculum: [],
    category_id: null,
    visibility: "private",
    global_due_type: "none",
    global_due_days: 14,
    global_due_date: null,
    assignment_rules: [],
  })

  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("pending")
  )
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [cropModalVisible, setCropModalVisible] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (payload.curriculum.length > 0 && !activeSectionId) {
      setActiveSectionId(payload.curriculum[0].id)
    }
  }, [payload.curriculum, activeSectionId])

  const handleUploadThumbnail = async (options: any) => {
    const { file, onSuccess: onUploadSuccess, onError } = options
    const hide = message.loading("Uploading...", 0)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      )
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setImageUrl(data.secure_url)
      update("thumbnail_url", data.secure_url)
      if (onUploadSuccess) onUploadSuccess("Ok")
      message.success("Upload success!")
    } catch (error: any) {
      message.error("Upload failed")
      if (onError) onError({ error })
    } finally {
      hide()
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
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
        const newItems = arrayMove(section.items, oldIndex, newIndex)
        newCurriculum[activeSectionIndex] = { ...section, items: newItems }
      } else {
        const sourceSection = newCurriculum[activeSectionIndex]
        const destSection = newCurriculum[overSectionIndex]
        const sourceItems = [...sourceSection.items]
        const destItems = [...destSection.items]
        const activeItemIndex = sourceItems.findIndex((i) => i.id === activeId)
        const [movedItem] = sourceItems.splice(activeItemIndex, 1)
        const overItemIndex = destItems.findIndex((i) => i.id === overId)
        const insertIndex =
          overItemIndex >= 0 ? overItemIndex : destItems.length + 1
        destItems.splice(insertIndex, 0, movedItem)
        newCurriculum[activeSectionIndex] = {
          ...sourceSection,
          items: sourceItems,
        }
        newCurriculum[overSectionIndex] = { ...destSection, items: destItems }
      }
      return { ...prev, curriculum: newCurriculum }
    })
  }

  const findSectionId = (itemId: string) => {
    if (payload.curriculum.find((s) => s.id === itemId)) return itemId
    const section = payload.curriculum.find((s) =>
      s.items.some((i) => i.id === itemId)
    )
    return section?.id
  }

  function update<K extends keyof CreateCoursePayload>(
    key: K,
    value: CreateCoursePayload[K]
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
        return !!payload.title?.trim()
      case 1:
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
    if (newIndex > current && !isCurrentStepValid) return
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

    setLoading(true)
    try {
      // ✅ CHUẨN HÓA DỮ LIỆU TRƯỚC KHI GỬI XUỐNG API
      const finalPayload = {
        ...payload,
        title: payload.title || "Untitled Course",
        global_due_type:
          payload.global_due_type === "none" ? null : payload.global_due_type,
        global_due_days:
          payload.global_due_type === "relative"
            ? payload.global_due_days
            : null,
        global_due_date:
          payload.global_due_type === "fixed" && payload.global_due_date
            ? dayjs(payload.global_due_date).toISOString()
            : null,
        assignment_rules: payload.assignment_rules?.map((rule) => ({
          target_type: rule.target_type,
          department_id:
            rule.target_type === "department" ? rule.department_id : null,
          role_id: rule.target_type === "role" ? rule.role_id : null,
          user_id: rule.target_type === "user" ? rule.user_id : null,
          due_type: rule.due_type === "none" ? undefined : rule.due_type,
          due_days: rule.due_type === "relative" ? rule.due_days : undefined,
          due_date:
            rule.due_type === "fixed" && rule.due_date
              ? dayjs(rule.due_date).toISOString()
              : undefined,
        })),
      }

      const res = await createCourseAPI(finalPayload)

      if (res.success) {
        message.success("Course created successfully! 🎉")
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        message.error(res.error || "Create failed")
      }
    } catch (err) {
      message.error("System error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const totalItems = payload.curriculum.reduce(
    (acc, s) => acc + s.items.length,
    0
  )

  return (
    // ✅ ĐÃ SỬA: Dùng flex flex-col thay vì h-full chung chung
    <div className="bg-white flex flex-col h-[85vh] rounded-lg">
      {contextHolder}

      {/* ✅ ĐÃ SỬA: flex-1 để chiếm toàn bộ phần trên, overflow-y-auto tạo thanh cuộn bên trong */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tạo Khóa Học Mới
        </h1>
        <div className="text-sm text-gray-500 mb-6">
          Step {current + 1} / {steps.length}
        </div>

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
              {/* --- BASIC INFO BLOCK --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <Input
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
                      status={
                        stepStatus[0] === "invalid" && !payload.category_id
                          ? "error"
                          : ""
                      }
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
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors bg-gray-50">
                    {imageUrl ? (
                      <div className="relative group">
                        <img
                          src={imageUrl}
                          alt="Thumbnail"
                          className="w-full h-48 object-cover rounded-md border"
                        />
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
                      </div>
                    ) : (
                      <Upload
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
                  <Input
                    value={payload.thumbnail_url || ""}
                    onChange={(e) => {
                      update("thumbnail_url", e.target.value)
                      setImageUrl(e.target.value)
                    }}
                    placeholder="Hoặc dán URL ảnh vào đây"
                    className="mt-3"
                  />
                </div>
              </div>

              <Divider />

              {/* --- ✅ CẤU HÌNH ENROLLMENT & ASSIGNMENTS --- */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  Cấu Hình Hiển Thị & Quy Tắc Ghi Danh
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Cấu hình ai có thể xem khóa học này và thời hạn học tập của
                  họ.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* CỘT TRÁI: VISIBILITY & GLOBAL DUE DATE */}
                  <div className="space-y-6">
                    {/* Visibility */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block font-semibold text-gray-700 mb-2">
                        1. Hiển Thị Trong Thư Viện
                      </label>
                      <Radio.Group
                        value={payload.visibility}
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

                  {/* CỘT PHẢI: ASSIGNMENT RULES */}
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
                              {/* Target Row */}
                              <div className="flex gap-2 pr-6">
                                <Select
                                  value={rule.target_type}
                                  onChange={(val) => {
                                    const rules = [
                                      ...(payload.assignment_rules || []),
                                    ]
                                    rules[index] = {
                                      ...rule,
                                      target_type: val,
                                      department_id: null,
                                      role_id: null,
                                      user_id: null,
                                    }
                                    update("assignment_rules", rules)
                                  }}
                                  className="w-32"
                                  options={[
                                    {
                                      value: "all_employees",
                                      label: "Tất Cả NV",
                                    },
                                    {
                                      value: "department",
                                      label: "Phòng Ban",
                                    },
                                    { value: "role", label: "Vai Trò" },
                                    { value: "user", label: "Người Dùng" },
                                  ]}
                                />

                                <div className="flex-1">
                                  {rule.target_type === "department" && (
                                    <Select
                                      placeholder="Tìm kiếm và chọn phòng ban..."
                                      className="w-full"
                                      value={rule.department_id}
                                      onChange={(val) => {
                                        const rules = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        rules[index].department_id = val
                                        update("assignment_rules", rules)
                                      }}
                                      options={departments.map((dept) => ({
                                        value: dept.id,
                                        label: dept.name,
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
                                      placeholder="Chọn Vai Trò"
                                      className="w-full"
                                      value={rule.role_id}
                                      onChange={(val) => {
                                        const rules = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        rules[index].role_id = val
                                        update("assignment_rules", rules)
                                      }}
                                      options={[
                                        { value: 1, label: "Quản Lý" },
                                        { value: 2, label: "Nhân Viên" },
                                      ]}
                                    />
                                  )}
                                  {rule.target_type === "user" && (
                                    <Select
                                      placeholder="Tìm kiếm và chọn người dùng..."
                                      className="w-full"
                                      value={rule.user_id}
                                      onChange={(val) => {
                                        const rules = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        rules[index].user_id = val
                                        update("assignment_rules", rules)
                                      }}
                                      options={users.map((user) => ({
                                        value: user.id,
                                        label: `${user.name} (${user.email})`,
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

                              {/* Due Date Row */}
                              <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                                <span className="text-xs font-semibold text-gray-500 w-16">
                                  Hạn:
                                </span>
                                <Select
                                  size="small"
                                  value={rule.due_type}
                                  className="w-24"
                                  onChange={(val) => {
                                    const rules = [
                                      ...(payload.assignment_rules || []),
                                    ]
                                    rules[index].due_type = val
                                    update("assignment_rules", rules)
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
                                        const rules = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        rules[index].due_days = v
                                        update("assignment_rules", rules)
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
                                        const rules = [
                                          ...(payload.assignment_rules || []),
                                        ]
                                        rules[index].due_date = d
                                        update("assignment_rules", rules)
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
                                const rules = [
                                  ...(payload.assignment_rules || []),
                                ]
                                rules.splice(index, 1)
                                update("assignment_rules", rules)
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
                    value={payload.status}
                    onChange={(value) => update("status", value)}
                    className="w-full"
                    options={Object.entries(COURSE_STATUS_LABELS)
                      .filter(
                        ([value]) =>
                          value === "draft" || value === "pending_approval"
                      )
                      .map(([value, label]) => ({ value, label }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Thời Lượng (giờ)
                  </label>
                  <Input
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
                  onChange={(newCurriculum) =>
                    update("curriculum", newCurriculum)
                  }
                  hasError={
                    stepStatus[1] === "invalid" &&
                    (payload.curriculum.length === 0 ||
                      payload.curriculum.some((s) => s.items.length === 0))
                  }
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                  activeSectionId={activeSectionId}
                  setActiveSectionId={setActiveSectionId}
                  onOpenCreateModal={() => {}}
                  onLessonCreated={handleLessonCreated}
                  onLessonUpdated={handleLessonUpdated}
                  onLessonDeleted={handleLessonDeleted}
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

      {/* ✅ ĐÃ SỬA LỖI Ở ĐÂY: Thêm lớp shrink-0 để footer luôn ở dưới cùng và không bị đè */}
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
              className="bg-green-600 hover:!bg-green-500 font-bold px-8 shadow-md"
            >
              Xuất Bản Khóa Học
            </Button>
          )}
        </div>
      </div>

      {/* Modal Crop */}
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

// --- Component FormModal ---
function FormModal({
  title,
  label,
  placeholder,
  initialValue = "",
  onClose,
  onSave,
}: {
  title: string
  label: string
  placeholder: string
  initialValue?: string
  onClose: () => void
  onSave: (value: string) => void
}) {
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
            <label
              htmlFor="modal-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </label>
            <input
              id="modal-input"
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

// --- CURRICULUM CONTENT BANK ---
interface CurriculumContentBankProps {
  modal: any
  value: Section[]
  onChange: (value: Section[]) => void
  hasError: boolean
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  sensors: any
  onDragEnd: (event: DragEndEvent) => void
  activeSectionId: string | null
  setActiveSectionId: (id: string | null) => void
  onOpenCreateModal: () => void
  onLessonCreated: (lesson: Lesson) => void // Thêm prop này để nhận callback
  onLessonUpdated: (lesson: Lesson) => void // Thêm prop sửa lesson
  onLessonDeleted: (id: number) => void // Thêm prop xóa lesson
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
  onLessonCreated, // Nhận prop này
  onLessonUpdated, // Nhận prop sửa lesson
  onLessonDeleted, // Nhận prop xóa lesson
}: CurriculumContentBankProps) {
  const router = useRouter()
  const [modalState, setModalState] = useState<{
    type: "Section"
    sectionId?: string
  } | null>(null)

  const [activeTab, setActiveTab] = useState<"lessons" | "quizzes">("lessons")
  const [searchTerm, setSearchTerm] = useState("")

  // --- State cho Modal Create Lesson ---
  const [form] = Form.useForm()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [createdLessonName, setCreatedLessonName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null) // State theo dõi ID đang sửa

  const [contentType, setContentType] = useState<
    "text_media" | "video" | "pdf"
  >("text_media")
  const [videoUrl, setVideoUrl] = useState("")
  const [pdfFile, setPdfFile] = useState<{ name: string; url: string } | null>(
    null
  )

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

  const handleEditSection = (sectionId: string) =>
    setModalState({ type: "Section", sectionId })

  const handleSaveSection = (title: string) => {
    if (modalState?.sectionId) {
      onChange(
        sections.map((s) =>
          String(s.id) === String(modalState.sectionId) ? { ...s, title } : s
        )
      )
    }
    setModalState(null)
  }

  const handleDeleteSection = (sectionId: string | number) => {
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
        const newSections = sections.filter(
          (s: any) => String(s.id) !== String(sectionId)
        )
        onChange(newSections)
        if (String(activeSectionId) === String(sectionId))
          setActiveSectionId(null)
        message.success("Đã xóa chương")
      },
    })
  }
  const handleAddItemToSection = (
    sectionId: string,
    item: Lesson | Quiz,
    type: "lesson" | "quiz"
  ) => {
    onChange(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        const newItem: CurriculumItem = {
          id: `item-${Date.now()}`,
          order: s.items.length + 1,
          resource_id: item.id,
          type: type,
          title: item.title,
          duration_minutes:
            type === "lesson" ? (item as Lesson).duration_minutes : undefined,
          question_count:
            type === "quiz" ? (item as Quiz).question_count : undefined,
        }
        return { ...s, items: [...s.items, newItem] }
      })
    )
  }

  const handleRemoveItem = (
    sectionId: string | number,
    itemId: string | number
  ) => {
    modal.confirm({
      title: "Xóa Mục",
      content: "Bạn có chắc chắn muốn xóa mục này?",
      okText: "Xóa",
      okType: "danger",
      centered: true,
      onOk: () => {
        const updatedSections = sections.map((section) => {
          if (String(section.id) === String(sectionId)) {
            return {
              ...section,
              items: section.items.filter(
                (item) => String(item.id) !== String(itemId)
              ),
            }
          }
          return section
        })
        onChange(updatedSections)
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

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Tải lên thất bại")
      }

      const data = await res.json()
      const fileUrl = data.secure_url || data.url

      setPdfFile({ name: file.name, url: fileUrl })
      form.setFieldsValue({ content: fileUrl })
      message.success("Đã tải PDF lên thành công!")
    } catch (error: any) {
      console.error("PDF Upload error:", error)
      message.error(`Tải lên thất bại: ${error.message}`)
    } finally {
      hide()
    }
    return false
  }

  const getYoutubeEmbedId = (url: string) => {
    if (!url) return null
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // 👇 THÊM HÀM MỞ FORM EDIT:
  const handleEditItemAction = (item: any, type: "lesson" | "quiz") => {
    if (type === "quiz")
      return message.info("Chức năng sửa bài kiểm tra sắp ra mắt")

    const lesson = item as Lesson
    setEditingLessonId(lesson.id) // Lưu ID đang sửa
    setIsCreateModalOpen(true) // Mở Modal

    // Đổ dữ liệu cũ vào Form
    form.setFieldsValue({
      title: lesson.title,
      type: lesson.type || "text_media",
      content: lesson.content,
    })

    // Setup state phụ (Video/PDF)
    const cType = lesson.type || "text_media"
    setContentType(cType)
    if (cType === "video" && lesson.content) setVideoUrl(lesson.content)
    if (cType === "pdf" && lesson.content)
      setPdfFile({ name: "Existing File", url: lesson.content })
  }

  // 👇 THÊM HÀM XÓA:
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
        // --- TRƯỜG HỢP SỬA ---
        const updated = await updateLessonAPI(editingLessonId, {
          title: values.title,
          type: values.type,
          content: values.content,
        })
        onLessonUpdated(updated as unknown as Lesson)
        message.success("Đã cập nhật bài học!")
        setIsCreateModalOpen(false)
        setEditingLessonId(null)
      } else {
        // --- TRƯỜG HỢP TẠO MỚI ---
        const newLessonResponse = await createNewLessonAPI({
          title: values.title,
          type: values.type,
          content: values.content,
        })

        // ✅ Cập nhật danh sách lesson ngay lập tức
        if (onLessonCreated) {
          onLessonCreated(newLessonResponse as unknown as Lesson)
        }

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

  // ✅ Sử dụng useMemo để lọc danh sách
  const filteredLessons = useMemo(() => {
    return availableLessons.filter((l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableLessons, searchTerm])

  const filteredQuizzes = useMemo(() => {
    return availableQuizzes.filter((q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableQuizzes, searchTerm])

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md ${hasError ? "border-red-500" : "border-gray-200"}`}
    >
      {/* LEFT COLUMN: SOURCE */}
      <div className="block text-sm font-medium mb-1 text-gray-700">
        {sections.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn Chương Để Thêm Vào
            </label>
            <Select
              className="w-full"
              value={activeSectionId || undefined}
              onChange={(val) => setActiveSectionId(val)}
              options={sections.map((s) => ({ value: s.id, label: s.title }))}
              placeholder="Chọn một chương..."
            />
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded border flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold m-0">Nội Dung Có Sẵn</h3>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingLessonId(null) // Reset ID edit về null
                form.resetFields()
                setVideoUrl("")
                setPdfFile(null)
                setContentType("text_media")
                setIsCreateModalOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-500 shadow-sm"
              size="small"
            >
              Bài Học Mới
            </Button>
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border rounded-md text-sm"
            />
            <Search
              size={16}
              className="absolute left-2.5 top-2.5 text-gray-400"
            />
          </div>

          <div className="flex border-b mb-2">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`px-4 py-2 text-sm font-medium ${activeTab === "lessons" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Bài Học
            </button>
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`px-4 py-2 text-sm font-medium ${activeTab === "quizzes" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Bài Kiểm Tra
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {activeTab === "lessons" &&
              // ✅ Đã fix lỗi implicit any
              filteredLessons.map((l: Lesson) => (
                <ContentBankItem
                  key={`l-${l.id}`}
                  icon={<BookOpen size={16} />}
                  title={l.title}
                  meta={`${l.duration_minutes || 0} min`}
                  onEdit={() => handleEditItemAction(l, "lesson")}
                  onDelete={() => handleDeleteItemAction(l.id, "lesson")}
                  onAdd={() => {
                    if (!activeSectionId) {
                      message.warning("Vui lòng chọn một chương ở trên trước")
                      return
                    }
                    handleAddItemToSection(activeSectionId, l, "lesson")
                  }}
                />
              ))}
            {activeTab === "quizzes" &&
              // ✅ Đã fix lỗi implicit any
              filteredQuizzes.map((q: Quiz) => (
                <ContentBankItem
                  key={`q-${q.id}`}
                  icon={<FileQuestion size={16} />}
                  title={q.title}
                  meta={`${q.question_count} Qs`}
                  onAdd={() => {
                    if (!activeSectionId) {
                      message.warning("Vui lòng chọn một chương ở trên trước")
                      return
                    }
                    handleAddItemToSection(activeSectionId, q, "quiz")
                  }}
                />
              ))}
            {activeTab === "lessons" && filteredLessons.length === 0 && (
              <p className="text-center text-gray-400 mt-4 text-sm">
                Không tìm thấy bài học nào.
              </p>
            )}
            {activeTab === "quizzes" && filteredQuizzes.length === 0 && (
              <p className="text-center text-gray-400 mt-4 text-sm">
                Không tìm thấy bài kiểm tra nào.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TARGET */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        {/* 👇 BẮT ĐẦU SỬA: Đảm bảo cấu trúc div đóng mở đúng */}
        <div className="block text-sm font-medium mb-1 text-gray-700">
          <h3 className="text-lg font-semibold mb-4">Chương Trình Khóa Học</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[600px]">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`bg-white border rounded transition-colors ${activeSectionId === section.id ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                onClick={() => setActiveSectionId(section.id)}
              >
                <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <GripVertical size={18} className="text-gray-400" />
                    <span className="font-medium">{section.title}</span>
                  </div>
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
                        {(listeners) => (
                          <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 bg-white">
                            <div className="flex items-center gap-2">
                              <div
                                {...listeners}
                                className="cursor-grab p-1 text-gray-400"
                              >
                                <GripVertical size={16} />
                              </div>
                              {item.type === "lesson" ? (
                                <BookOpen size={16} className="text-gray-500" />
                              ) : (
                                <FileQuestion
                                  size={16}
                                  className="text-gray-500"
                                />
                              )}
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                {item.type === "lesson"
                                  ? `${item.duration_minutes || 0} min`
                                  : `${item.question_count || 0} Qs`}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveItem(section.id, item.id)
                                }}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        )}
                      </SortableItem>
                    ))}
                  </SortableContext>
                  {section.items.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2 italic">
                      Chương trống
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus size={18} /> Thêm Chương
            </button>
          </div>
        </div>
        {/* 👆 KẾT THÚC SỬA: Đã đóng thẻ div "block text-sm" đúng chỗ */}
      </DndContext>

      {/* Modal Rename Section */}
      {modalState?.type === "Section" && (
        <FormModal
          title={modalState.sectionId ? "Chỉnh Sửa Chương" : "Chương Mới"}
          label="Tiêu đề Chương"
          placeholder="Nhập tên chương..."
          initialValue={
            modalState.sectionId
              ? sections.find((s) => s.id === modalState.sectionId)?.title
              : ""
          }
          onClose={() => setModalState(null)}
          onSave={handleSaveSection}
        />
      )}

      {/* Modal Create Lesson */}
      <Modal
        title={editingLessonId ? "Chỉnh Sửa Bài Học" : "Tạo Bài Học Mới"}
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          form.resetFields()
          setVideoUrl("")
          setPdfFile(null)
          setContentType("text_media")
          setEditingLessonId(null) // Reset khi đóng
        }}
        footer={null}
        width={700}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ type: "text_media" }}
          className="mt-4"
        >
          {/* Form Content */}
          <Form.Item
            name="title"
            label={
              <span className="font-semibold">
                Tiêu đề Bài Học <span className="text-red-500">*</span>
              </span>
            }
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề bài học" },
            ]}
          >
            <Input
              placeholder="ví dụ: Giới thiệu về React Components"
              size="large"
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
                Liên kết Video
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
                onChange={(val) => form.setFieldValue("content", val)}
                placeholder="Bắt đầu nhập nội dung bài học của bạn ở đây..."
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
                      title="Xem trước Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded shadow-sm"
                    ></iframe>
                  </div>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <PlayCircleOutlined
                      style={{ fontSize: "32px", marginBottom: "8px" }}
                    />
                    <span>
                      Xem trước sẽ xuất hiện ở đây khi bạn dán một liên kết
                      YouTube hợp lệ
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {contentType === "pdf" && (
            <div>
              <Form.Item
                name="content"
                label={
                  <span className="font-semibold">Nội dung Bài Học (PDF)</span>
                }
                rules={[
                  { required: true, message: "Vui lòng tải lên tệp PDF" },
                ]}
                style={{ height: 0, margin: 0, padding: 0, opacity: 0 }}
              >
                <Input />
              </Form.Item>
              <div className="mb-4">
                <Dragger
                  accept=".pdf"
                  showUploadList={false}
                  beforeUpload={handleUploadPDF}
                  height={180}
                  className="bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg hover:border-blue-50 transition-colors"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: "#3b82f6" }} />
                  </p>
                  <p className="ant-upload-text">
                    Nhấp hoặc kéo tệp vào khu vực này để tải lên
                  </p>
                  <p className="ant-upload-hint">
                    Chỉ cho phép tệp .pdf lên đến 10MB
                  </p>
                </Dragger>
              </div>
              {pdfFile && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <FilePdfOutlined className="text-red-500 text-xl" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">
                        Đã Tải Lên Hoàn Tất
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
              className="bg-blue-600 hover:bg-blue-500"
            >
              {editingLessonId ? "Lưu Thay Đổi" : "Tạo Bài Học"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* --- MODAL SUCCESS --- */}
      <Modal
        open={isSuccessModalOpen}
        onCancel={() => setIsSuccessModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div className="text-center py-4">
          <CheckCircleFilled className="text-green-500 text-5xl mb-4" />
          <h2 className="text-xl font-bold mb-2">
            Bài Học {editingLessonId ? "Đã Cập Nhật" : "Đã Tạo"} Thành Công
          </h2>
          <p className="text-gray-500 mb-6">
            Bài học <strong>"{createdLessonName}"</strong> đã được tạo.
          </p>
          <Button block onClick={() => setIsSuccessModalOpen(false)}>
            Đóng
          </Button>
        </div>
      </Modal>
    </div>
  )
}
