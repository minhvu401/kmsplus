//@/ Courses page component
// This component renders the public courses page with search, sorting, and  pagination

import React from "react"
import type { Metadata } from "next"
import type { Course } from "@/service/course.service"

import { getAllCoursesAction } from "@/service/course.service"
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
  sort?: string // Giữ là string ở đây vì nó đến từ URL
  // category?: string
}

const DEFAULT_LIMIT = 12

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  // Lấy tham số từ URL
  const query = params.query || ""
  const currentPage = params.page ? parseInt(params.page, 10) : 1
  const page = Math.max(1, currentPage)

  // Lấy và kiểm tra giá trị sort
  const sortParam = params.sort // Lấy trực tiếp từ URL
  // Kiểm tra xem sortParam có hợp lệ không
  const validSort: SortOption | undefined =
    sortParam && ALLOWED_SORT_OPTIONS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : undefined // Sẽ là undefined nếu không hợp lệ hoặc không có

  // (THAY ĐỔI) Quyết định giá trị sort cuối cùng để dùng
  const sortToUse: SortOption = validSort || "trending" // Dùng validSort nếu có, ngược lại dùng 'trending'

  // const categorySlug = searchParams.category || '';

  // --- KHAI BÁO BIẾN NGOÀI TRY...CATCH ---
  let courses: Course[] = []
  let totalCount: number = 0
  let fetchError: string | null = null

  try {
    // Lấy dữ liệu khóa học từ database bằng Server Action
    // (THAY ĐỔI) Truyền 'sortToUse' vào action
    const result = await getAllCoursesAction({
      query,
      page,
      sort: sortToUse, // <-- Truyền biến 'sort' đã validate và có giá trị mặc định
      limit: DEFAULT_LIMIT,
      // categorySlug,
    })

    // Gán kết quả
    if (result) {
      courses = result.courses || []
      totalCount = result.totalCount || 0
    } else {
      console.warn("getAllCoursesAction returned null or undefined")
      fetchError = "Could not load course data."
    }
  } catch (error) {
    // Xử lý lỗi
    console.error("Error fetching courses:", error)
    fetchError =
      "An error occurred while loading courses. Please try again later."
    courses = []
    totalCount = 0
  }

  // Truyền dữ liệu xuống Client Component
  return (
    <div className="min-h-screen bg-gray-50">
      <CourseClient
        initialCourses={courses}
        initialTotalCount={totalCount}
        coursesPerPage={DEFAULT_LIMIT}
        fetchError={fetchError}
        currentSearchParams={{
          // Truyền các tham số hiện tại để client biết
          query,
          page: page.toString(),
          sort: sortToUse, // (THAY ĐỔI) Truyền giá trị sort đã dùng xuống client
          // category: categorySlug,
        }}
      />
    </div>
  )
}