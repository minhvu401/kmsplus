// @/src/app/(main)/courses/components/CourseClient.tsx
"use client"

import type { Course } from "@/service/course.service"
import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation" // ✅ Dùng router của Next.js
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
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons"
import { getCategoriesAPI } from "@/action/courses/courseAction"

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
  const router = useRouter()

  // --- STATE MANAGEMENT ---
  // Các state này lưu giá trị tạm thời ở Client, chưa đẩy lên URL ngay
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

  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )

  const totalPages = Math.ceil(initialTotalCount / coursesPerPage)

  // Fetch Category
  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategoriesAPI()
      setCategories(data)
    }
    fetchCategories()
  }, [])

  // --- MASTER FILTER HANDLER ---
  // ✅ Hàm này gom tất cả điều kiện và thực hiện tìm kiếm 1 lần
  const handleApplyFilters = () => {
    const params = new URLSearchParams()

    // 1. Search Query
    if (searchInput.trim()) {
      params.set("query", searchInput.trim())
    }

    // 2. Category
    if (categoryFilter && categoryFilter !== "all") {
      params.set("category", categoryFilter)
    }

    // 3. Rating
    if (ratingFilter && ratingFilter !== "all") {
      params.set("rating", ratingFilter)
    }

    // 4. Sort
    if (sortOption && sortOption !== "trending") {
      params.set("sort", sortOption)
    }

    // Luôn reset về trang 1 khi bấm nút tìm kiếm/filter mới
    params.set("page", "1")

    // Đẩy lên URL để Server Component tải lại dữ liệu
    router.push(`?${params.toString()}`)
  }

  // Handle Enter key on input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyFilters()
    }
  }

  // Handle Pagination (Vẫn cần reload ngay khi chuyển trang)
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(newPage))
    router.push(`?${params.toString()}`)
  }

  const handleClearAll = () => {
    setSearchInput("")
    setSortOption("trending")
    setCategoryFilter("all")
    setRatingFilter("all")
    router.push("?")
  }

  // --- RENDER ---
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
          {/* --- TOOLBAR: SEARCH & FILTERS --- */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col xl:flex-row items-center gap-4">
            {/* 1. Search Input Area */}
            <div className="w-full flex-1 flex gap-2">
              <div className="relative w-full flex items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl px-4 py-1 border border-transparent focus-within:border-blue-300 focus-within:bg-white">
                <SearchOutlined className="text-gray-400 text-lg mr-2" />
                <Input
                  placeholder="Search courses by title, keywords..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyPress} // Bấm Enter để tìm
                  variant="borderless"
                  size="large"
                  className="!bg-transparent !px-0 text-gray-700 placeholder:text-gray-400 w-full"
                />
              </div>
              {/* ✅ NÚT TÌM KIẾM CHÍNH (Trigger) */}
              <Button
                type="default" // Đổi từ primary sang default để dễ custom nền
                size="middle" // Đổi từ large -> middle để nút bé lại
                icon={<SearchOutlined />}
                onClick={handleApplyFilters}
                className="rounded-lg px-5 bg-blue-50 text-blue-600 border-blue-200 hover:!bg-blue-100 hover:!text-blue-700 hover:!border-blue-300 font-medium shadow-sm transition-all"
              >
                Search
              </Button>
              {/* 👇 NÚT CLEAR FILTER MỚI 👇 */}
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={handleClearAll}
                title="Clear all filters"
                className="rounded-xl px-4 bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-red-500 hover:border-red-200 shadow-sm transition-colors"
              />
            </div>

            {/* 2. Group Filters (Chỉ set State, không reload trang) */}
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full xl:w-auto">
              {/* Category Filter */}
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-3 py-1 w-full md:w-auto border border-transparent hover:border-gray-200">
                <AppstoreOutlined className="text-gray-500 mr-2" />
                <Select
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val)} // ✅ Chỉ set State
                  variant="borderless"
                  size="large"
                  popupMatchSelectWidth={false}
                  className="!bg-transparent min-w-[140px]"
                  options={[
                    { value: "all", label: "All Categories" },
                    ...categories.map((cat) => ({
                      value: String(cat.id),
                      label: cat.name,
                    })),
                  ]}
                />
              </div>

              {/* Rating Filter */}
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-3 py-1 w-full md:w-auto border border-transparent hover:border-gray-200">
                <StarOutlined className="text-gray-500 mr-2" />
                <Select
                  value={ratingFilter}
                  onChange={(val) => setRatingFilter(val)} // ✅ Chỉ set State
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

              {/* Sort */}
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl flex items-center px-4 py-1 w-full md:w-auto border border-transparent hover:border-gray-200">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mr-2 whitespace-nowrap">
                  Sort:
                </span>
                <Select
                  value={sortOption}
                  onChange={(val) => setSortOption(val)} // ✅ Chỉ set State
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
                Try adjusting your search or filters to find what you're looking
                for.
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

function CourseCard({ course }: { course: Course }) {
  const mockRating = useMemo(() => {
    const idNum = Number(course.id) || 0
    const seed = Math.sin(idNum) * 10000
    const random = seed - Math.floor(seed)
    return (4.0 + random * (5.0 - 4.0)).toFixed(1)
  }, [course.id])

  return (
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
