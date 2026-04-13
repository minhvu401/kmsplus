"use client"

// @/src/app/(main)/courses/management/[id]/enrollments/[userId]/page.tsx

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Alert, Spin } from "antd"
import { getCourseLearnerEnrollmentDetail } from "@/action/enrollment/enrollmentAction"
import { getCourseManagementAccess } from "@/action/courses/courseAction"
import LearnerProgressDetail from "@/components/ui/enrollments/learner-progress-detail"
import type { LearnerEnrollmentDetail } from "@/components/ui/enrollments/enrollment-types"
import useLanguageStore from "@/store/useLanguageStore"

export default function LearnerProgressPage() {
  const params = useParams() as { id: string; userId: string }
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [detail, setDetail] = useState<LearnerEnrollmentDetail | null>(null)
  const { language } = useLanguageStore()

  useEffect(() => {
    const checkAccess = async () => {
      const courseId = Number(params.id)

      if (!Number.isFinite(courseId) || courseId <= 0) {
        router.replace("/courses/management?flash=course-not-found")
        return
      }

      try {
        const access = await getCourseManagementAccess(courseId)
        if (!access.allowed) {
          const target = access.redirectTo || "/courses/management"
          const flash = access.flash ? `?flash=${access.flash}` : ""
          router.replace(`${target}${flash}`)
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error("Failed to verify course access:", error)
        router.replace("/courses/management?flash=course-not-found")
      }
    }

    checkAccess()
  }, [params.id, router])

  useEffect(() => {
    const loadDetail = async () => {
      if (!hasAccess) return

      const courseId = Number(params.id)
      const userId = Number(params.userId)

      if (!Number.isFinite(courseId) || courseId <= 0) {
        router.replace("/courses/management?flash=course-not-found")
        return
      }

      if (!Number.isFinite(userId) || userId <= 0) {
        router.replace(
          `/courses/management/${courseId}/enrollments?flash=user-not-found`
        )
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage("")

        const result = await getCourseLearnerEnrollmentDetail({
          courseId,
          userId,
        })

        if (!result.success || !("detail" in result) || !result.detail) {
          router.replace(
            `/courses/management/${courseId}/enrollments?flash=user-not-found`
          )
          return
        }

        setDetail(result.detail)
      } catch (error) {
        console.error("Failed to load learner enrollment detail:", error)
        setDetail(null)
        setErrorMessage(
          language === "vi"
            ? "Không thể tải chi tiết học viên"
            : "Failed to load learner detail"
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [hasAccess, language, params.id, params.userId, router])

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert
          type="error"
          showIcon
          message={language === "vi" ? "Không thể tải học viên" : "Unable to load learner"}
          description={
            errorMessage ||
            (language === "vi"
              ? "Không tìm thấy chi tiết ghi danh cho học viên này."
              : "No enrollment detail found for this learner.")
          }
        />
      </div>
    )
  }

  return <LearnerProgressDetail courseId={params.id} detail={detail} />
}
