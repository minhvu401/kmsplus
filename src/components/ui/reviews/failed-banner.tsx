"use client"

import React, { useState } from "react"
import { Modal, Button, message } from "antd"
import { ExclamationCircleFilled } from "@ant-design/icons"
import { resetCourseProgressAction } from "@/action/enrollment/enrollmentAction"
import { useRouter, usePathname } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"

interface FailedBannerProps {
  courseId: number
  onSuccessMessage?: (content: string) => void
  onErrorMessage?: (content: string) => void
}

export default function FailedBanner({
  courseId,
  onSuccessMessage,
  onErrorMessage,
}: FailedBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { language } = useLanguageStore()
  const pathname = usePathname()

  const L = {
    title: language === "vi" ? "Không còn lần làm" : "No attempts remaining",
    body: language === "vi" ? "Không còn lần làm. Muốn hoàn tất khóa học cần phải bắt đầu lại toàn bộ khóa học. Bắt đầu lại ngay?" : "No attempts remaining. Completion requires a full course reset. Reset now?",
    modalTitle: language === "vi" ? "Reset tiến độ khóa học" : "Reset Course Progress",
    modalBody: language === "vi" ? "Tất cả tiến độ và điểm trước đó sẽ bị xóa. Bạn có chắc muốn tiếp tục?" : "All progress and previous scores will be deleted. Are you sure you want to continue?",
    cancel: language === "vi" ? "Hủy" : "Cancel",
    resetBtn: language === "vi" ? "Reset khóa học" : "Reset Course",
    resetSuccess: language === "vi" ? "Đã đặt lại tiến độ khóa học." : "Course progress has been reset.",
    resetFailed: language === "vi" ? "Đặt lại thất bại." : "Failed to reset progress.",
  }

  const showConfirm = () => setIsModalOpen(true)
  const handleCancel = () => setIsModalOpen(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      const res = await resetCourseProgressAction(courseId)
      setLoading(false)
      setIsModalOpen(false)
      if (res.success) {
        // Navigate to the course learning root so the page will load the first item,
        // refresh data and then show the success message.
        try {
          // Mark success so the page can show a flash message after reload
          try {
            sessionStorage.setItem("kms_reset_success", "1")
          } catch {}

          router.replace(`/courses/${courseId}/learning`)
        } catch (e) {
          console.error("router.replace failed:", e)
        }
        // Force a full reload to ensure fresh server-rendered data
        try {
          window.location.reload()
        } catch (e) {
          console.error("window.location.reload failed:", e)
          // Fallback: show success message if reload not possible
          onSuccessMessage?.(L.resetSuccess)
        }
      } else {
        onErrorMessage?.(res.error || L.resetFailed)
      }
    } catch (error) {
      setLoading(false)
      setIsModalOpen(false)
      onErrorMessage?.("Something went wrong while resetting progress.")
    }
  }

  return (
    <>
      <div
        style={{
          padding: "16px",
          backgroundColor: "#fff1f0",
          color: "#820014",
          textAlign: "left",
          borderRadius: 8,
          margin: "12px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ color: "#820014", margin: 0, fontWeight: "bold" }}>
            {L.title}
          </h3>
          <p style={{ margin: "6px 0 0 0", color: "#5c0b0b" }}>{L.body}</p>
        </div>
        <Button danger onClick={showConfirm}>
          {L.resetBtn}
        </Button>
      </div>

      <Modal
        title={L.modalTitle}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        destroyOnClose
      >
        <div className="py-4">
          <div className="flex items-start gap-3">
            <ExclamationCircleFilled className="text-red-500 text-2xl" />
            <div>
              <p className="font-medium">{L.modalBody}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={handleCancel}>{L.cancel}</Button>
            <Button danger onClick={handleReset} loading={loading}>
              {L.resetBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
