// @/src/app/(main)/courses/components/EnrollButton.tsx
// Component button Enroll cho trang course detail

"use client"

import React, { useState } from "react"
import { Button, Modal, message } from "antd"
import { CheckCircleFilled, PlayCircleOutlined } from "@ant-design/icons"
import { enrollCourseAction } from "@/action/enrollment/enrollmentAction"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import { useRouter } from "next/navigation"

interface EnrollButtonProps {
  courseId: number
  courseTitle: string
  courseStatus?: string
}

export default function EnrollButton({
  courseId,
  courseTitle,
  courseStatus = "published",
}: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const router = useRouter()

  // Hide Enroll button if course is not published
  if (courseStatus !== "published") {
    return null
  }

  const handleEnroll = async () => {
    setLoading(true)
    const res = await enrollCourseAction(courseId)
    setLoading(false)

    if (res.success) {
      setIsSuccessModalOpen(true) // Hiện modal thành công
    } else {
      message.error(res.error)
    }
  }

  return (
    <>
      <Button
        type="primary"
        size="large"
        block
        loading={loading}
        onClick={handleEnroll}
        className="bg-blue-600 h-12 text-lg font-bold shadow-md"
      >
        {t("course.enroll_now", useLanguageStore().language)}
      </Button>

      {/* SUCCESS MODAL (Giống hình image_bbaf44.png) */}
      <Modal
        open={isSuccessModalOpen}
        footer={null}
        centered
        closable={false}
        width={400}
      >
        <div className="text-center py-6 space-y-4">
          <CheckCircleFilled className="text-green-500 text-6xl" />
          <div>
            <h2 className="text-2xl font-bold m-0">{t("course.enroll_success_header", useLanguageStore().language)}</h2>
            <p className="text-gray-500 mt-2 text-base">
              {t("course.enroll_success_prefix", useLanguageStore().language)} <br />
              <span className="text-gray-900 font-bold">"{courseTitle}"</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="primary"
              size="large"
              className="bg-blue-600 h-12 font-bold"
              onClick={() => {
                setIsSuccessModalOpen(false)
                router.push(`/courses/${courseId}/learning`)
              }}
            >
              {t("course.enroll_go_to_learning", useLanguageStore().language)}
            </Button>
            <Button
              type="text"
              className="text-gray-400"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              {t("course.enroll_later", useLanguageStore().language)}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
