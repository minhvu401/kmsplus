// @/app/(main)/courses/components/CompleteButton.tsx
"use client"

import { useState, useEffect } from "react"
import { Button, message, Tooltip } from "antd"
import { CheckCircleFilled, CheckOutlined } from "@ant-design/icons"
import { updateProgress } from "@/action/progress/progressAction"
import { useRouter } from "next/navigation"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

interface CompleteButtonProps {
  courseId: number
  itemId: number
  itemType: "lesson" | "quiz"
  initialCompleted: boolean
  onCompleted?: () => void
}

export default function CompleteButton({
  courseId,
  itemId,
  itemType,
  initialCompleted,
  onCompleted,
}: CompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { language } = useLanguageStore()

  const handleComplete = async () => {
    // Nếu đã hoàn thành rồi thì không làm gì (hoặc có thể làm chức năng undo nếu muốn)
    if (isCompleted) return

    setLoading(true)
    try {
      const res = await updateProgress(courseId, itemId, itemType)

      if (res.success && "progressPercentage" in res) {
        // 1. Cập nhật UI ngay lập tức để user thấy thay đổi
        setIsCompleted(true)
        const msg = t("learning.complete_success", language).replace(
          "{0}",
          String(res.progressPercentage)
        )
        message.success(msg)

        // 2. Gọi callback để LearningClient cập nhật state ngay lập tức
        if (onCompleted) {
          onCompleted()
        } else {
          // Nếu không có callback, refresh để đồng bộ data
          router.refresh()
        }
      } else {
        message.error(res.error || t("learning.update_failed", language))
      }
    } catch (error) {
      console.error(error)
      message.error(t("learning.something_wrong", language))
    } finally {
      setLoading(false)
    }
  }

  // Sync internal state when parent prop changes
  useEffect(() => {
    setIsCompleted(initialCompleted)
  }, [initialCompleted])

  // Style chung cho cả 2 trạng thái
  const commonClasses =
    "h-12 px-8 rounded-full font-semibold text-base shadow-sm transition-all transform hover:scale-105 min-w-[240px]"

  // 1. Trạng thái ĐÃ HOÀN THÀNH
  if (isCompleted) {
    return (
      <Button
        className={`${commonClasses} bg-green-50 text-green-600 border-green-200 hover:!bg-green-100 hover:!text-green-700 hover:!border-green-300`}
        icon={<CheckCircleFilled />}
        >
          {t("learning.completed_label", language)}
        </Button>
    )
  }

  // 2. Trạng thái CHƯA HOÀN THÀNH
  return (
    <Button
      type="primary"
      loading={loading}
      onClick={handleComplete}
      className={`${commonClasses} bg-blue-600 hover:!bg-blue-700 border-none`}
      icon={<CheckOutlined />}
    >
      {t("learning.mark_complete", language)}
    </Button>
  )
}
