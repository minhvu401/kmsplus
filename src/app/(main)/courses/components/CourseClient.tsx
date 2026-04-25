// @/src/app/(main)/courses/components/CourseClient.tsx
"use client"

import type { Course } from "@/service/course.service"
import React, { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { message } from "antd"
import useLanguageStore, { type Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import { CourseSearchHero } from "@/components/ui/courses/course-search-hero"
import { CourseSection } from "@/components/ui/courses/course-section"
import { TrendingCourses } from "@/components/ui/courses/trending-courses"
import { CategoryPopularSection } from "@/components/ui/courses/category-popular-section"
import { RelevantCoursesSection } from "@/components/ui/courses/relevant-courses-section"
import { CTAPromo } from "@/components/ui/courses/cta-promo"
import { FadeInOnScroll } from "@/components/ui/courses/fade-in-on-scroll"
import {
  CourseCompactFilters,
  type FilterValues,
} from "@/components/ui/courses/course-compact-filters"

interface SearchParams {
  query?: string
  page?: string
  sort?: "trending" | "popular" | "newest" | "top-rated"
  category?: string
  rating?: string
}

interface CourseClientProps {
  initialCourses: Course[]
  initialTotalCount: number
  coursesPerPage: number
  fetchError: string | null
  categories: Array<{ id: number; name: string }>
  currentSearchParams?: SearchParams
}

export default function CourseClient({
  initialCourses,
  initialTotalCount,
  coursesPerPage,
  fetchError,
  categories,
  currentSearchParams = {},
}: CourseClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [messageApi, contextHolder] = message.useMessage()
  const { language: rawLanguage } = useLanguageStore()
  const language = rawLanguage as Language
  const handledFlashRef = React.useRef<string | null>(null)

  // State for each course section
  const [resumeCourses, setResumeCourses] = useState<Course[]>([])
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([])
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([])
  const [popularByCategory, setPopularByCategory] = useState<Course[]>([])
  const [relevantCourses, setRelevantCourses] = useState<Course[]>([])
  const [newCourses, setNewCourses] = useState<Course[]>([])
  const [relevantDepartmentName, setRelevantDepartmentName] = useState<string>(
    t("course.relevant_department", language)
  )

  // Loading states for each section
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [loadingPopular, setLoadingPopular] = useState(false)
  const [loadingRelevant, setLoadingRelevant] = useState(false)
  const [loadingNew, setLoadingNew] = useState(false)

  // OPTIMIZED: Cache fetched data to prevent unnecessary re-fetches on page changes
  const fetchedSections = React.useRef(new Set<string>())

  // Fetch different course sections on mount
  useEffect(() => {
    // OPTIMIZED: Use AbortController to cleanup pending requests
    const abortController = new AbortController()
    const signal = abortController.signal

    // ========================================
    // OPTIMIZED: Batch fetch multiple endpoints
    // ========================================
    const fetchAllCourseSections = async () => {
      setLoadingTrending(true)
      setLoadingPopular(true)
      setLoadingRelevant(true)
      setLoadingNew(true)

      try {
        const isAbortError = (reason: unknown) => {
          if (!reason) return false
          if (reason instanceof Error && reason.name === "AbortError") {
            return true
          }
          if (
            typeof reason === "object" &&
            reason !== null &&
            "name" in reason &&
            (reason as { name?: string }).name === "AbortError"
          ) {
            return true
          }
          const reasonText = String(reason).toLowerCase()
          return (
            reasonText.includes("aborterror") ||
            reasonText.includes("signal is aborted")
          )
        }

        const fetchSectionCourses = async (url: string) => {
          const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            cache: "no-store",
            signal,
          })

          if (!res.ok) {
            throw new Error(`Failed to fetch ${url}: ${res.status}`)
          }

          return res.json()
        }

        const [
          resumeResult,
          assignedResult,
          trendingResult,
          popularResult,
          relevantResult,
          newResult,
        ] = await Promise.allSettled([
          fetchSectionCourses("/api/courses/resume"),
          fetchSectionCourses("/api/courses/assigned"),
          fetchSectionCourses("/api/courses/trending"),
          fetchSectionCourses("/api/courses/popular-by-category"),
          fetchSectionCourses("/api/courses/relevant"),
          fetchSectionCourses("/api/courses/newest"),
        ])

        if (signal.aborted) {
          return
        }

        setResumeCourses(
          resumeResult.status === "fulfilled"
            ? (resumeResult.value?.courses ?? [])
            : []
        )
        setAssignedCourses(
          assignedResult.status === "fulfilled"
            ? (assignedResult.value?.courses ?? [])
            : []
        )
        setTrendingCourses(
          trendingResult.status === "fulfilled"
            ? (trendingResult.value?.courses ?? [])
            : []
        )
        setPopularByCategory(
          popularResult.status === "fulfilled"
            ? (popularResult.value?.courses ?? [])
            : []
        )
        setRelevantCourses(
          relevantResult.status === "fulfilled"
            ? (relevantResult.value?.courses ?? [])
            : []
        )
        setRelevantDepartmentName(
          relevantResult.status === "fulfilled"
            ? (relevantResult.value?.departmentName ??
                t("course.relevant_department", language))
            : t("course.relevant_department", language)
        )
        setNewCourses(
          newResult.status === "fulfilled"
            ? (newResult.value?.courses ?? [])
            : []
        )

        if (resumeResult.status === "rejected") {
          if (!isAbortError(resumeResult.reason)) {
            console.error(
              "Failed to fetch resume courses:",
              resumeResult.reason
            )
          }
        }
        if (assignedResult.status === "rejected") {
          if (!isAbortError(assignedResult.reason)) {
            console.error(
              "Failed to fetch assigned courses:",
              assignedResult.reason
            )
          }
        }
        if (trendingResult.status === "rejected") {
          if (!isAbortError(trendingResult.reason)) {
            console.error(
              "Failed to fetch trending courses:",
              trendingResult.reason
            )
          }
        }
        if (popularResult.status === "rejected") {
          if (!isAbortError(popularResult.reason)) {
            console.error(
              "Failed to fetch popular-by-category courses:",
              popularResult.reason
            )
          }
        }
        if (relevantResult.status === "rejected") {
          if (!isAbortError(relevantResult.reason)) {
            console.error(
              "Failed to fetch relevant courses:",
              relevantResult.reason
            )
          }
        }
        if (newResult.status === "rejected") {
          if (!isAbortError(newResult.reason)) {
            console.error("Failed to fetch newest courses:", newResult.reason)
          }
        }

        fetchedSections.current.add("all")
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Course fetch cancelled")
          return
        }
        console.error("Error fetching course sections:", error)
      } finally {
        setLoadingTrending(false)
        setLoadingPopular(false)
        setLoadingRelevant(false)
        setLoadingNew(false)
      }
    }

    fetchAllCourseSections()

    // Cleanup pending requests
    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const flash = searchParams.get("flash")
    if (flash !== "management-access-denied") return
    if (handledFlashRef.current === flash) return

    handledFlashRef.current = flash
    messageApi.error(t("course.management_access_denied", language))

    const params = new URLSearchParams(searchParams.toString())
    params.delete("flash")
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }, [messageApi, pathname, router, searchParams])

  const handleSearch = (query: string) => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set("query", query.trim())
      params.set("page", "1")
    }
    router.push(`?${params.toString()}`)
  }

  // --- RENDER ---
  return (
    <div>
      {contextHolder}
      {/* Hero Section with Search */}
      <CourseSearchHero onSearch={handleSearch} />

      {/* Main Content */}
      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 60px" }}
      >
        {/* Filter Widget - White Card (Compact) */}
        <div
          style={{
            width: "fit-content",
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            padding: "16px",
            marginBottom: "30px",
          }}
        >
          <CourseCompactFilters categories={categories} />
        </div>

        {/* Resume Section - Show if user has in-progress courses */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {resumeCourses.length > 0 && (
            <CourseSection
              title={t("course.continue_learning", language)}
              subtitle={t("course.continue_learning_desc", language)}
              courses={resumeCourses}
              instructorMap={new Map(
                resumeCourses.map((c) => [
                  c.creator_id,
                  {
                    name: (c as any).creator_name || (c as any).creator_full_name || "",
                    avatar: (c as any).creator_avatar_url || undefined,
                  },
                ])
              )}
              columns={4}
            />
          )}
        </FadeInOnScroll>

        {/* Assigned Section - Private courses assigned to current user */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {assignedCourses.length > 0 && (
            <CourseSection
              title={t("course.assigned_courses", language)}
              subtitle={t("course.assigned_courses_desc", language)}
              courses={assignedCourses}
              instructorMap={new Map(
                assignedCourses.map((c) => [
                  c.creator_id,
                  {
                    name: (c as any).creator_name || (c as any).creator_full_name || "",
                    avatar: (c as any).creator_avatar_url || undefined,
                  },
                ])
              )}
              columns={4}
            />
          )}
        </FadeInOnScroll>

        {/* CTA Promo - Q&A Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          <CTAPromo
            type="qa"
            title={t("course.cta_questions", language)}
            description={t("course.cta_questions_desc", language)}
            buttonText={t("course.cta_questions_button", language)}
            href="/questions"
          />
        </FadeInOnScroll>

        {/* CTA Promo - Articles Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          <CTAPromo
            type="articles"
            title={t("course.cta_articles", language)}
            description={t("course.cta_articles_desc", language)}
            buttonText={t("course.cta_articles_button", language)}
            href="/articles"
          />
        </FadeInOnScroll>

        {/* Trending Courses Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {trendingCourses.length > 0 && (
            <TrendingCourses
              courses={trendingCourses}
              isLoading={loadingTrending}
              instructorMap={new Map(
                trendingCourses.map((c) => [
                  c.creator_id,
                  {
                    name: (c as any).creator_name || (c as any).creator_full_name || "",
                    avatar: (c as any).creator_avatar_url || undefined,
                  },
                ])
              )}
            />
          )}
        </FadeInOnScroll>

        {/* Relevant Courses Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {relevantCourses.length > 0 && (
            <RelevantCoursesSection
              courses={relevantCourses}
              departmentName={relevantDepartmentName}
              isLoading={loadingRelevant}
              instructorMap={new Map(
                relevantCourses.map((c) => [
                  c.creator_id,
                  {
                    name: (c as any).creator_name || (c as any).creator_full_name || "",
                    avatar: (c as any).creator_avatar_url || undefined,
                  },
                ])
              )}
            />
          )}
        </FadeInOnScroll>

        {/* New Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {newCourses.length > 0 && (
            <CourseSection
              title={t("course.latest_courses", language)}
              subtitle={t("course.latest_courses_desc", language)}
              courses={newCourses}
              instructorMap={new Map(
                newCourses.map((c) => [
                  c.creator_id,
                  {
                    name: (c as any).creator_name || (c as any).creator_full_name || "",
                    avatar: (c as any).creator_avatar_url || undefined,
                  },
                ])
              )}
              columns={4}
              isLoading={loadingNew}
            />
          )}
        </FadeInOnScroll>

        {/* All Courses Section (Main catalog) */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {
            <CourseSection
              title={t("course.all_courses", language)}
              subtitle={t("course.all_courses_desc", language)}
              courses={initialCourses}
              instructorMap={new Map(
                initialCourses.map((c) => [
                  c.creator_id,
                  {
                    name: (c as any).creator_name || (c as any).creator_full_name || "",
                    avatar: (c as any).creator_avatar_url || undefined,
                  },
                ])
              )}
              columns={4}
            />
          }
        </FadeInOnScroll>

        {/* Empty State */}
        {currentSearchParams?.query &&
          initialCourses.length === 0 &&
          !fetchError && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  marginBottom: "12px",
                  color: "#111827",
                }}
              >
                {t("course.no_courses_found", language)}
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  marginBottom: "24px",
                }}
              >
                {t("course.no_courses_desc", language)}
              </p>
            </div>
          )}

        {/* Error State */}
        {fetchError && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "20px",
              color: "#991b1b",
            }}
          >
            <strong>{t("course.error_label", language)}</strong> {fetchError}
          </div>
        )}
      </div>
    </div>
  )
}
