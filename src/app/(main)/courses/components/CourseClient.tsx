/**
 * CourseClient.tsx
 * @/app/(main)/courses/components/CourseClient.tsx
 * Client component for displaying a list of courses with search, sort, and pagination.
 * This is a preview-compatible version that doesn't use Next.js specific components.
 */

"use client"
import type { Course } from "@/service/course.service"
import React, { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Bell, Clock } from "lucide-react"
import {
  Input,
  Select,
  Button,
  Badge,
  Avatar,
  Alert,
  Card,
  Rate,
  Pagination as AntPagination,
} from "antd"
import { SearchOutlined } from "@ant-design/icons"

interface SearchParams {
  query?: string
  page?: string
  sort?: "trending" | "popular" | "newest"
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
  // State management
  const [searchInput, setSearchInput] = useState(
    currentSearchParams?.query || ""
  )
  const [sortOption, setSortOption] = useState<SearchParams["sort"]>(
    currentSearchParams?.sort || "trending"
  )
  const [currentPage, setCurrentPage] = useState(
    Number(currentSearchParams?.page) || 1
  )

  // Use the initialCourses directly as they are already sorted and paginated on the server
  const paginatedCourses = initialCourses
  const totalPages = Math.ceil(initialTotalCount / coursesPerPage)

  // Navigation handlers
  const createQueryString = useCallback(
    (params: Partial<SearchParams>): string => {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.set(key, String(value))
        }
      })

      return searchParams.toString()
    },
    []
  )

  const handleSearch = (value: string) => {
    const queryString = createQueryString({
      ...currentSearchParams,
      query: value || undefined,
      page: "1", // Reset to first page on new search
    })
    // Force a full page reload to trigger server-side data fetching
    window.location.href = `?${queryString}`
  }

  const handleSortChange = (value: string) => {
    const newSort = value as SearchParams["sort"]
    const queryString = createQueryString({
      ...currentSearchParams,
      sort: newSort,
      page: "1", // Reset to first page on sort change
    })
    // Force a full page reload to trigger server-side data fetching
    window.location.href = `?${queryString}`
  }

  const handlePageChange = (newPage: number) => {
    const queryString = createQueryString({
      ...currentSearchParams,
      page: String(newPage),
    })
    // Force a full page reload to trigger server-side data fetching
    window.location.href = `?${queryString}`
  }

  // Render the component
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />

      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6 xl:px-8 py-4">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Welcome To KMS Plus Course
          </h1>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 xl:px-8 py-8">
        <main className="w-full min-w-0">
          {/* Search and Sort Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-auto flex-grow md:flex-grow-0 max-w-lg">
              <Input.Search
                placeholder="Search courses by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={handleSearch}
                size="large"
                allowClear
                style={{ borderRadius: "9999px" }}
              />
            </div>

            <div className="flex items-center gap-2 text-sm w-full md:w-auto flex-shrink-0">
              <label className="text-gray-600 flex-shrink-0">Sort by:</label>
              <Select
                value={sortOption}
                onChange={handleSortChange}
                size="large"
                style={{ width: "100%", minWidth: 150 }}
                options={[
                  { value: "trending", label: "Trending" },
                  { value: "popular", label: "Most Popular" },
                  { value: "newest", label: "Newest" },
                ]}
              />
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
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchInput
                  ? "No courses found matching your search."
                  : "No courses available at the moment."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !fetchError && (
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalCount={initialTotalCount}
                perPage={coursesPerPage}
                onPageChange={handlePageChange}
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
 * Header component with navigation
 */
function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-screen-xl mx-auto px-4 lg:px-6 xl:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <a
            href="/courses"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            KMS Plus
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="/my-learning"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              My Learning
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge count={1} size="small">
            <Button
              type="text"
              icon={<Bell size={20} />}
              className="text-gray-600 hover:text-blue-600"
            />
          </Badge>
          <Avatar
            size={36}
            src="https://placehold.co/40x40/E2E8F0/31343C?text=U"
            alt="User Profile"
          />
        </div>
      </nav>
    </header>
  )
}

/**
 * CourseCard component to display individual course information
 */
// @/src/app/(main)/courses/components/CourseClient.tsx

/**
 * CourseCard component to display individual course information
 */
function CourseCard({ course }: { course: Course }) {
  // ✅ ĐÃ SỬA: Tạo số rating cố định dựa trên ID khóa học
  // Thay vì dùng Math.random() thuần túy, ta dùng công thức toán học với ID
  const mockRating = useMemo(() => {
    const idNum = Number(course.id) || 0
    // Hàm sin giúp tạo ra số thập phân có vẻ ngẫu nhiên nhưng cố định với mỗi ID
    const seed = Math.sin(idNum) * 10000
    const random = seed - Math.floor(seed) // Tạo số từ 0 -> 1

    // Tính rating trong khoảng 4.2 đến 5.0
    return (4.2 + random * (5.0 - 4.2)).toFixed(1)
  }, [course.id])

  return (
    <Link href={`/courses/${course.id}`} className="block h-full">
      <Card
        hoverable
        className="h-full flex flex-col"
        cover={
          <div className="relative h-40 w-full bg-gray-200 overflow-hidden">
            <img
              src={
                course.thumbnail_url ||
                "https://placehold.co/600x400/E2E8F0/31343C?text=KMS+Course"
              }
              alt={course.title || "Course thumbnail"}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  "https://placehold.co/600x400/E2E8F0/31343C?text=Image+Not+Found"
              }}
            />
          </div>
        }
      >
        <Card.Meta
          title={
            <h3 className="font-semibold text-md text-gray-900 line-clamp-2">
              {course.title}
            </h3>
          }
          description={
            <p className="text-xs text-gray-500 line-clamp-2">
              {course.description || "No description available."}
            </p>
          }
        />
        <div className="mt-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Rate
              disabled
              value={parseFloat(mockRating)} // Sửa defaultValue thành value để chắc chắn
              style={{ fontSize: 14 }}
            />
            <span className="font-bold text-gray-700">{mockRating}</span>
            <span>({course.enrollment_count.toLocaleString()} students)</span>
          </div>
          {course.duration_hours && (
            <div className="flex justify-end">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {course.duration_hours} hours
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

/**
 * Pagination component for navigating between pages
 */
interface PaginationProps {
  currentPage: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
}

function Pagination({
  currentPage,
  totalCount,
  perPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / perPage)

  // Don't render if there's only one page
  if (totalPages <= 1) return null

  // Generate page numbers with ellipsis
  const pageNumbers: (number | string)[] = []
  const maxPagesToShow = 5
  const halfMaxPages = Math.floor(maxPagesToShow / 2)

  if (totalPages <= maxPagesToShow) {
    // Show all pages if there are few enough
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }
  } else {
    // Always show first page
    pageNumbers.push(1)

    let startPage = Math.max(2, currentPage - halfMaxPages)
    let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages)

    // Adjust if we're near the start or end
    if (currentPage <= halfMaxPages + 1) {
      endPage = maxPagesToShow - 1
    }

    if (currentPage >= totalPages - halfMaxPages) {
      startPage = totalPages - maxPagesToShow + 2
    }

    // Add ellipsis if needed before middle section
    if (startPage > 2) {
      pageNumbers.push("…")
    }

    // Add middle section of page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    // Add ellipsis if needed after middle section
    if (endPage < totalPages - 1) {
      pageNumbers.push("…")
    }

    // Always show last page
    pageNumbers.push(totalPages)
  }

  // Page button component
  interface PageButtonProps {
    page: number | string
    children: React.ReactNode
    isDisabled?: boolean
    isActive?: boolean
    title?: string
  }

  return (
    <div className="flex items-center justify-center">
      <AntPagination
        current={currentPage}
        total={totalCount}
        pageSize={perPage}
        onChange={onPageChange}
        showSizeChanger={false}
        showQuickJumper
        showTotal={(total, range) =>
          `${range[0]}-${range[1]} of ${total} items`
        }
      />
    </div>
  )
}
