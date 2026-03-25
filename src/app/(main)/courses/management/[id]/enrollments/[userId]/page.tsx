"use client"

// @/src/app/(main)/courses/management/[id]/enrollments/[userId]/page.tsx

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Alert, Spin } from "antd"
import { getCourseLearnerEnrollmentDetail } from "@/action/enrollment/enrollmentAction"
import LearnerProgressDetail from "@/components/ui/enrollments/learner-progress-detail"
import type { LearnerEnrollmentDetail } from "@/components/ui/enrollments/enrollment-types"

export default function LearnerProgressPage() {
  const params = useParams() as { id: string; userId: string }
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [detail, setDetail] = useState<LearnerEnrollmentDetail | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      const courseId = Number(params.id)
      const userId = Number(params.userId)

      if (!Number.isFinite(courseId) || !Number.isFinite(userId)) {
        setErrorMessage("Invalid course or user id")
        setIsLoading(false)
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
          setDetail(null)
          setErrorMessage(result.error || "Learner enrollment was not found")
          return
        }

        setDetail(result.detail)
      } catch (error) {
        console.error("Failed to load learner enrollment detail:", error)
        setDetail(null)
        setErrorMessage("Failed to load learner detail")
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [params.id, params.userId])

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
          message="Unable to load learner"
          description={errorMessage || "No enrollment detail found for this learner."}
        />
      </div>
    )
  }

  return <LearnerProgressDetail courseId={params.id} detail={detail} />
}
