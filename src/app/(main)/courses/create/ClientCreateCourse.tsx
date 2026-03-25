"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type CoursePayload = {
  title?: string
  slug?: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  language?: string
  level?: string
  price?: number | null
  tags?: string[]
  // curriculum will be sent as JSON string
  curriculum?: any
}

const steps = [
  "Basic Information",
  "Advance Information",
  "Curriculum",
  "Publish Course",
]

// ADDED: Define Step Status types
type StepStatus = "pending" | "valid" | "invalid"

export default function ClientCreateCourse() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<CoursePayload>({
    status: "draft",
    duration_hours: 0,
    tags: [],
    curriculum: [], // ADDED: Initialize curriculum as array
  })

  // ADDED: State to track validation status of each step
  const [stepStatus, setStepStatus] = useState<StepStatus[]>(
    new Array(steps.length).fill("pending")
  )

  function update<K extends keyof CoursePayload>(
    key: K,
    value: CoursePayload[K]
  ) {
    setPayload((p) => ({ ...p, [key]: value }))

    // ADDED: Khi người dùng gõ, đặt lại trạng thái "invalid" về "pending"
    // để họ có thể thử validate lại.
    if (stepStatus[current] === "invalid") {
      setStepStatus((prevStatus) => {
        const newStatus = [...prevStatus]
        newStatus[current] = "pending"
        return newStatus
      })
    }
  }

  // ADDED: Function to validate a specific step
  function validateStep(stepIndex: number): boolean {
    // TÙY CHỈNH LOGIC VALIDATION CỦA BẠN TẠI ĐÂY
    switch (stepIndex) {
      case 0: // Basic Information
        // Ví dụ: Bắt buộc phải có Title và Slug
        return !!payload.title?.trim() && !!payload.slug?.trim()
      case 1: // Advance Information
        // Ví dụ: Bắt buộc phải chọn Level
        return !!payload.level && payload.level !== ""
      case 2: // Curriculum
        // Ví dụ: Bắt buộc phải có ít nhất 1 bài học
        return (
          Array.isArray(payload.curriculum) && payload.curriculum.length > 0
        )
      case 3: // Publish Course
        // Ví dụ: Bắt buộc phải đặt giá (hoặc để là 0)
        // Nếu không có gì để validate ở bước 4, chỉ cần return true
        return payload.price !== undefined
      default:
        return false
    }
  }

  // CHANGED: Toàn bộ logic điều hướng được đưa vào hàm `changeStep`
  function changeStep(newIndex: number) {
    if (newIndex === current || newIndex < 0 || newIndex >= steps.length) {
      return // Bỏ qua nếu bấm vào bước hiện tại hoặc bước không tồn tại
    }

    // Luôn validate bước HIỆN TẠI (bước sắp rời đi)
    const isCurrentStepValid = validateStep(current)

    // Cập nhật trạng thái cho bước vừa rời đi
    setStepStatus((prevStatus) => {
      const newStatus = [...prevStatus]
      newStatus[current] = isCurrentStepValid ? "valid" : "invalid"
      return newStatus
    })

    // UNCONDITIONALLY (Luôn luôn) di chuyển đến bước mới
    setCurrent(newIndex)
  }

  // CHANGED: 'next' function now uses changeStep
  function next() {
    changeStep(current + 1)
  }

  // CHANGED: 'prev' function now uses changeStep
  function prev() {
    changeStep(current - 1)
  }

  // CHANGED: Đây là logic handleSubmit MỚI, làm đúng theo yêu cầu của bạn
  async function handleSubmit() {
    // 1. Tạo một mảng chứa kết quả validate của TẤT CẢ các bước
    const allStepsValidResults = steps.map((_, i) => validateStep(i))

    // 2. Kiểm tra xem có bước nào bị "invalid" (false) không
    const isAllValid = allStepsValidResults.every((isValid) => isValid)

    // 3. Cập nhật trạng thái cho TẤT CẢ các icon (bước nào lỗi sẽ bị đỏ)
    setStepStatus((prevStatus) => {
      return prevStatus.map((status, i) =>
        allStepsValidResults[i] ? "valid" : "invalid"
      )
    })

    // 4. Nếu có bất kỳ bước nào không hợp lệ
    if (!isAllValid) {
      // Tìm bước đầu tiên bị lỗi và nhảy về bước đó
      const firstInvalidStep = allStepsValidResults.findIndex((valid) => !valid)
      if (firstInvalidStep !== -1) {
        setCurrent(firstInvalidStep)
      }
      alert(
        "Vui lòng hoàn thành tất cả các trường bắt buộc ở mọi bước trước khi đăng."
      )
      return // Dừng lại, không cho submit
    }

    // 5. Nếu tất cả đều hợp lệ, tiến hành submit
    setLoading(true)
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Server error")
      const data = await res.json()
      // redirect to manage page or new course
      router.push("/courses/management")
    } catch (err) {
      console.error(err)
      alert("Failed to create course. See console for details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create a new course</h1>
        <div className="text-sm text-gray-500">
          Step {current + 1} / {steps.length}
        </div>
      </div>

      {/* Stepper bar styled like the reference image */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {steps.map((s, i) => {
            // CHANGED: Logic for step status
            const status = stepStatus[i]
            const active = i === current
            // REMOVED: 'isUnlocked' logic đã bị xóa

            const curriculumCount = Array.isArray(payload.curriculum)
              ? payload.curriculum.length
              : 0
            return (
              <div key={s} className="flex-1">
                <button
                  type="button"
                  // CHANGED: onClick bây giờ gọi changeStep(i)
                  onClick={() => changeStep(i)}
                  // REMOVED: 'disabled' prop đã bị xóa
                  className={
                    `w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      active
                        ? "bg-white text-sky-700" // Active
                        : "bg-transparent text-gray-600 hover:bg-gray-50" // Inactive
                    } `
                    // REMOVED: Style 'disabled' (opacity-50, cursor-not-allowed) đã bị xóa
                  }
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      // CHANGED: Cập nhật màu sắc dựa trên status
                      status === "valid"
                        ? "bg-green-100 text-green-600" // Xanh lá
                        : status === "invalid"
                          ? "bg-red-100 text-red-600" // Đỏ
                          : active
                            ? "bg-sky-600 text-white" // Xanh dương (active)
                            : "bg-gray-100 text-gray-500" // Xám (pending)
                    }`}
                  >
                    {/* CHANGED: Cập nhật icon */}
                    {status === "valid"
                      ? "✓"
                      : status === "invalid"
                        ? "✕"
                        : "○"}
                  </span>

                  <span className="flex-1 text-sm font-medium">{s}</span>

                  {/* {s === "Curriculum" && (
                    <span className="ml-2 text-xs text-sky-600 bg-sky-100 px-2 py-0.5 rounded">
                      {curriculumCount}/12
                    </span>
                  )} */}
                </button>

                {/* underline progress */}
                <div
                  className={`h-1 mt-2 rounded ${
                    // CHANGED: Cập nhật màu thanh underline
                    status === "valid"
                      ? "bg-green-400"
                      : status === "invalid"
                        ? "bg-red-400"
                        : active
                          ? "bg-sky-600"
                          : "bg-gray-200"
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div>
        {/* ... CÁC FORM NHẬP LIỆU (KHÔNG THAY ĐỔI) ... */}
        {current === 0 && (
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                value={payload.title || ""}
                onChange={(e) => update("title", e.target.value)}
                className={`mt-1 block w-full border px-3 py-2 rounded ${
                  // ADDED: Hiển thị viền đỏ nếu lỗi
                  stepStatus[0] === "invalid" && !payload.title?.trim()
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Slug</label>
              <input
                value={payload.slug || ""}
                onChange={(e) => update("slug", e.target.value)}
                className={`mt-1 block w-full border px-3 py-2 rounded ${
                  // ADDED: Hiển thị viền đỏ nếu lỗi
                  stepStatus[0] === "invalid" && !payload.slug?.trim()
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
            </div>
            {/* ... các input khác ... */}
            <div>
              <label className="block text-sm font-medium">Thumbnail URL</label>
              <input
                value={payload.thumbnail_url || ""}
                onChange={(e) => update("thumbnail_url", e.target.value)}
                className="mt-1 block w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Short Description
              </label>
              <textarea
                value={payload.description || ""}
                onChange={(e) => update("description", e.target.value)}
                className="mt-1 block w-full border px-3 py-2 rounded"
                rows={4}
              />
            </div>
          </section>
        )}

        {current === 1 && (
          <section className="space-y-4">
            {/* ... các input khác ... */}
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={payload.status}
                onChange={(e) => update("status", e.target.value)}
                className="mt-1 block w-full border px-3 py-2 rounded"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                Duration (hours)
              </label>
              <input
                type="number"
                value={String(payload.duration_hours ?? 0)}
                onChange={(e) =>
                  update("duration_hours", Number(e.target.value))
                }
                className="mt-1 block w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Level</label>
              <select
                value={payload.level || ""}
                onChange={(e) => update("level", e.target.value)}
                className={`mt-1 block w-full border px-3 py-2 rounded ${
                  // ADDED: Hiển thị viền đỏ nếu lỗi
                  stepStatus[1] === "invalid" && !payload.level
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </section>
        )}

        {current === 2 && (
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Curriculum</label>
              <small className="block text-xs text-gray-500">
                You can paste a JSON array of modules/lessons. For quick setup
                leave empty and edit later.
              </small>
              <textarea
                value={JSON.stringify(payload.curriculum || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value || "[]")
                    update("curriculum", parsed)
                  } catch (err) {
                    // if invalid JSON, still keep raw text in curriculum until submit
                    update("curriculum", [])
                  }
                }}
                className={`mt-1 block w-full border px-3 py-2 rounded monospace ${
                  // ADDED: Hiển thị viền đỏ nếu lỗi
                  stepStatus[2] === "invalid" &&
                  (!Array.isArray(payload.curriculum) ||
                    payload.curriculum.length === 0)
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                rows={8}
              />
            </div>
          </section>
        )}

        {current === 3 && (
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Price (leave empty for free)
              </label>
              <input
                type="number"
                value={payload.price ?? ""}
                onChange={(e) =>
                  update(
                    "price",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className={`mt-1 block w-full border px-3 py-2 rounded ${
                  // ADDED: Hiển thị viền đỏ nếu lỗi
                  stepStatus[3] === "invalid" && payload.price === undefined
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
            </div>
            {/* ... các input khác ... */}
            <div>
              <label className="block text-sm font-medium">SEO Title</label>
              <input
                className="mt-1 block w-full border px-3 py-2 rounded"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                SEO Description
              </label>
              <textarea
                className="mt-1 block w-full border px-3 py-2 rounded"
                rows={3}
                placeholder="Optional"
              />
            </div>
          </section>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {current > 0 && (
            <button
              type="button"
              onClick={prev}
              className="px-4 py-2 border rounded mr-2"
            >
              Back
            </button>
          )}
        </div>

        <div>
          {current < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="px-4 py-2 bg-sky-600 text-white rounded"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {loading ? "Saving..." : "Publish / Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
