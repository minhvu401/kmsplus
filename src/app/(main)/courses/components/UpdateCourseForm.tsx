// @/src/app/(main)/courses/components/UpdateCourseForm
"use client"
import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  updateCourseAPI,
  getCategoriesAPI,
} from "@/action/courses/courseAction"
import {
  createNewLessonAPI,
  updateLessonAPI,
  deleteLessonAPI,
} from "@/action/lesson/lessonActions"
import { COURSE_STATUS_LABELS } from "@/enum/course-status.enum"
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
} from "antd"
import {
  PlusOutlined as AntPlusOutlined,
  CheckCircleFilled,
  InboxOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from "@ant-design/icons"

const { TextArea } = Input
const { Dragger } = Upload
const CLOUDINARY_CLOUD_NAME = "dhclot8lh"
const CLOUDINARY_UPLOAD_PRESET = "kms-plus"

// --- TYPES ---
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
export type CoursePayload = {
  id?: number
  creator_id?: number
  category_id?: number | null
  title?: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  curriculum: Section[]
}

const steps = ["Basic Information", "Advance Information"]
type StepStatus = "pending" | "valid" | "invalid"

interface UpdateCourseFormProps {
  initialData: CoursePayload
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  onSuccess: () => void
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
    zIndex: isDragging ? 999 : "auto",
    position: "relative" as "relative",
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  )
}

// --- MAIN COMPONENT ---
export default function UpdateCourseForm({
  initialData,
  availableLessons: initialLessons = [],
  availableQuizzes: initialQuizzes = [],
  onSuccess,
}: UpdateCourseFormProps) {
  console.log("🔥 UpdateCourseForm - Initial data:", {
    courseId: initialData.id,
    title: initialData.title,
    curriculumLength: initialData.curriculum?.length || 0,
    curriculum: initialData.curriculum,
  })
  // 1. Quản lý danh sách Available Content (Lessons & Quizzes) từ Props
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [availableLessons, setAvailableLessons] =
    useState<Lesson[]>(initialLessons)
  const [availableQuizzes, setAvailableQuizzes] =
    useState<Quiz[]>(initialQuizzes)

  // Cập nhật state khi props thay đổi (khi server gửi dữ liệu mới)
  useEffect(() => {
    console.log("🔥 UpdateCourseForm - Props changed:", {
      initialLessons: initialLessons.length,
      initialQuizzes: initialQuizzes.length,
    })
    setAvailableLessons(initialLessons)
    setAvailableQuizzes(initialQuizzes)
  }, [initialLessons, initialQuizzes])
  // ✅ Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategoriesAPI()
      setCategories(data)
    }
    fetchCats()
  }, [])

  // Hàm thêm lesson mới vào danh sách ngay lập tức khi tạo xong
  const handleLessonCreated = (newLesson: Lesson) => {
    setAvailableLessons((prev) => [newLesson, ...prev])
  }

  // 1. Cập nhật state khi sửa xong 1 lesson
  const handleLessonUpdated = (updatedLesson: Lesson) => {
    setAvailableLessons((prev) =>
      prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    )
    // Cập nhật luôn cả trong Curriculum nếu bài đó đang được chọn
    setPayload((prev) => ({
      ...prev,
      curriculum: prev.curriculum.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.resource_id === updatedLesson.id
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

  // 2. Cập nhật state khi xóa 1 lesson
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

  // State Payload
  const [payload, setPayload] = useState<CoursePayload>(initialData)

  // Log khi payload thay đổi
  useEffect(() => {
    console.log("🔥 UpdateCourseForm - Payload changed:", {
      courseId: payload.id,
      curriculumLength: payload.curriculum?.length || 0,
      curriculum: payload.curriculum,
    })
  }, [payload.curriculum])

  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("valid")
  )
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData.thumbnail_url || null
  )
  const [cropModalVisible, setCropModalVisible] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // Sensors cho Kéo thả
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Effect: Tự động chọn Section đầu tiên
  useEffect(() => {
    if (payload.curriculum.length > 0 && !activeSectionId) {
      setActiveSectionId(payload.curriculum[0].id)
    }
  }, [payload.curriculum, activeSectionId])

  const handleUploadThumbnail = async (options: any) => {
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

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Upload thất bại")
      }

      const data = await res.json()
      const shortUrl = data.secure_url

      setImageUrl(shortUrl)
      update("thumbnail_url", shortUrl)

      if (onSuccess) onSuccess("Ok")
      message.success("Tải ảnh thành công!")
    } catch (error: any) {
      console.error("Upload error:", error)
      message.error(`Lỗi tải ảnh: ${error.message}`)
      if (onError) onError({ error })
    } finally {
      hide()
    }
  }

  // --- LOGIC KÉO THẢ ---
  const findSectionId = (itemId: string) => {
    if (payload.curriculum.find((s) => s.id === itemId)) return itemId
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
      message.error("Please complete all required fields.")
      return
    }

    if (!payload.id) {
      message.error("Course ID missing.")
      return
    }

    setLoading(true)
    try {
      const res = await updateCourseAPI(payload.id, {
        title: payload.title,
        description: payload.description,
        thumbnail_url: payload.thumbnail_url,
        status: payload.status,
        duration_hours: payload.duration_hours,
        category_id: payload.category_id,
        curriculum: payload.curriculum,
      })
      if (res.success) {
        message.success("Course updated successfully!")
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        message.error(res.error || "Update failed")
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
    <div className="bg-white p-2 rounded shadow">
      {contextHolder}
      <h1 className="text-2xl font-semibold text-gray-900">
        Update Course: {payload.title}
      </h1>
      <div className="text-sm text-gray-500">
        Step {current + 1} / {steps.length}
      </div>

      <div className="mb-6">
        <Steps
          current={current}
          onChange={changeStep}
          items={steps.map((s, i) => {
            const status = stepStatus[i]
            const isCurriculumStep = i === 1
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
                maxLength={255}
                status={
                  stepStatus[0] === "invalid" && !payload.title?.trim()
                    ? "error"
                    : ""
                }
                showCount
              />
            </div>
            {/* ✅ Ô CHỌN CATEGORY */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Category
              </label>
              <Select
                placeholder="Select a category"
                className="w-full"
                // ✅ 1. Ép giá trị hiện tại về String (nếu có) để so sánh
                value={
                  payload.category_id ? String(payload.category_id) : undefined
                }
                // ✅ 2. Khi chọn, ép ngược từ String về Number để lưu vào Payload đúng chuẩn
                onChange={(val) => update("category_id", Number(val))}
                // ✅ 3. Ép value trong danh sách options về String
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
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Thumbnail URL
              </label>
              <Input
                value={payload.thumbnail_url || ""}
                onChange={(e) => update("thumbnail_url", e.target.value)}
                maxLength={500}
                showCount
              />
              <div className="mt-2">
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={handleUploadThumbnail}
                >
                  <Button icon={<AntPlusOutlined />}>Upload Image</Button>
                </Upload>
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Thumbnail"
                    className="max-w-full h-32 object-cover border rounded"
                  />
                  <div className="mt-2">
                    <Button onClick={() => setCropModalVisible(true)}>
                      Crop Image
                    </Button>
                  </div>
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
                showCount
                maxLength={500}
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
                availableLessons={availableLessons} // Dùng state đã được khởi tạo
                availableQuizzes={availableQuizzes} // Dùng state đã được khởi tạo
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
                onLessonCreated={handleLessonCreated} // Truyền callback tạo lesson
                onLessonUpdated={handleLessonUpdated} // Truyền callback sửa lesson
                onLessonDeleted={handleLessonDeleted} // Truyền callback xóa lesson
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
        <div>
          {current > 0 && (
            <Button onClick={() => changeStep(current - 1)}>Back</Button>
          )}
        </div>
        <div>
          {current < steps.length - 1 ? (
            <Button type="primary" onClick={() => changeStep(current + 1)}>
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              style={{ backgroundColor: "#10b981" }}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Modal Crop */}
      <Modal
        title="Crop Image"
        open={cropModalVisible}
        onCancel={() => setCropModalVisible(false)}
        onOk={() => setCropModalVisible(false)}
        width={600}
      >
        <div className="text-center">
          {imageUrl && (
            <img src={imageUrl} alt="Crop Preview" className="max-w-full" />
          )}
          <p className="mt-2 text-gray-500">Crop functionality placehoder.</p>
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
      title: "Delete Section",
      content: (
        <div className="text-gray-600">
          Are you sure you want to delete this section?
          <br />
          <b className="text-red-500">All lessons inside will be removed.</b>
        </div>
      ),
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const newSections = sections.filter(
          (s: any) => String(s.id) !== String(sectionId)
        )
        onChange(newSections)
        if (String(activeSectionId) === String(sectionId))
          setActiveSectionId(null)
        message.success("Section removed")
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
      title: "Remove Item",
      content: "Are you sure you want to remove this item?",
      okText: "Remove",
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
        message.success("Item removed")
      },
    })
  }

  const handleUploadPDF = async (file: File) => {
    const hide = message.loading("Uploading PDF...", 0)
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
        throw new Error(errorData.error?.message || "Upload failed")
      }

      const data = await res.json()
      const fileUrl = data.secure_url || data.url

      setPdfFile({ name: file.name, url: fileUrl })
      form.setFieldsValue({ content: fileUrl })
      message.success("PDF uploaded successfully!")
    } catch (error: any) {
      console.error("PDF Upload error:", error)
      message.error(`Failed to upload: ${error.message}`)
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
    if (type === "quiz") return message.info("Quiz editing coming soon")

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
      message.error("Failed to delete lesson")
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
        message.success("Lesson updated!")
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
      message.error(editingLessonId ? "Failed to update" : "Failed to create")
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
              Select Section to Add To
            </label>
            <Select
              className="w-full"
              value={activeSectionId || undefined}
              onChange={(val) => setActiveSectionId(val)}
              options={sections.map((s) => ({ value: s.id, label: s.title }))}
              placeholder="Select a section..."
            />
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded border flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold m-0">Available Content</h3>
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
              New Lesson
            </Button>
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search..."
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
              Lessons
            </button>
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`px-4 py-2 text-sm font-medium ${activeTab === "quizzes" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Quizzes
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
                      message.warning("Please select a section above first")
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
                      message.warning("Please select a section above first")
                      return
                    }
                    handleAddItemToSection(activeSectionId, q, "quiz")
                  }}
                />
              ))}
            {activeTab === "lessons" && filteredLessons.length === 0 && (
              <p className="text-center text-gray-400 mt-4 text-sm">
                No lessons found.
              </p>
            )}
            {activeTab === "quizzes" && filteredQuizzes.length === 0 && (
              <p className="text-center text-gray-400 mt-4 text-sm">
                No quizzes found.
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
          <h3 className="text-lg font-semibold mb-4">Course Curriculum</h3>
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
                      Empty section
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
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600"
            >
              <Plus size={18} /> Add Section
            </button>
          </div>
        </div>
        {/* 👆 KẾT THÚC SỬA: Đã đóng thẻ div "block text-sm" đúng chỗ */}
      </DndContext>

      {/* Modal Rename Section */}
      {modalState?.type === "Section" && (
        <FormModal
          title={modalState.sectionId ? "Edit Section" : "New Section"}
          label="Section Title"
          placeholder="Enter section name..."
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
        title={editingLessonId ? "Edit Lesson" : "Create New Lesson"}
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

          <Form.Item
            name="type"
            label={<span className="font-semibold">Content Type</span>}
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
                  className="bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg hover:border-blue-50 transition-colors"
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
              {editingLessonId ? "Save Changes" : "Create Lesson"}
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
            Lesson {editingLessonId ? "Updated" : "Created"} Successfully
          </h2>
          <p className="text-gray-500 mb-6">
            The lesson <strong>"{createdLessonName}"</strong> has been created.
          </p>
          <Button block onClick={() => setIsSuccessModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}
