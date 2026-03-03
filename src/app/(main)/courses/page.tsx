// src/app/(main)/courses/page.tsx
// This component renders the public courses page with search, sorting, filtering, and pagination

import React from "react"
import type { Metadata } from "next"
import type { Course } from "@/service/course.service"

import { getPublishedCoursesService } from "@/service/course.service"
import CourseClient from "./components/CourseClient"

export const dynamic = "force-dynamic"

// Metadata (Tùy chọn)
export const metadata: Metadata = {
  title: "KMS Plus Courses",
  description: "Browse available courses.",
}

// Định nghĩa kiểu cho các giá trị sort hợp lệ
type SortOption = "trending" | "popular" | "newest"
const ALLOWED_SORT_OPTIONS: SortOption[] = ["trending", "popular", "newest"]

// Định nghĩa kiểu cho searchParams
export type SearchParams = {
  query?: string
  page?: string
  sort?: string
  category?: string // ✅ Đã có
  rating?: string
}

const DEFAULT_LIMIT = 12

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // 1. Lấy tham số từ URL
  const query = params.query || ""
  const currentPage = params.page ? parseInt(params.page, 10) : 1
  const page = Math.max(1, currentPage)

  // ✅ Lấy tham số Category (Mặc định là 'all' nếu không có)
  const category = params.category || "all"
  const rating = params.rating || "all"

  // Lấy và kiểm tra giá trị sort
  const sortParam = params.sort
  const validSort: SortOption | undefined =
    sortParam && ALLOWED_SORT_OPTIONS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : undefined

  const sortToUse: SortOption = validSort || "trending"

  // --- KHAI BÁO BIẾN ---
  let courses: Course[] = []
  let totalCount: number = 0
  let fetchError: string | null = null

  try {
    // 2. Gọi Service chỉ lấy khóa học Published
    const result = await getPublishedCoursesService({
      query,
      page,
      sort: sortToUse,
      limit: DEFAULT_LIMIT,
      category: category, // ✅ Truyền category xuống Service
    })

    if (result) {
      courses = result.courses || []
      totalCount = result.totalCount || 0
    } else {
      console.warn("getPublishedCoursesService returned null or undefined")
      fetchError = "Could not load course data."
    }
  } catch (error) {
    console.error("Error fetching courses:", error)
    fetchError =
      "An error occurred while loading courses. Please try again later."
    courses = []
    totalCount = 0
  }

  // 3. Truyền dữ liệu xuống Client Component
  return (
    <div className="min-h-screen bg-gray-50">
      <CourseClient
        initialCourses={courses}
        initialTotalCount={totalCount}
        coursesPerPage={DEFAULT_LIMIT}
        fetchError={fetchError}
        currentSearchParams={{
          query,
          page: page.toString(),
          sort: sortToUse,
          category: category, // ✅ Truyền lại để Client hiển thị đúng filter đang chọn
          rating: rating,
        }}
      />
    </div>
  )
}
