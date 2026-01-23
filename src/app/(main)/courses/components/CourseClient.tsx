/**
 * CourseClient.tsx
 * @/app/(main)/courses/components/CourseClient.tsx
 * Client component for displaying a list of courses with search, sort, filters, and pagination.
 * Combined: New UI + Old Logic Structure
 * Fix: Replaced next/link with standard <a> tag to avoid build errors in preview env.
 */

"use client"
import type { Course } from "@/service/course.service"
import React, { useState, useMemo, useCallback } from "react"
// import Link from "next/link" // Removed to avoid build error
import { Clock } from "lucide-react"
import {
  Input,
  Select,
  Alert,
  Card,
  Rate,
  Pagination as AntPagination,
  Button,
} from "antd"
import {
  SearchOutlined,
  AppstoreOutlined,
  StarOutlined,
} from "@ant-design/icons"

interface SearchParams {
  query?: string
  page?: string
  sort?: "trending" | "popular" | "newest"
  category?: string
  rating?: string
}

interface CourseClientProps {
  initialCourses: Course[]
  initialTotalCount: number
  coursesPerPage: number
  fetchError: string | null
  currentSearchParams?: SearchParams
}

export default function CourseClient({
  initialCourses,
  initialTotalCount,
  coursesPerPage,
  fetchError,
  currentSearchParams = {},
}: CourseClientProps) {
  // State management (Controlled Components for UI)
  const [searchInput, setSearchInput] = useState(
    currentSearchParams?.query || ""
  )
  const [sortOption, setSortOption] = useState<SearchParams["sort"]>(
    currentSearchParams?.sort || "trending"
  )
  const [categoryFilter, setCategoryFilter] = useState<string>(
    currentSearchParams?.category || "all"
  )
  const [ratingFilter, setRatingFilter] = useState<string>(
    currentSearchParams?.rating || "all"
  )

  const [currentPage, setCurrentPage] = useState(
    Number(currentSearchParams?.page) || 1
  )

  const totalPages = Math.ceil(initialTotalCount / coursesPerPage)

  // --- LOGIC CŨ (OLD VERSION LOGIC) ---
  // Giữ nguyên cách xử lý params đơn giản và spread ...currentSearchParams khi gọi hàm
  const createQueryString = useCallback(
    (params: Partial<SearchParams>): string => {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all") {
          searchParams.set(key, String(value))
        }
      })

      return searchParams.toString()
    },
    []
  )

  const handleSearch = (value: string) => {
    // Logic cũ: Spread currentSearchParams để giữ các filter khác (nếu có)
    const queryString = createQueryString({
      ...currentSearchParams,
      query: value || undefined,
      page: "1", // Reset về trang 1 khi search
    })
    // Force reload để trigger server-side fetching (như logic cũ)
    window.location.href = `?${queryString}`
  }

  const handleSortChange = (value: string) => {
    const newSort = value as SearchParams["sort"]
    setSortOption(newSort) // Optimistic Update

    const queryString = createQueryString({
      ...currentSearchParams,
      sort: newSort,
      page: "1",
    })
    window.location.href = `?${queryString}`
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value) // Optimistic Update

    const queryString = createQueryString({
      ...currentSearchParams,
      category: value === "all" ? undefined : value,
      page: "1",
    })
    window.location.href = `?${queryString}`
  }

  const handleRatingChange = (value: string) => {
    setRatingFilter(value) // Optimistic Update

    const queryString = createQueryString({
      ...currentSearchParams,
      rating: value === "all" ? undefined : value,
      page: "1",
    })
    window.location.href = `?${queryString}`
  }

  const handlePageChange = (newPage: number) => {
    const queryString = createQueryString({
      ...currentSearchParams,
      page: String(newPage),
    })
    window.location.href = `?${queryString}`
  }

  const handleClearAll = () => {
    setSearchInput("")
    setSortOption("trending")
    setCategoryFilter("all")
    setRatingFilter("all")
    window.location.href = "?"
  }

  // --- RENDER (NEW UI) ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 xl:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Welcome To <span className="text-blue-600">KMS Plus</span> Course
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Explore our comprehensive library of industry-leading courses
            designed to boost your professional career.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 xl:px-8 pb-12">
        <main className="w-full min-w-0">
          {/* --- TOOLBAR: SEARCH & FILTERS (Giao diện Mới) --- */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-4">
            {/* 1. Search Input */}
            <div className="w-full flex-1 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-4 py-1">
              <SearchOutlined className="text-gray-400 text-lg mr-2" />
              <Input
                placeholder="Search courses by title, keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={() => handleSearch(searchInput)}
                variant="borderless"
                size="large"
                className="!bg-transparent !px-0 text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* Group Filters */}
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
              {/* 2. Category Filter */}
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-3 py-1 w-full md:w-auto">
                <AppstoreOutlined className="text-gray-500 mr-2" />
                <Select
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                  variant="borderless"
                  size="large"
                  popupMatchSelectWidth={false}
                  className="!bg-transparent min-w-[140px]"
                  options={[
                    { value: "all", label: "All Categories" },
                    { value: "development", label: "Development" },
                    { value: "business", label: "Business" },
                    { value: "design", label: "Design" },
                    { value: "marketing", label: "Marketing" },
                  ]}
                />
              </div>

              {/* 3. Rating Filter */}
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-3 py-1 w-full md:w-auto">
                <StarOutlined className="text-gray-500 mr-2" />
                <Select
                  value={ratingFilter}
                  onChange={handleRatingChange}
                  variant="borderless"
                  size="large"
                  className="!bg-transparent min-w-[130px]"
                  options={[
                    { value: "all", label: "All Ratings" },
                    { value: "4.5", label: "4.5 & up ⭐" },
                    { value: "4.0", label: "4.0 & up ⭐" },
                    { value: "3.5", label: "3.5 & up ⭐" },
                  ]}
                />
              </div>

              {/* 4. Sort */}
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-4 py-1 w-full md:w-auto">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mr-2 whitespace-nowrap">
                  Sort:
                </span>
                <Select
                  value={sortOption}
                  onChange={handleSortChange}
                  variant="borderless"
                  size="large"
                  className="!bg-transparent font-medium text-gray-700 min-w-[110px]"
                  styles={{ popup: { root: { minWidth: "150px" } } }}
                  options={[
                    { value: "trending", label: "Trending" },
                    { value: "popular", label: "Most Popular" },
                    { value: "newest", label: "Newest" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {fetchError && (
            <div className="mb-6">
              <Alert
                message="Error"
                description={fetchError}
                type="error"
                showIcon
                closable
              />
            </div>
          )}

          {/* Course Grid */}
          {initialCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {initialCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
              <div className="mb-4">
                <SearchOutlined style={{ fontSize: 48, color: "#d1d5db" }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No courses found
              </h3>
              <p className="text-gray-500 mt-1">
                {searchInput
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "No courses available at the moment."}
              </p>
              <Button type="link" onClick={handleClearAll}>
                Clear all filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !fetchError && (
            <div className="mt-12 flex justify-center">
              <AntPagination
                current={currentPage}
                total={initialTotalCount}
                pageSize={coursesPerPage}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} courses`
                }
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ==============================================================================
// Sub-Components
// ==============================================================================

/**
 * CourseCard component to display individual course information
 */
function CourseCard({ course }: { course: Course }) {
  // Generate a deterministic rating based on ID
  const mockRating = useMemo(() => {
    const idNum = Number(course.id) || 0
    const seed = Math.sin(idNum) * 10000
    const random = seed - Math.floor(seed)
    return (4.0 + random * (5.0 - 4.0)).toFixed(1)
  }, [course.id])

  return (
    // Replaced Link with a to fix build error
    <a href={`/courses/${course.id}`} className="group block h-full">
      <Card
        hoverable
        variant="borderless"
        className="h-full flex flex-col shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden"
        styles={{
          body: {
            padding: "16px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
        }}
        cover={
          <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
            <img
              src={
                course.thumbnail_url ||
                "https://placehold.co/600x400/E2E8F0/31343C?text=KMS+Course"
              }
              alt={course.title || "Course thumbnail"}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image"
              }}
            />
          </div>
        }
      >
        <Card.Meta
          title={
            <h3 className="font-bold text-base text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
          }
          description={
            <p className="text-sm text-gray-500 line-clamp-2 mb-2 flex-grow">
              {course.description ||
                "Unlock your potential with this comprehensive course."}
            </p>
          }
        />
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 font-bold text-sm">
                {mockRating}
              </span>
              <Rate
                disabled
                count={5}
                value={Number(mockRating)}
                style={{ fontSize: 12, color: "#facc15" }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              ({(course.enrollment_count || 0) + 120} students)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
              <Clock size={12} />
              {course.duration_hours || 0} hours
            </div>
            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
              View Details
            </span>
          </div>
        </div>
      </Card>
    </a>
  )
}
