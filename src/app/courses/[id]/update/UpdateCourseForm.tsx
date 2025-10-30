"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { updateCourse } from "@/action/courses/courseAction"
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
import { Input, Button, Steps, Modal, Tabs, Select, message } from "antd"
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PlusCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons"

const { TextArea } = Input

// --- TYPES ---
export type Lesson = { id: number; title: string; duration_minutes: number }
export type Quiz = { id: number; title: string; question_count: number }
export type CurriculumItem = {
  id: string
  order: number
  resource_id: number
  type: "lesson" | "quiz"
  title: string
  duration_minutes?: number
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
  title?: string
  slug?: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  curriculum: Section[]
}

const steps = ["Basic Information", "Advance Information"]
type StepStatus = "pending" | "valid" | "invalid"

// Mock data cho content bank
const MOCK_LESSONS: Lesson[] = [
  { id: 101, title: "Bài 1: Giới thiệu React", duration_minutes: 15 },
  { id: 102, title: "Bài 2: Components và Props", duration_minutes: 25 },
  { id: 103, title: "Bài 3: State và Lifecycle", duration_minutes: 30 },
]
const MOCK_QUIZZES: Quiz[] = [
  { id: 201, title: "Quiz 1: Kiến thức cơ bản", question_count: 5 },
  { id: 202, title: "Quiz 2: Kiểm tra State", question_count: 10 },
]

interface UpdateCourseFormProps {
  initialData: CoursePayload
}

export default function UpdateCourseForm({
  initialData,
}: UpdateCourseFormProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<CoursePayload>(initialData)
  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("valid")
  )

  function update<K extends keyof CoursePayload>(
    key: K,
    value: CoursePayload[K]
  ) {
    setPayload((p) => ({ ...p, [key]: value }))
    setStepStatus((prevStatus) => {
      const newStatus = [...prevStatus]
      newStatus[current] = "pending"
      return newStatus
    })
  }

  function validateStep(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return !!payload.title?.trim() && !!payload.slug?.trim()
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

    const isCurrentStepValid = validateStep(current)
    setStepStatus((prev) => {
      const newStatus = [...prev]
      newStatus[current] = isCurrentStepValid ? "valid" : "invalid"
      return newStatus
    })

    if (newIndex > current && !isCurrentStepValid) {
      console.warn(`Step ${current + 1} is not valid.`)
      return
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

    setStepStatus((prev) =>
      prev.map((_, i) => (allStepsValidResults[i] ? "valid" : "invalid"))
    )

    if (!isAllValid) {
      const firstInvalidStep = allStepsValidResults.findIndex((valid) => !valid)
      if (firstInvalidStep !== -1) setCurrent(firstInvalidStep)
      message.error("Please complete all required fields.")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("id", String(payload.id!))
      if (payload.title) formData.append("title", payload.title)
      if (payload.slug) formData.append("slug", payload.slug)
      if (payload.description)
        formData.append("description", payload.description)
      if (payload.thumbnail_url)
        formData.append("thumbnail_url", payload.thumbnail_url)
      if (payload.status) formData.append("status", payload.status)
      if (payload.duration_hours !== undefined) {
        formData.append("duration_hours", String(payload.duration_hours))
      }

      await updateCourse(formData)
      message.success("Course updated successfully!")
      // Redirect sẽ được xử lý bởi action
    } catch (err) {
      console.error("Failed to update course:", err)
      message.error("Failed to update course. Please try again.")
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Update Course: {payload.title || `#${payload.id}`}
        </h1>
        <div className="text-sm text-gray-500">
          Step {current + 1} / {steps.length}
        </div>
      </div>

      {/* Stepper bar */}
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
              <label className="block text-sm font-medium mb-1">Slug</label>
              <Input
                value={payload.slug || ""}
                onChange={(e) => update("slug", e.target.value)}
                maxLength={255}
                status={
                  stepStatus[0] === "invalid" && !payload.slug?.trim()
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
                maxLength={500}
                showCount
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Short Description
              </label>
              <TextArea
                value={payload.description || ""}
                onChange={(e) => update("description", e.target.value)}
                maxLength={500}
                rows={4}
                showCount
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
                  onChange={(value) => update("status", value)}
                  className="w-full"
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  value={String(payload.duration_hours ?? "")}
                  onChange={(e) =>
                    update(
                      "duration_hours",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
            <hr className="my-6 border-gray-200" />
            <div>
              <CurriculumContentBank
                availableLessons={MOCK_LESSONS}
                availableQuizzes={MOCK_QUIZZES}
                value={payload.curriculum}
                onChange={(newCurriculum) =>
                  update("curriculum", newCurriculum)
                }
                hasError={
                  stepStatus[1] === "invalid" &&
                  (payload.curriculum.length === 0 ||
                    payload.curriculum.some((s) => s.items.length === 0))
                }
              />
              {stepStatus[1] === "invalid" && (
                <p className="mt-2 text-sm text-red-600">
                  Curriculum must have at least one section, and each section
                  must have at least one item (lesson or quiz).
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Navigation buttons */}
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
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- CurriculumContentBank Component ---
interface CurriculumContentBankProps {
  value: Section[]
  onChange: (value: Section[]) => void
  hasError: boolean
  availableLessons: Lesson[]
  availableQuizzes: Quiz[]
}

function CurriculumContentBank({
  value: sections,
  onChange,
  hasError,
  availableLessons,
  availableQuizzes,
}: CurriculumContentBankProps) {
  const [modalState, setModalState] = useState<{
    type: "Section"
    sectionId?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<"lessons" | "quizzes">("lessons")
  const [searchTerm, setSearchTerm] = useState("")

  const handleAddSection = () => setModalState({ type: "Section" })
  const handleEditSection = (sectionId: string) =>
    setModalState({ type: "Section", sectionId })

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

  const handleDeleteSection = (sectionId: string) => {
    if (
      confirm("Are you sure you want to delete this section and all its items?")
    ) {
      onChange(sections.filter((s) => s.id !== sectionId))
    }
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
          id: crypto.randomUUID(),
          order: s.items.length + 1,
          resource_id: item.id,
          type: type,
          title: item.title,
          ...(type === "lesson" && {
            duration_minutes: (item as Lesson).duration_minutes,
          }),
          ...(type === "quiz" && {
            question_count: (item as Quiz).question_count,
          }),
        }
        return { ...s, items: [...s.items, newItem] }
      })
    )
  }

  const handleRemoveItem = (sectionId: string, itemId: string) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s
      )
    )
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
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md ${
        hasError ? "border-red-500" : "border-gray-200"
      }`}
    >
      {/* Left Column */}
      <div className="bg-gray-50 p-4 rounded border h-[600px] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Available Content</h3>
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
        <div className="flex border-b mb-2">
          <button
            onClick={() => setActiveTab("lessons")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "lessons"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Lessons ({filteredLessons.length})
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "quizzes"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Quizzes ({filteredQuizzes.length})
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {activeTab === "lessons" &&
            filteredLessons.map((lesson) => (
              <ContentBankItem
                key={lesson.id}
                icon={<BookOpen size={16} />}
                title={lesson.title}
                meta={`${lesson.duration_minutes} min`}
                onAdd={() => {
                  if (sections.length > 0)
                    handleAddItemToSection(
                      sections[sections.length - 1].id,
                      lesson,
                      "lesson"
                    )
                  else alert("Please add a section first.")
                }}
              />
            ))}
          {activeTab === "quizzes" &&
            filteredQuizzes.map((quiz) => (
              <ContentBankItem
                key={quiz.id}
                icon={<FileQuestion size={16} />}
                title={quiz.title}
                meta={`${quiz.question_count} questions`}
                onAdd={() => {
                  if (sections.length > 0)
                    handleAddItemToSection(
                      sections[sections.length - 1].id,
                      quiz,
                      "quiz"
                    )
                  else alert("Please add a section first.")
                }}
              />
            ))}
        </div>
      </div>

      {/* Right Column */}
      <div className="bg-white rounded h-[600px] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Course Curriculum</h3>
        <div className="flex-1 overflow-y-auto space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border rounded">
              <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <GripVertical
                    size={18}
                    className="text-gray-400 cursor-grab"
                  />
                  <span className="font-medium">{section.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEditSection(section.id)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical
                        size={16}
                        className="text-gray-400 cursor-grab"
                      />
                      {item.type === "lesson" ? (
                        <BookOpen size={16} className="text-gray-500" />
                      ) : (
                        <FileQuestion size={16} className="text-gray-500" />
                      )}
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {item.type === "lesson"
                          ? `${item.duration_minutes} min`
                          : `${item.question_count} Qs`}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(section.id, item.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {section.items.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-4 text-center">
                    (Use '+' button on left to add content)
                  </p>
                )}
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm text-gray-500 px-2 py-16 text-center">
              Click "Add Section" below to start.
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
    </div>
  )
}

function ContentBankItem({
  icon,
  title,
  meta,
  onAdd,
}: {
  icon: React.ReactNode
  title: string
  meta: string
  onAdd: () => void
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-blue-600">{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-gray-500">{meta}</p>
        </div>
      </div>
      <button onClick={onAdd} className="text-blue-500 hover:text-blue-700 p-1">
        <PlusCircle size={18} />
      </button>
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
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            <label htmlFor="modal-input" className="block text-sm font-medium">
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
              className="px-4 py-2 bg-white border rounded text-sm font-medium"
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
