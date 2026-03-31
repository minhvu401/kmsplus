// src/app/(main)/courses/page.tsx
// This component renders the public courses page with search, sorting, filtering, and pagination

import React from "react"
import type { Metadata } from "next"
import type { Course } from "@/service/course.service"

import {
  getPublishedCoursesService,
  getAllCategoriesAction,
} from "@/service/course.service"
import { getCurrentUser } from "@/lib/auth"
import CourseClient from "./components/CourseClient"

export const dynamic = "force-dynamic"

// Metadata (Tùy chọn)
export const metadata: Metadata = {
  title: "KMS Plus Courses",
  description: "Duyệt các khóa học có sẵn.",
}

// Định nghĩa kiểu cho các giá trị sort hợp lệ
type SortOption = "trending" | "popular" | "newest" | "top-rated"
const ALLOWED_SORT_OPTIONS: SortOption[] = [
  "trending",
  "popular",
  "newest",
  "top-rated",
]

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
  let categories: Array<{ id: number; name: string }> = []

  // ✅ Lấy userId cho private course filtering
  const currentUser = await getCurrentUser()
  const userId = currentUser ? Number(currentUser.id) : 0

  try {
    // Fetch categories và courses in parallel
    const [result, categoriesData] = await Promise.all([
      getPublishedCoursesService({
        query,
        page,
        sort: sortToUse,
        limit: DEFAULT_LIMIT,
        categories: category !== "all" ? [category] : undefined,
        rating: rating,
        userId, // ✅ Truyền userId vào đây
      }),
      getAllCategoriesAction(),
    ])

    if (result) {
      courses = result.courses || []
      totalCount = result.totalCount || 0
    } else {
      console.warn("getPublishedCoursesService returned null or undefined")
      fetchError = "Không thể tải dữ liệu khóa học."
    }

    categories = categoriesData || []
  } catch (error) {
    console.error("Error fetching courses:", error)
    fetchError = "Đã xảy ra lỗi khi tải khóa học. Vui lòng thử lại sau."
    courses = []
    totalCount = 0
    categories = []
  }

  // 3. Truyền dữ liệu xuống Client Component
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <CourseClient
        initialCourses={courses}
        initialTotalCount={totalCount}
        coursesPerPage={DEFAULT_LIMIT}
        fetchError={fetchError}
        categories={categories}
        currentSearchParams={{
          query,
          page: page.toString(),
          sort: sortToUse,
          category: category,
          rating: rating,
        }}
      />
    </div>
  )
}
