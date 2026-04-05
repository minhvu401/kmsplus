// @/src/app/(main)/courses/components/CourseClient.tsx
"use client"

import type { Course } from "@/service/course.service"
import React, { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { message } from "antd"
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
  const handledFlashRef = React.useRef<string | null>(null)

  // State for each course section
  const [resumeCourses, setResumeCourses] = useState<Course[]>([])
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([])
  const [popularByCategory, setPopularByCategory] = useState<Course[]>([])
  const [relevantCourses, setRelevantCourses] = useState<Course[]>([])
  const [newCourses, setNewCourses] = useState<Course[]>([])

  // Loading states for each section
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [loadingPopular, setLoadingPopular] = useState(false)
  const [loadingRelevant, setLoadingRelevant] = useState(false)
  const [loadingNew, setLoadingNew] = useState(false)

  // OPTIMIZED: Cache fetched data to prevent unnecessary re-fetches on page changes
  const fetchedSections = React.useRef(new Set<string>())
  const hasRunInitialFetch = React.useRef(false)

  // Fetch different course sections on mount
  useEffect(() => {
    // OPTIMIZED: Only run initial fetch once
    if (hasRunInitialFetch.current) return
    hasRunInitialFetch.current = true

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
        // Fetch all sections in parallel
        const [resumeRes, trendingRes, popularRes, relevantRes, newRes] =
          await Promise.all([
            fetch("/api/courses/resume", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal,
            }),
            fetch("/api/courses/trending", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal,
            }),
            fetch("/api/courses/popular-by-category", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal,
            }),
            fetch("/api/courses/personalized", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal,
            }),
            fetch("/api/courses/newest", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal,
            }),
          ])

        // Process responses in parallel
        const [resumeData, trendingData, popularData, relevantData, newData] =
          await Promise.all([
            resumeRes.json(),
            trendingRes.json(),
            popularRes.json(),
            relevantRes.json(),
            newRes.json(),
          ])

        // Update state
        setResumeCourses(resumeData.courses || [])
        setTrendingCourses(trendingData.courses || [])
        setPopularByCategory(popularData.courses || [])
        setRelevantCourses(relevantData.courses || [])
        setNewCourses(newData.courses || [])

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
    messageApi.error("You do not have permission to access course management.")

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
              title="Tiếp tục học"
              subtitle="Xem lại các khóa học bạn đang theo học"
              courses={resumeCourses}
              columns={4}
            />
          )}
        </FadeInOnScroll>

        {/* Trending Courses Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {trendingCourses.length > 0 && (
            <TrendingCourses
              courses={trendingCourses}
              isLoading={loadingTrending}
            />
          )}
        </FadeInOnScroll>

        {/* CTA Promo - Q&A Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          <CTAPromo
            type="qa"
            title="Có câu hỏi?"
            description="Hỏi đáp trực tiếp từ cộng đồng và các chuyên gia. Giải quyết vấn đề và học hỏi từ những người khác."
            buttonText="Khám phá Q&A"
            href="/questions"
          />
        </FadeInOnScroll>

        {/* CTA Promo - Articles Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          <CTAPromo
            type="articles"
            title="Đọc bài viết chuyên sâu"
            description="Tìm hiểu thêm thông qua các bài viết, hướng dẫn và kinh nghiệm từ đội KMS-Plus và các chuyên gia."
            buttonText="Khám phá Bài viết"
            href="/articles"
          />
        </FadeInOnScroll>

        {/* Relevant Courses Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {relevantCourses.length > 0 && (
            <RelevantCoursesSection
              courses={relevantCourses}
              departmentName="Công nghệ thông tin"
              isLoading={loadingRelevant}
            />
          )}
        </FadeInOnScroll>

        {/* New Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {newCourses.length > 0 && (
            <CourseSection
              title="Mới nhất từ KMS Plus"
              subtitle="Các khóa học mới được thêm gần đây"
              courses={newCourses}
              columns={4}
              isLoading={loadingNew}
            />
          )}
        </FadeInOnScroll>

        {/* All Courses Section (Main catalog) */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {!currentSearchParams?.query && initialCourses.length > 0 && (
            <CourseSection
              title="Tất cả khóa học"
              subtitle="Khám phá các khóa học có sẵn"
              courses={initialCourses}
              columns={4}
            />
          )}
        </FadeInOnScroll>

        {/* Search Results Section */}
        <FadeInOnScroll threshold={0.2} triggerOnce={true}>
          {currentSearchParams?.query && initialCourses.length > 0 && (
            <CourseSection
              title={`Kết quả tìm kiếm cho "${currentSearchParams.query}"`}
              courses={initialCourses}
              columns={4}
            />
          )}
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
                Không tìm thấy khóa học
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  marginBottom: "24px",
                }}
              >
                Hãy thử tìm kiếm với các từ khóa khác
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
            <strong>Lỗi:</strong> {fetchError}
          </div>
        )}
      </div>
    </div>
  )
}
