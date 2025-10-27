/*
========================================================================
|
|   app/courses/page.tsx 
|   Để khắc phục, tôi đã thực hiện các thay đổi sau:
|   1.  Biến toàn bộ file thành MỘT Client Component duy nhất (không còn
|       Server Component) để có thể preview.
|   2.  Thay thế <Link> của Next.js bằng thẻ <a> HTML thông thường.
|   3.  Thay thế <Image> của Next.js bằng thẻ <img> HTML thông thường.
|   4.  Tạo dữ liệu giả (mock data) ngay bên trong file này, vì không thể 
|       gọi Server Action "@/action/courses/coursesAction".
|   5.  Mô phỏng lại chức năng Search, Sort, và Pagination bằng React State
|       (useState) thay vì dùng next/navigation.
|
|   Giờ đây, bạn có thể nhấn "Preview" để xem giao diện và các chức năng
|   (tìm kiếm, phân trang) hoạt động với dữ liệu giả.
|
================================================================================
*/
"use client"
import React, { useState, useMemo } from "react"
// Import các icon (môi trường này hỗ trợ lucide-react)
import {
  Bell,
  Search as SearchIcon,
  Filter,
  ChevronDown,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

//==============================================================================
// 1. DỮ LIỆU GIẢ (MOCK DATA) & TYPES
//========================================================================

// Định nghĩa kiểu Course (dựa trên service của bạn)
export type Course = {
  id: number
  creator_id: number
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  status: string
  duration_hours: number | null
  enrollment_count: number
  created_at: Date
}
// Tạo 100 khóa học giả
const mockData: Course[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  creator_id: 101,
  title: `Course ${i + 1}: ${["Introduction to React", "Advanced Next.js", "Mastering SQL", "UI/UX Design Principles", "Python for Data Science"][i % 5]}`,
  slug: `course-${i + 1}`,
  description:
    "This is a mock description for the course. Learn the fundamentals and advanced techniques.",
  thumbnail_url: `https://placehold.co/600x400/${Math.floor(Math.random() * 16777215).toString(16)}/31343C?text=Course+${i + 1}`,
  status: i % 3 === 0 ? "published" : "draft",
  duration_hours: Math.floor(Math.random() * 20) + 5,
  enrollment_count: Math.floor(Math.random() * 50000) + 1000,
  created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Ngày tạo ngẫu nhiên
}))
const COURSES_PER_PAGE = 18
//==============================================================================
// 2. MAIN APP COMPONENT (CLIENT COMPONENT)
//========================================================================
export default function App() {
  // State cho các chức năng tương tác
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState("trending")

  // State cho giá trị input (để người dùng gõ)
  const [searchInputValue, setSearchInputValue] = useState("")

  // --- Logic Lọc, Sắp xếp, Phân trang (Client-side) ---
  const filteredAndSortedCourses = useMemo(() => {
    // 1. Lọc (Filter)
    const filtered = mockData.filter((course) =>
      course.title.toLowerCase().includes(query.toLowerCase())
    )

    // 2. Sắp xếp (Sort)
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.created_at.getTime() - a.created_at.getTime()
        case "popular":
          return b.enrollment_count - a.enrollment_count
        case "trending":
        default:
          // Giả lập trending (vd: kết hợp enrollment và ngày tạo)
          return (
            b.enrollment_count / (Date.now() - b.created_at.getTime()) -
            a.enrollment_count / (Date.now() - a.created_at.getTime())
          )
      }
    })

    return sorted
  }, [query, sort]) // Chỉ chạy lại khi query hoặc sort thay đổi

  // 3. Phân trang (Paginate)
  const paginatedCourses = useMemo(() => {
    const offset = (currentPage - 1) * COURSES_PER_PAGE
    return filteredAndSortedCourses.slice(offset, offset + COURSES_PER_PAGE)
  }, [filteredAndSortedCourses, currentPage]) // Chạy lại khi danh sách lọc hoặc trang thay đổi

  const totalCount = filteredAndSortedCourses.length

  // --- Handlers ---
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setQuery(searchInputValue)
    setCurrentPage(1) // Reset về trang 1 khi tìm kiếm
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value)
    setCurrentPage(1) // Reset về trang 1 khi sắp xếp
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo(0, 0) // Cuộn lên đầu trang
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* 1. Header (Đã sửa <a> và <img>) */}
      <Header />

      {/* 2. Tiêu đề chính */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Welcome To KMS Plus Course
          </h1>
        </div>
      </div>

      {/* 3. Main Content (Sidebar + Grid) */}
      <div className="max-w-screen-xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* 3.1. Sidebar (Component tĩnh) */}
        <Sidebar />

        {/* 3.2. Phần nội dung chính */}
        <main className="flex-1">
          {/* 1. Thanh Filter, Search, Sort */}
          <div className="flex justify-between items-center mb-6">
            <button className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm bg-white text-sm font-medium hover:bg-gray-50">
              <Filter size={16} />
              <span>Filter</span>
            </button>

            <div className="flex items-center gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-64">
                <input
                  type="text"
                  placeholder="Search Course..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <SearchIcon
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </form>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Sort by:</span>
                <select
                  value={sort}
                  onChange={handleSortChange}
                  className="border rounded-md bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="trending">Trending</option>
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Course Grid (Đã sửa <CourseCard>) */}
          {paginatedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <h3 className="text-xl font-semibold">No courses found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}

          {/* 3. Pagination */}
          {totalCount > COURSES_PER_PAGE && (
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                perPage={COURSES_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

//==============================================================================
// 3. CÁC COMPONENT GIAO DIỆN PHỤ (ĐÃ SỬA LỖI)
//==============================================================================

// --- 3.1. Header (Sửa <a> và <img>) ---
function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo & Nav */}
        <div className="flex items-center gap-8">
          <a href="#" className="text-2xl font-bold text-blue-600">
            KMS Plus
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              My Learning
            </a>
            <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600">
              <span>Category</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Search & User */}
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-blue-600 relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <img
            src="https://placehold.co/40x40/E2E8F0/31343C?text=User" // Placeholder
            alt="User Profile"
            width={36}
            height={36}
            className="rounded-full"
          />
        </div>
      </nav>
    </header>
  )
}

// --- 3.2. Sidebar (Không cần sửa) ---
function Sidebar() {
  return (
    <aside className="w-full lg:w-64 space-y-6">
      <Accordion title="CATEGORY">
        <CheckboxItem label="Development" count={108} />
        <CheckboxItem label="Web Development" count={52} isSubItem />
        <CheckboxItem label="Software Engineering" count={21} isSubItem />
        <CheckboxItem label="Business" count={72} />
        <CheckboxItem label="Office Productivity" count={45} />
        <CheckboxItem label="Personal Development" count={91} />
      </Accordion>

      <Accordion title="TOOLS">
        <CheckboxItem label="HTML 5" count={45} />
        <CheckboxItem label="CSS 3" count={39} />
        <CheckboxItem label="JavaScript" count={58} />
        <CheckboxItem label="React" count={22} />
      </Accordion>

      <Accordion title="RATING">
        <RadioItem label="5 stars" name="rating" />
        <RadioItem label="4 stars & up" name="rating" />
        <RadioItem label="3 stars & up" name="rating" />
      </Accordion>

      <Accordion title="COURSE LEVEL">
        <CheckboxItem label="All" count={320} />
        <CheckboxItem label="Beginner" count={150} />
        <CheckboxItem label="Intermediate" count={120} />
        <CheckboxItem label="Expert" count={50} />
      </Accordion>

      <Accordion title="PRICE">
        <RadioItem label="All" name="price" />
        <RadioItem label="Paid" name="price" />
        <RadioItem label="Free" name="price" />
      </Accordion>

      <Accordion title="DURATION">
        <CheckboxItem label="0-12 hours" count={100} />
        <CheckboxItem label="1-2 days" count={80} />
        <CheckboxItem label="1-7 days" count={140} />
      </Accordion>
    </aside>
  )
}

// --- 3.3. Course Card (Sửa <a> và <img>) ---
function CourseCard({ course }: { course: Course }) {
  // Dữ liệu mô phỏng vì backend không cung cấp
  const mockRating = (Math.random() * (5 - 4.2) + 4.2).toFixed(1)
  const mockPrice =
    Math.random() > 0.7 ? "Free" : `$${Math.floor(Math.random() * 20) + 10}`

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <a href={`#`} className="block">
        {/* Hình ảnh (Thay thế Next/Image) */}
        <div className="relative h-40 w-full bg-gray-200">
          <img
            src={
              course.thumbnail_url ||
              "https://placehold.co/600x400/E2E8F0/31343C?text=KMS+Plus"
            }
            alt={course.title}
            className="object-cover w-full h-full"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src =
                "https://placehold.co/600x400/E2E8F0/31343C?text=No+Image"
            }}
          />
        </div>

        {/* Nội dung card */}
        <div className="p-4 flex flex-col h-[160px]">
          <h3 className="font-semibold text-md text-gray-900 line-clamp-2 h-12">
            {course.title}
          </h3>

          <div className="flex-grow"></div>

          {/* Rating & Students */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-bold text-amber-500">
              {mockRating}
            </span>
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-gray-500">
              ({course.enrollment_count.toLocaleString()} students)
            </span>
          </div>

          {/* Giá & Thời lượng */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-lg font-bold text-blue-600">{mockPrice}</span>
            {course.duration_hours && (
              <span className="text-xs text-gray-500">
                {course.duration_hours} hours
              </span>
            )}
          </div>
        </div>
      </a>
    </article>
  )
}

// --- 3.4. Pagination (Không cần sửa) ---
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
  if (totalPages <= 1) return null

  const pageNumbers = []
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  const PageButton = ({
    page,
    children,
    isDisabled = false,
    isActive = false,
  }: any) => (
    <button
      onClick={() => !isDisabled && onPageChange(page)}
      disabled={isDisabled}
      className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium
                ${isDisabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-blue-50"}
                ${isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white border border-gray-300"}
            `}
    >
      {children}
    </button>
  )

  return (
    <nav className="flex items-center justify-center gap-2">
      <PageButton page={1} isDisabled={currentPage === 1}>
        <ChevronsLeft size={16} />
      </PageButton>
      <PageButton page={currentPage - 1} isDisabled={currentPage === 1}>
        <ChevronLeft size={16} />
      </PageButton>

      {startPage > 1 && <span className="px-2 text-gray-500">...</span>}

      {pageNumbers.map((page) => (
        <PageButton key={page} page={page} isActive={currentPage === page}>
          {page}
        </PageButton>
      ))}

      {endPage < totalPages && <span className="px-2 text-gray-500">...</span>}

      <PageButton
        page={currentPage + 1}
        isDisabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </PageButton>
      <PageButton page={totalPages} isDisabled={currentPage === totalPages}>
        <ChevronsRight size={16} />
      </PageButton>
    </nav>
  )
}

// --- 3.5. Components phụ cho Sidebar (Không cần sửa) ---
function Accordion({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <details className="w-full" open>
      <summary className="flex justify-between items-center cursor-pointer pb-2 border-b">
        <span className="font-semibold text-sm uppercase">{title}</span>
        <ChevronDown size={18} className="transition-transform duration-200" />
      </summary>
      <div className="pt-3 space-y-2">{children}</div>
    </details>
  )
}

function CheckboxItem({
  label,
  count,
  isSubItem = false,
}: {
  label: string
  count: number
  isSubItem?: boolean
}) {
  return (
    <label
      className={`flex items-center justify-between text-sm ${isSubItem ? "pl-4" : ""}`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
        />
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="text-xs text-gray-500">{count}</span>
    </label>
  )
}

function RadioItem({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="radio"
        name={name}
        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-gray-700">{label}</span>
    </label>
  )
}
