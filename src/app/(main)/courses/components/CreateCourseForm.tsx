// @/src/app/(main)/courses/components/CreateCourseForm.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createCourseAPI } from "@/action/courses/courseAction"
import { createNewLessonAPI } from "@/action/lesson/lessonActions"
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
} from "antd"
import {
  PlusOutlined,
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
export type CreateCoursePayload = {
  title?: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  curriculum: Section[]
}

const steps = ["Basic Information", "Advance Information"]
type StepStatus = "pending" | "valid" | "invalid"

interface CreateCourseFormProps {
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
  onSuccess: () => void
}

// --- SORTABLE ITEM COMPONENT ---
function SortableItem({ id, children }: { id: string; children: any }) {
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
export default function CreateCourseForm({
  availableLessons: initialLessons = [],
  availableQuizzes: initialQuizzes = [],
  onSuccess,
}: CreateCourseFormProps) {
  const [availableLessons, setAvailableLessons] =
    useState<Lesson[]>(initialLessons)
  const [availableQuizzes, setAvailableQuizzes] =
    useState<Quiz[]>(initialQuizzes)

  useEffect(() => {
    setAvailableLessons(initialLessons)
    setAvailableQuizzes(initialQuizzes)
  }, [initialLessons, initialQuizzes])

  const handleLessonCreated = (newLesson: Lesson) => {
    setAvailableLessons((prev) => [newLesson, ...prev])
  }

  const router = useRouter()
  const [modal, contextHolder] = Modal.useModal()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)

  const [payload, setPayload] = useState<CreateCoursePayload>({
    status: "pending_approval",
    duration_hours: 0,
    curriculum: [],
  })

  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("pending")
  )
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

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
      message.error("Please complete all required fields.")
      return
    }

    setLoading(true)
    try {
      const res = await createCourseAPI({
        title: payload.title || "Untitled Course",
        description: payload.description,
        thumbnail_url: payload.thumbnail_url,
        status: payload.status,
        duration_hours: payload.duration_hours,
        curriculum: payload.curriculum,
      })
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
    <div className="bg-white p-2">
      {contextHolder}
      <h1 className="text-2xl font-semibold text-gray-900">
        Create New Course
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
      <div>
        {current === 0 && (
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
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
                Thumbnail URL
              </label>
              <Input
                value={payload.thumbnail_url || ""}
                onChange={(e) => update("thumbnail_url", e.target.value)}
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
                <img
                  src={imageUrl}
                  alt="Thumbnail"
                  className="mt-2 h-32 object-cover border rounded"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
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
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={payload.status}
                  onChange={(v) => update("status", v)}
                  className="w-full"
                  options={Object.entries(COURSE_STATUS_LABELS)
                    .filter(([v]) => v !== "published")
                    .map(([v, l]) => ({ value: v, label: l }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  value={payload.duration_hours}
                  onChange={(e) =>
                    update("duration_hours", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <hr className="my-6" />
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
            />
          </section>
        )}
      </div>
      <div className="mt-6 flex justify-between">
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
              style={{ backgroundColor: "#1677ff" }}
            >
              Create Course
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- CURRICULUM CONTENT BANK (Nơi chứa Modal Create Lesson Mới) ---

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
}: CurriculumContentBankProps) {
  const router = useRouter()
  const [modalState, setModalState] = useState<{
    type: "Section"
    sectionId?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<"lessons" | "quizzes">("lessons")
  const [searchTerm, setSearchTerm] = useState("")

  // --- States cho Create Lesson Modal (Updated) ---
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
      title: "Delete Section",
      content: (
        <div className="text-gray-600">
          Are you sure you want to delete this section?
          <br />
          <b className="text-red-500">All items inside will be removed.</b>
        </div>
      ),
      okText: "Delete",
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
  }

  // --- Logic Helpers cho Create Lesson (Updated) ---
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
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setPdfFile({ name: file.name, url: data.secure_url })
      form.setFieldsValue({ content: data.secure_url })
      message.success("PDF uploaded!")
    } catch (error) {
      message.error("Failed to upload PDF")
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

  const handleCreateSubmit = async (values: any) => {
    setIsCreating(true)
    try {
      const res = await createNewLessonAPI({
        title: values.title,
        type: values.type,
        content: values.content,
      })
      onLessonCreated(res as unknown as Lesson)
      setIsCreateModalOpen(false)
      setCreatedLessonName(res.title)
      setIsSuccessModalOpen(true)
      form.resetFields()
      setVideoUrl("")
      setPdfFile(null)
    } catch {
      message.error("Failed to create lesson")
    } finally {
      setIsCreating(false)
    }
  }

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
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md ${hasError ? "border-red-500" : "border-gray-200"}`}
    >
      <div className="bg-gray-50 p-4 rounded border flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold m-0">Available Content</h3>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#1677ff] hover:bg-blue-500 shadow-sm"
          >
            New Lesson
          </Button>
        </div>
        {sections.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Target Section
            </label>
            <Select
              className="w-full"
              value={activeSectionId || undefined}
              onChange={setActiveSectionId}
              options={sections.map((s) => ({ value: s.id, label: s.title }))}
              placeholder="Select section..."
            />
          </div>
        )}
        <div className="relative mb-2">
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<Search size={14} className="text-gray-400" />}
          />
        </div>
        <div className="flex border-b mb-2">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === "lessons" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("lessons")}
          >
            Lessons
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === "quizzes" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("quizzes")}
          >
            Quizzes
          </button>
        </div>
        <div className="overflow-y-auto flex-1 max-h-[400px] pr-1">
          {activeTab === "lessons" &&
            filteredLessons.map((l) => (
              <ContentBankItem
                key={l.id}
                icon={<BookOpen size={16} />}
                title={l.title}
                meta={`${l.duration_minutes || 0} min`}
                onAdd={() =>
                  activeSectionId
                    ? handleAddItem(activeSectionId, l, "lesson")
                    : message.warning("Please select a section first")
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
                onAdd={() =>
                  activeSectionId
                    ? handleAddItem(activeSectionId, q, "quiz")
                    : message.warning("Please select a section first")
                }
              />
            ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold mb-4">Course Curriculum</h3>
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
                      Empty section
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
            <Plus size={18} /> Add Section
          </button>
        </div>
      </DndContext>

      {/* --- MODALS --- */}
      {modalState?.type === "Section" && (
        <FormModal
          title="Edit Section Name"
          label="Title"
          initialValue={
            sections.find((s) => s.id === modalState.sectionId)?.title
          }
          onClose={() => setModalState(null)}
          onSave={handleSaveSection}
        />
      )}

      {/* Modal Create Lesson (FULL FUNCTIONALITY) */}
      <Modal
        title={<span className="text-lg font-bold">Create New Lesson</span>}
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          form.resetFields()
          setVideoUrl("")
          setPdfFile(null)
          setContentType("text_media")
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
                      allowFullScreen
                      className="rounded shadow-sm"
                    ></iframe>
                  </div>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <PlayCircleOutlined
                      style={{ fontSize: "32px", marginBottom: "8px" }}
                    />
                    <span>Preview will appear here</span>
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
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Only .pdf files are allowed up to 10MB
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
                      <p className="text-xs text-blue-600 m-0 font-semibold">
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
              className="bg-[#1677ff] hover:bg-blue-700 font-semibold px-8 shadow-md"
            >
              Create Lesson
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Success */}
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
            The lesson <strong>"{createdLessonName}"</strong> has been created.
          </p>
          <Button
            block
            type="primary"
            size="large"
            onClick={() => setIsSuccessModalOpen(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ContentBankItem({ icon, title, meta, onAdd }: any) {
  return (
    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm hover:shadow-md transition-shadow mb-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-blue-600">{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium m-0 truncate">{title}</p>
          <p className="text-xs text-gray-500 m-0">{meta}</p>
        </div>
      </div>
      <button
        onClick={onAdd}
        className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
      >
        <PlusCircle size={18} />
      </button>
    </div>
  )
}

function FormModal({ title, label, initialValue, onClose, onSave }: any) {
  const [val, setVal] = useState(initialValue)
  return (
    <Modal title={title} open onCancel={onClose} onOk={() => onSave(val)}>
      <div className="py-4">
        <label className="block text-sm font-medium mb-1">{label}</label>
        <Input value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
      </div>
    </Modal>
  )
}
