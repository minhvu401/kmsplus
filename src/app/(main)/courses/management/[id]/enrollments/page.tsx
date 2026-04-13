// @/src/app/(main)/courses/management/[id]/enrollments/page.tsx
// Course Enrollments Page (TRANG CHI TIẾT HIỆU SUẤT HỌC CỦA KHOÁ HỌC)

"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  message,
  Spin,
} from "antd"
import EnrollmentHeader from "@/components/ui/enrollments/enrollment-header"
import {
  getEnrollmentOverview,
  getCourseLearnerEnrollments,
} from "@/action/enrollment/enrollmentAction"
import {
  getCourseById,
  getCourseManagementAccess,
} from "@/action/courses/courseAction"
import { getActiveReviewsByCourse } from "@/action/reviews/reviewActions"
import { getAllDepartments } from "@/action/department/departmentActions"
import EnrollmentsSearchBar from "@/components/ui/enrollments/enrollments-search-bar"
import EnrollmentsFilterButton from "@/components/ui/enrollments/enrollments-filter-button"
import EnrollmentsSortButton from "@/components/ui/enrollments/enrollments-sort-button"
import EnrollmentsPageSizeSelector from "@/components/ui/enrollments/enrollments-page-size-selector"
import EnrollmentsPagination from "@/components/ui/enrollments/enrollments-pagination"
import LearnersList from "@/components/ui/enrollments/learners-list"
import type { LearnerEnrollment } from "@/components/ui/enrollments/enrollment-types"
import useLanguageStore from "@/store/useLanguageStore"

export default function CourseEnrollmentsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const handledFlashRef = React.useRef<string | null>(null)
  const { language } = useLanguageStore()
  const [messageApi, contextHolder] = message.useMessage()
  const courseId = params?.id as string
  const query = (searchParams.get("query") || "").trim().toLowerCase()
  const statusFilter = searchParams.get("status") || "any"
  const departmentFilter = searchParams.get("department") || "any"
  const sort = searchParams.get("sort") || "name-asc"
  const page = Number(searchParams.get("page") || "1")
  const limit = Number(searchParams.get("limit") || "10")
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
  const safePage = Number.isFinite(page) && page > 0 ? page : 1

  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [liveStats, setLiveStats] = useState<{
    courseName: string
    totalEnrolled: number
    avgCompletion: number
    courseRating: number
    reviewCount: number
  } | null>(null)
  const [isLoadingLearners, setIsLoadingLearners] = useState(true)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [learners, setLearners] = useState<LearnerEnrollment[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const flash = searchParams.get("flash")
    if (flash !== "user-not-found") return
    if (handledFlashRef.current === flash) return

    handledFlashRef.current = flash

    messageApi.error(
      language === "vi"
        ? "Không tìm thấy người dùng này. Có thể họ chưa ghi danh khóa học này."
        : "We couldn't find that user. They may have not enrolled in this course."
    )

    const params = new URLSearchParams(searchParams.toString())
    params.delete("flash")
    const nextQuery = params.toString()
    router.replace(nextQuery ? `?${nextQuery}` : "?", { scroll: false })
  }, [language, messageApi, router, searchParams])

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const departmentRows = await getAllDepartments()
        const names = departmentRows
          .map((department) => department.name)
          .filter((name): name is string => Boolean(name && name.trim()))

        setDepartments(Array.from(new Set(names)))
      } catch (error) {
        console.error("Failed to load departments:", error)
        setDepartments([])
      }
    }

    loadDepartments()
  }, [])

  useEffect(() => {
    const checkAccess = async () => {
      const numericCourseId = Number(courseId)

      if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
        router.replace("/courses/management?flash=course-not-found")
        return
      }

      try {
        setIsCheckingAccess(true)
        const access = await getCourseManagementAccess(numericCourseId)

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
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [courseId, router])

  useEffect(() => {
    const loadLiveStats = async () => {
      if (!hasAccess) {
        setIsLoadingStats(false)
        return
      }

      const numericCourseId = Number(courseId)
      if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
        router.replace("/courses/management?flash=course-not-found")
        setIsLoadingStats(false)
        return
      }

      try {
        setIsLoadingStats(true)

        const [overview, course, reviewResult] = await Promise.all([
          getEnrollmentOverview(numericCourseId),
          getCourseById(numericCourseId),
          getActiveReviewsByCourse({
            course_id: numericCourseId,
            page: 1,
            limit: 1,
          }).catch(() => null),
        ])

        if (!course) {
          router.replace("/courses/management?flash=course-not-found")
          return
        }

        const stats =
          overview && "stats" in overview && overview.success
            ? overview.stats
            : null

        const safeCourseEnrollmentCount =
          typeof course?.enrollment_count === "number" &&
          course.enrollment_count > 0
            ? course.enrollment_count
            : 0

        const resolvedTotalEnrolled =
          stats?.totalEnrollments ??
          safeCourseEnrollmentCount
        const enrolledSource =
          stats?.totalEnrollments != null
            ? "overview.stats.totalEnrollments"
            : safeCourseEnrollmentCount > 0
              ? "course.enrollment_count"
              : "default-0"

        console.info("[Enrollments] totalEnrolled resolved", {
          courseId,
          source: enrolledSource,
          value: resolvedTotalEnrolled,
        })

        setLiveStats({
          courseName: course?.title || stats?.name || `Course #${courseId}`,
          totalEnrolled: resolvedTotalEnrolled,
          avgCompletion: stats?.avgProgress ?? 0,
          courseRating: Number(course?.average_rating) || 0,
          reviewCount: reviewResult?.totalCount ?? 0,
        })
      } catch (error) {
        console.error("Failed to load live enrollment stats:", error)
        router.replace("/courses/management?flash=course-not-found")
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadLiveStats()
  }, [courseId, hasAccess, router])

  useEffect(() => {
    const loadLearners = async () => {
      if (!hasAccess) {
        setIsLoadingLearners(false)
        return
      }

      const numericCourseId = Number(courseId)
      if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
        setIsLoadingLearners(false)
        return
      }

      try {
        setIsLoadingLearners(true)
        const result = await getCourseLearnerEnrollments({
          courseId: numericCourseId,
          query,
          status: statusFilter,
          department: departmentFilter,
          sort,
          page: safePage,
          limit: safeLimit,
        })

        if (result.success) {
          setLearners(result.learners)
          setTotalItems(result.totalItems)
          return
        }

        setLearners([])
        setTotalItems(0)
      } catch (error) {
        console.error("Failed to load learner enrollments:", error)
        setLearners([])
        setTotalItems(0)
      } finally {
        setIsLoadingLearners(false)
      }
    }

    loadLearners()
  }, [
    courseId,
    query,
    statusFilter,
    departmentFilter,
    sort,
    hasAccess,
    safePage,
    safeLimit,
  ])

  const startIndex = (safePage - 1) * safeLimit

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 font-sans">
      {contextHolder}
      {isCheckingAccess || isLoadingStats ? (
        <div className="flex items-center justify-center min-h-[220px]">
          <Spin size="large" />
        </div>
      ) : (
        liveStats && (
          <EnrollmentHeader
            courseId={courseId}
            courseName={liveStats.courseName}
            totalEnrolled={liveStats.totalEnrolled}
            avgCompletion={liveStats.avgCompletion}
            courseRating={liveStats.courseRating}
            reviewCount={liveStats.reviewCount}
          />
        )
      )}

      {/* 4. Filter & Table Section */}
      <Card variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <EnrollmentsSearchBar />
          <div className="flex gap-3">
            <EnrollmentsFilterButton departments={departments} />
            <EnrollmentsSortButton />
          </div>
        </div>

        {/* Table */}
        {isLoadingLearners ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <LearnersList learners={learners} courseId={courseId} />
        )}

        <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 px-2 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            {language === "vi" ? "Hiển thị" : "Showing"} {totalItems > 0 ? startIndex + 1 : 0}-
            {Math.min(startIndex + learners.length, totalItems)} {language === "vi" ? "trên" : "of"} {totalItems} {language === "vi" ? "học viên" : "learners"}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <EnrollmentsPageSizeSelector currentPageSize={safeLimit} />
            <EnrollmentsPagination
              totalItems={totalItems}
              currentPage={safePage}
              pageSize={safeLimit}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
