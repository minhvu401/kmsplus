// @/app/(main)/courses/components/CompleteButton.tsx
"use client"

import { useState } from "react"
import { Button, message, Tooltip } from "antd"
import { CheckCircleOutlined, CheckCircleFilled } from "@ant-design/icons"
import { updateProgress } from "@/action/progress/progressAction"
import { useRouter } from "next/navigation"

interface CompleteButtonProps {
  courseId: number
  itemId: number
  itemType: "lesson" | "quiz"
  initialCompleted: boolean
}

export default function CompleteButton({
  courseId,
  itemId,
  itemType,
  initialCompleted,
}: CompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleComplete = async () => {
    // Nếu đã hoàn thành rồi thì không làm gì (hoặc có thể làm chức năng undo nếu muốn)
    if (isCompleted) return

    setLoading(true)
    try {
      const res = await updateProgress(courseId, itemId, itemType)

      if (res.success && "progress" in res) {
        setIsCompleted(true)
        message.success(`Great job! Course progress: ${res.progress}%`)
        router.refresh() // Refresh để cập nhật thanh tiến độ bên ngoài (nếu có)
      } else {
        message.error(res.error || "Failed to update progress")
      }
    } catch (error) {
      console.error(error)
      message.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // 1. Trạng thái ĐÃ HOÀN THÀNH
  if (isCompleted) {
    return (
      <Tooltip title="You have completed this lesson">
        <Button
          type="default"
          className="bg-green-50 text-green-600 border-green-200 hover:!text-green-700 hover:!border-green-300 font-medium px-6 h-10"
          icon={<CheckCircleFilled />}
        >
          Completed
        </Button>
      </Tooltip>
    )
  }

  // 2. Trạng thái CHƯA HOÀN THÀNH
  return (
    <Button
      type="primary"
      loading={loading}
      onClick={handleComplete}
      className="bg-blue-600 hover:!bg-blue-500 font-medium px-6 h-10 shadow-md"
      icon={<CheckCircleOutlined />}
    >
      Mark as Complete
    </Button>
  )
}