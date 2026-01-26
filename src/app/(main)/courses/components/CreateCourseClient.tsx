// app/courses/create/CreateCourseClient.tsx

"use client"
import { createCourseAPI } from "@/action/courses/courseAction"
import { useRouter } from "next/navigation"
import React, { useState, useMemo, useEffect } from "react"
// 👇 Import đúng type Lesson từ service
import type { Lesson } from "@/service/lesson.service"
import { COURSE_STATUS_LABELS } from "@/enum/course-status.enum"
import { createNewLessonAPI } from "@/action/lesson/lessonActions"
import RichTextEditor from "@/components/ui/RichTextEditor"
import ContentBankItem from "@/components/ui/ContentBankItem"
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
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// --- Icons ---
import {
  GripVertical,
  BookOpen,
  FileQuestion,
  Search,
  Edit2,
  Trash2,
  X,
  Plus,
  PlusCircle,
} from "lucide-react"
import {
  Input,
  Button,
  Steps,
  Modal,
  Tabs,
  Select,
  message,
  Upload,
  Form,
  Radio,
  Result,
} from "antd"
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PlusCircleOutlined,
  CloseOutlined,
  CheckCircleFilled,
  InboxOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons"

const { TextArea } = Input
const CLOUDINARY_CLOUD_NAME = "dhclot8lh"
// const CLOUDINARY_UPLOAD_PRESET = "kms-course"
const CLOUDINARY_UPLOAD_PRESET = "kms-plus"
const { Dragger } = Upload
// --- 1. ĐỊNH NGHĨA CÁC TYPES ---

export type Quiz = {
  id: number
  title: string
  description: string | null
  question_count: number
  time_limit_minutes: number | null
  passing_score: number | null
  max_attempts: number
}
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

type CoursePayload = {
  title?: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  language?: string
  price?: number | null
  tags?: string[]
  curriculum: Section[]
}

const steps = ["Basic Information", "Advance Information"]

type StepStatus = "pending" | "valid" | "invalid"

interface CreateCourseClientProps {
  initialLessons?: Lesson[]
  initialQuizzes?: Quiz[]
}

// --- SORTABLE ITEM COMPONENT ---
interface SortableItemProps {
  id: string
  children: (listeners: any) => React.ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
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
    position: "relative" as "relative",
    zIndex: isDragging ? 999 : "auto",
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  )
}

// --- 2. COMPONENT CHÍNH ---
export function CreateCourseClient({
  initialLessons = [],
  initialQuizzes = [],
}: CreateCourseClientProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  // 👇 1. KHAI BÁO PAYLOAD LÊN ĐẦU (Tránh lỗi used before declaration)
  const [payload, setPayload] = useState<CoursePayload>({
    status: "pending_approval",
    duration_hours: 0,
    tags: [],
    curriculum: [],
  })

  // State UI khác
  const [availableLessons, setAvailableLessons] =
    useState<Lesson[]>(initialLessons)
  const [availableQuizzes, setAvailableQuizzes] =
    useState<Quiz[]>(initialQuizzes)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // State steps
  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("pending")
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 👇 2. ĐẶT USE EFFECT Ở ĐÂY (Đúng vị trí)
  useEffect(() => {
    if (payload.curriculum.length > 0 && !activeSectionId) {
      setActiveSectionId(payload.curriculum[0].id)
    }
  }, [payload.curriculum, activeSectionId])

  // --- CÁC HÀM XỬ LÝ ---
  // Sửa lại hàm handleUploadThumbnail
  const handleUploadThumbnail = async (options: any) => {
    const { file, onSuccess, onError } = options
    const hide = message.loading("Đang tải ảnh lên...", 0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET) // Đảm bảo preset này là UNSIGNED

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Upload thất bại")
      }

      const data = await res.json()
      const shortUrl = data.secure_url

      // Cập nhật State
      setImageUrl(shortUrl)
      update("thumbnail_url", shortUrl)

      // Báo cho Antd là đã xong
      if (onSuccess) onSuccess("Ok")
      message.success("Tải ảnh thành công!")
    } catch (error: any) {
      console.error("Upload error:", error)
      message.error(`Lỗi tải ảnh: ${error.message}`)
      // Báo cho Antd là lỗi
      if (onError) onError({ error })
    } finally {
      hide()
    }
  }
  const findSectionId = (itemId: string) => {
    if (payload.curriculum.find((s) => s.id === itemId)) {
      return itemId
    }
    const section = payload.curriculum.find((s) =>
      s.items.some((i) => i.id === itemId)
    )
    return section?.id
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

        const newItems = arrayMove(section.items, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            order: index,
          })
        )
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

  const handleLessonCreated = (newLesson: Lesson) => {
    setAvailableLessons((prev) => [newLesson, ...prev])
  }

  // Các state loading không cần thiết
  const [isLoadingLessons] = useState(false)
  const [lessonsError] = useState<string | null>(null)
  const [isLoadingQuizzes] = useState(false)
  const [quizzesError] = useState<string | null>(null)

  function update<K extends keyof CoursePayload>(
    key: K,
    value: CoursePayload[K]
  ) {
    setPayload((p) => ({ ...p, [key]: value }))
    if (stepStatus[current] === "invalid") {
      setStepStatus((prevStatus) => {
        const newStatus = [...prevStatus]
        newStatus[current] = "pending"
        return newStatus
      })
    }
  }

  function validateStep(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return !!payload.title?.trim()
      case 1:
        const isValidCurriculum =
          payload.curriculum.length > 0 &&
          payload.curriculum.every((s) => s.items.length > 0)
        return isValidCurriculum
      default:
        return false
    }
  }

  function changeStep(newIndex: number) {
    if (newIndex === current || newIndex < 0 || newIndex >= steps.length) return

    if (newIndex > current) {
      const isCurrentStepValid = validateStep(current)
      setStepStatus((prevStatus) => {
        const newStatus = [...prevStatus]
        newStatus[current] = isCurrentStepValid ? "valid" : "invalid"
        return newStatus
      })
      if (!isCurrentStepValid) return
    }
    setCurrent(newIndex)
  }

  function next() {
    changeStep(current + 1)
  }
  function prev() {
    changeStep(current - 1)
  }

  async function handleSubmit() {
    const allStepsValidResults = steps.map((_, i) => validateStep(i))
    const isAllValid = allStepsValidResults.every((isValid) => isValid)

    setStepStatus((prevStatus) => {
      return prevStatus.map((status, i) =>
        allStepsValidResults[i] ? "valid" : "invalid"
      )
    })

    if (!isAllValid) {
      const firstInvalidStep = allStepsValidResults.findIndex((valid) => !valid)
      if (firstInvalidStep !== -1) setCurrent(firstInvalidStep)
      message.error("Vui lòng hoàn thành tất cả các trường bắt buộc.")
      return
    }

    setLoading(true)
    try {
      const apiPayload = {
        ...payload,
        title: payload.title || "",
      }
      const response = await createCourseAPI(apiPayload)

      if (response.success) {
        message.success("Lưu khóa học thành công! 🎉")
        setTimeout(() => {
          router.push("/courses")
        }, 1000)
      } else {
        message.error("Lưu thất bại: " + response.error)
      }
    } catch (err) {
      console.error(err)
      message.error("Đã có lỗi xảy ra khi kết nối server.")
    } finally {
      setLoading(false)
    }
  }

  const totalItems = payload.curriculum.reduce(
    (acc, section) => acc + section.items.length,
    0
  )

  return (
    <div className="bg-white p-6 rounded shadow">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create a new course
        </h1>
        <div className="text-sm text-gray-500">
          Step {current + 1} / {steps.length}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6">
        <Steps
          current={current}
          onChange={changeStep}
          items={steps.map((s, i) => {
            const status = stepStatus[i]
            const isCurriculumStep = s === "Advance Information" && i === 1
            return {
              title: s,
              status:
                status === "valid"
                  ? "finish"
                  : status === "invalid"
                    ? "error"
                    : "wait",
              description: isCurriculumStep ? `${totalItems} items` : undefined,
            }
          })}
        />
      </div>

      {/* Content */}
      <div>
        {current === 0 && (
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Title
              </label>
              <Input
                value={payload.title || ""}
                onChange={(e) => update("title", e.target.value)}
                status={
                  stepStatus[0] === "invalid" && !payload.title?.trim()
                    ? "error"
                    : ""
                }
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Thumbnail URL
              </label>
              <Input
                value={payload.thumbnail_url || ""}
                onChange={(e) => {
                  update("thumbnail_url", e.target.value)
                  setImageUrl(e.target.value)
                }}
                placeholder="Enter thumbnail URL"
              />
              <div className="mt-2">
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={handleUploadThumbnail}
                >
                  <Button icon={<PlusOutlined />}>Upload Image</Button>
                </Upload>
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Thumbnail Preview"
                    className="max-w-full h-32 object-cover border rounded"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Short Description
              </label>
              <TextArea
                value={payload.description || ""}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Enter course description"
              />
            </div>
          </section>
        )}

        {current === 1 && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Status
                </label>
                <Select
                  value={payload.status}
                  onChange={(value) => update("status", value)}
                  className="w-full"
                  /* Chỉ hiển thị 'draft' và 'pending_approval' */
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
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  value={String(payload.duration_hours ?? 0)}
                  onChange={(e) =>
                    update("duration_hours", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <hr className="my-6 border-gray-200" />
            <div>
              <CurriculumContentBank
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
                isLoadingLessons={isLoadingLessons}
                isLoadingQuizzes={isLoadingQuizzes}
                lessonsError={lessonsError}
                quizzesError={quizzesError}
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onLessonCreated={handleLessonCreated}
              />
              {stepStatus[1] === "invalid" && (
                <p className="mt-2 text-sm text-red-600">
                  Curriculum must have at least one section, and each section
                  must have at least one item.
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>{current > 0 && <Button onClick={prev}>Back</Button>}</div>
        <div>
          {current < steps.length - 1 ? (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              style={{ backgroundColor: "#10b981" }}
            >
              Save Course
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface CurriculumContentBankProps {
  value: Section[]
  onChange: (value: Section[]) => void
  hasError: boolean
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  isLoadingLessons?: boolean
  isLoadingQuizzes?: boolean
  lessonsError?: string | null
  quizzesError?: string | null
  sensors: any
  onDragEnd: (event: DragEndEvent) => void
  onLessonCreated: (lesson: Lesson) => void
}

function CurriculumContentBank({
  value: sections,
  onChange,
  hasError,
  availableLessons,
  availableQuizzes,
  isLoadingLessons = false,
  isLoadingQuizzes = false,
  lessonsError = null,
  quizzesError = null,
  sensors,
  onDragEnd,
  onLessonCreated,
}: CurriculumContentBankProps) {
  const [modal, contextHolder] = Modal.useModal()
  const [modalState, setModalState] = useState<{
    type: "Section"
    sectionId?: string
  } | null>(null)

  const [activeTab, setActiveTab] = useState<"lessons" | "quizzes">("lessons")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // State modal tạo bài học
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

  const handleAddSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      order: sections.length,
      items: [],
    }
    const newSections = [...sections, newSection]
    onChange(newSections)
    setActiveSectionId(newSection.id)
  }

  const handleEditSection = (sectionId: string) => {
    setModalState({ type: "Section", sectionId })
  }

  const handleSaveSection = (title: string) => {
    if (modalState?.sectionId) {
      onChange(
        sections.map((s) =>
          s.id === modalState.sectionId ? { ...s, title } : s
        )
      )
    } else {
      const newSection: Section = {
        id: crypto.randomUUID(),
        title: title || `Section ${sections.length + 1}: New Section`,
        order: sections.length + 1,
        items: [],
      }
      onChange([...sections, newSection])
    }
    setModalState(null)
  }

  const handleDeleteSection = (sectionId: string | number) => {
    modal.confirm({
      title: "Delete Section",
      content: (
        <div className="text-gray-600">
          Are you sure you want to delete this section?
          <br />
          <b className="text-red-500">
            All lessons inside will be removed from this course.
          </b>
        </div>
      ),
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: () => {
        // Lọc bỏ section
        const newSections = sections.filter(
          (s) => String(s.id) !== String(sectionId)
        )
        onChange(newSections)

        // Reset activeSectionId nếu xóa đúng cái đang chọn
        if (String(activeSectionId) === String(sectionId)) {
          setActiveSectionId(null)
        }

        message.success("Section removed")
      },
    })
  }

  const handleAddItemToSection = (
    sectionId: string,
    type: "lesson" | "quiz",
    id: number,
    title: string,
    duration_minutes?: number | null,
    question_count?: number
  ) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section

        const newItem: CurriculumItem = {
          id: `item-${Date.now()}`,
          order: section.items.length + 1,
          resource_id: id,
          type,
          title,
          ...(type === "lesson" && { duration_minutes }),
          ...(type === "quiz" && { question_count }),
        }
        return {
          ...section,
          items: [...section.items, newItem],
        }
      })
    )
  }

  // --- Thay thế toàn bộ hàm này ---
  const handleRemoveItem = (
    sectionId: string | number,
    itemId: string | number
  ) => {
    // Logic tìm item để hiển thị tên (Optional)
    const section = sections.find((s) => String(s.id) === String(sectionId))
    const item = section?.items.find((i) => String(i.id) === String(itemId))

    // 👇 Gọi trực tiếp, KHÔNG dùng if (modal.confirm(...))
    modal.confirm({
      title: "Remove Item",
      content: (
        <div>
          Are you sure you want to remove <b>"{item?.title || "this item"}"</b>?
        </div>
      ),
      okText: "Remove",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: () => {
        const newSections = sections.map((s) =>
          String(s.id) === String(sectionId)
            ? {
                ...s,
                items: s.items.filter((i) => String(i.id) !== String(itemId)),
              }
            : s
        )
        onChange(newSections)
        message.success("Item removed")
      },
    })
  }

  // --- HÀM UPLOAD PDF RIÊNG ---
  // Tìm và thay thế hàm handleUploadPDF cũ:

  const handleUploadPDF = async (file: File) => {
    const hide = message.loading("Uploading PDF...", 0)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

      // 👇 SỬA 1: Đổi 'raw' thành 'auto' để Cloudinary tự xử lý PDF tốt hơn
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      )

      if (!res.ok) {
        // 👇 Log lỗi chi tiết ra console để dễ debug
        const errorData = await res.json()
        console.error("Cloudinary Error:", errorData)
        throw new Error(errorData.error?.message || "Upload failed")
      }

      const data = await res.json()
      console.log("Upload Success:", data) // Kiểm tra xem có url trả về không

      const fileUrl = data.secure_url || data.url

      // 👇 Cập nhật State & Form
      setPdfFile({ name: file.name, url: fileUrl })
      form.setFieldsValue({ content: fileUrl }) // Quan trọng: Gán URL vào field content để submit

      message.success("PDF uploaded successfully!")
    } catch (error: any) {
      console.error("PDF Upload error:", error)
      message.error(`Failed to upload: ${error.message}`)
    } finally {
      hide()
    }
    return false // Chặn hành động upload mặc định của Antd
  }

  // --- HÀM HELPER PREVIEW VIDEO ---
  const getYoutubeEmbedId = (url: string) => {
    if (!url) return null
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleCreateSubmit = async (values: any) => {
    setIsCreating(true)
    try {
      const newLessonResponse = await createNewLessonAPI({
        title: values.title,
        type: values.type,
        content: values.content,
      })

      // 👇 Ép kiểu ở đây
      const compatibleLesson = newLessonResponse as unknown as Lesson
      onLessonCreated(compatibleLesson)

      setIsCreateModalOpen(false)
      setCreatedLessonName(newLessonResponse.title)
      setIsSuccessModalOpen(true)
      form.resetFields()
    } catch (error) {
      message.error("Failed to create lesson")
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  // --- Logic lọc ---
  const filteredLessons = useMemo(
    () =>
      availableLessons.filter((l) =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [availableLessons, searchTerm]
  )

  const filteredQuizzes = useMemo(
    () =>
      availableQuizzes.filter((q) =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [availableQuizzes, searchTerm]
  )

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md ${
        hasError ? "border-red-500" : "border-gray-200"
      }`}
    >
      {contextHolder}
      {/* CỘT TRÁI */}
      <div className="block text-sm font-medium mb-1 text-gray-700">
        {sections.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Section
            </label>
            <Select
              className="w-full mb-4"
              value={activeSectionId || undefined}
              onChange={(value) => setActiveSectionId(value)}
              options={sections.map((section) => ({
                value: section.id,
                label: section.title || `Section ${section.order + 1}`,
              }))}
            />
          </div>
        )}
        <div className="bg-gray-50 p-4 rounded border flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold m-0">Available Content</h3>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 shadow-sm"
              size="small"
            >
              New Lesson
            </Button>
          </div>
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border rounded-md text-sm"
            />
            <Search
              size={16}
              className="absolute left-2.5 top-2.5 text-gray-400"
            />
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "lessons"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Lessons ({availableLessons.length})
            </button>
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "quizzes"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Quizzes ({availableQuizzes.length})
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {activeTab === "quizzes" ? (
              isLoadingQuizzes ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading quizzes...
                  </p>
                </div>
              ) : quizzesError ? (
                <div className="text-center py-4 text-red-500 text-sm">
                  {quizzesError}
                </div>
              ) : availableQuizzes.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No quizzes available
                </div>
              ) : (
                availableQuizzes.map((quiz) => (
                  <ContentBankItem
                    key={`quiz-${quiz.id}`}
                    icon={<FileQuestion size={16} />}
                    title={quiz.title}
                    meta={`
          ${quiz.question_count} questions • 
          ${quiz.time_limit_minutes || "No"} min • 
          Pass: ${quiz.passing_score}%
        `}
                    onAdd={() => {
                      if (!activeSectionId) {
                        message.warning("Please select a section first")
                        return
                      }
                      handleAddItemToSection(
                        activeSectionId,
                        "quiz",
                        quiz.id,
                        quiz.title,
                        quiz.time_limit_minutes,
                        quiz.question_count
                      )
                    }}
                  />
                ))
              )
            ) : (
              filteredLessons.map((lesson) => (
                <ContentBankItem
                  key={lesson.id}
                  icon={<BookOpen size={16} />}
                  title={lesson.title}
                  meta={`${lesson.duration_minutes || 0} min`}
                  onAdd={() => {
                    if (!activeSectionId) {
                      message.warning("Please select a section first")
                      return
                    }
                    handleAddItemToSection(
                      activeSectionId,
                      "lesson",
                      lesson.id,
                      lesson.title,
                      lesson.duration_minutes
                    )
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        {/* CỘT PHẢI */}
        <div className="block text-sm font-medium mb-1 text-gray-700">
          <h3 className="text-lg font-semibold mb-4">Course Curriculum</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[600px]">
            {sections.map((section) => (
              <div key={section.id} className="bg-white border rounded">
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
                <div className="p-3 space-y-2">
                  <SortableContext
                    id={section.id} // Thêm ID cho Context (Good practice)
                    items={section.items.map((item) => item.id)} // Quan trọng: Phải map ra mảng ID
                    strategy={verticalListSortingStrategy}
                  >
                    {section.items.map((item) => (
                      <SortableItem key={item.id} id={item.id}>
                        {(dragListeners) => (
                          <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 bg-white group">
                            <div className="flex items-center gap-2">
                              {/* Chỉ gắn listener kéo thả vào icon này */}
                              <div
                                {...dragListeners}
                                className="cursor-grab hover:text-gray-700 text-gray-400 touch-none p-1"
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
                                  e.stopPropagation() // Ngăn chặn sự kiện lan ra ngoài
                                  handleRemoveItem(section.id, item.id)
                                }}
                                className="text-gray-400 hover:text-red-600 transition-colors"
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
                    <p className="text-sm text-gray-500 px-2 py-4 text-center">
                      (Kéo hoặc thả nội dung từ cột trái vào đây)
                    </p>
                  )}
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="text-sm text-gray-500 px-2 py-16 text-center">
                Click "Add Section" to start building your curriculum.
              </p>
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600"
            >
              <Plus size={18} />
              Add Section
            </button>
          </div>
        </div>
      </DndContext>

      {/* MODAL */}
      {modalState?.type === "Section" && (
        <FormModal
          title={modalState.sectionId ? "Edit Section Name" : "Add New Section"}
          label="Section"
          placeholder="Write your section name here..."
          initialValue={
            modalState.sectionId
              ? sections.find((s) => s.id === modalState.sectionId)?.title
              : ""
          }
          onClose={() => setModalState(null)}
          onSave={handleSaveSection}
        />
      )}
      {/* --- MODAL TẠO BÀI HỌC MỚI --- */}
      <Modal
        title="Create New Lesson"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          form.resetFields()
          setVideoUrl("")
          setPdfFile(null)
          setContentType("text_media")
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
          {/* 1. LESSON TITLE */}
          <Form.Item
            name="title"
            label={
              <span className="font-semibold">
                Lesson Title <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Please enter lesson title" }]}
          >
            <Input
              placeholder="e.g. Introduction to React Components"
              size="large"
            />
          </Form.Item>

          {/* 2. CONTENT TYPE SELECTION */}
          <Form.Item
            name="type"
            label={<span className="font-semibold">Content Type</span>}
          >
            <Radio.Group
              onChange={(e) => {
                // Logic cập nhật state hiển thị UI giữ nguyên
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
                Text & Media
              </Radio.Button>
              <Radio.Button value="video" className="flex-1 text-center">
                Video Link
              </Radio.Button>
              <Radio.Button value="pdf" className="flex-1 text-center">
                PDF Upload
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* 3. DYNAMIC CONTENT INPUT */}

          {/* --- CASE A: TEXT & MEDIA --- */}
          {contentType === "text_media" && (
            <Form.Item
              name="content"
              label={<span className="font-semibold">Lesson Content</span>}
              rules={[{ required: true, message: "Please enter content" }]}
            >
              <RichTextEditor
                value={form.getFieldValue("content")}
                onChange={(val) => form.setFieldValue("content", val)}
                placeholder="Start typing your lesson content here..."
              />
            </Form.Item>
          )}

          {/* --- CASE B: VIDEO LINK --- */}
          {contentType === "video" && (
            <div className="space-y-4">
              <Form.Item
                name="content"
                label={<span className="font-semibold">Input Video URL</span>}
                rules={[
                  { required: true, message: "Please enter video URL" },
                  { type: "url", message: "Please enter a valid URL" },
                ]}
                help="Supported: YouTube, Vimeo, Wistia."
              >
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) => setVideoUrl(e.target.value)}
                  prefix={<PlayCircleOutlined className="text-gray-400" />}
                />
              </Form.Item>

              {/* Auto Preview */}
              <div className="bg-gray-100 rounded-lg p-4 text-center min-h-[200px] flex items-center justify-center border border-gray-200">
                {getYoutubeEmbedId(videoUrl) ? (
                  <div className="w-full aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeEmbedId(videoUrl)}`}
                      title="Video Preview"
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
                      Preview will appear here when you paste a valid YouTube
                      link
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- CASE C: PDF UPLOAD --- */}
          {contentType === "pdf" && (
            <div>
              <Form.Item
                name="content"
                label={
                  <span className="font-semibold">Lesson Content (PDF)</span>
                }
                rules={[
                  { required: true, message: "Please upload a PDF file" },
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
                  className="bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: "#3b82f6" }} />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Only .pdf files are allowed up to 10MB
                  </p>
                </Dragger>
              </div>

              {/* File Display Preview */}
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
                        Upload Complete
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

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button
              size="large"
              onClick={() => {
                setIsCreateModalOpen(false)
                form.resetFields()
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating}
              size="large"
              className="bg-blue-600 hover:bg-blue-500"
            >
              Create Lesson
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
            Lesson Created Successfully
          </h2>
          <p className="text-gray-500 mb-6">
            The lesson <strong>"{createdLessonName}"</strong> has been
            successfully created and added to the course content library.
          </p>
          <div className="flex flex-col gap-3">
            <Button type="primary" block className="bg-blue-600">
              View Lesson
            </Button>
            <Button block onClick={() => setIsSuccessModalOpen(false)}>
              Return to Course
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// --- Component FormModal (Không thay đổi) ---
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
