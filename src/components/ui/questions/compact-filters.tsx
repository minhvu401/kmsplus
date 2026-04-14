"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Flex, Button, Tooltip, Select } from "antd"
import { ClearOutlined } from "@ant-design/icons"
import Search from "./search"
import { Category } from "@/service/question.service"
import useLanguageStore from "@/store/useLanguageStore"

interface CompactFiltersProps {
  categories: Category[]
}

export default function CompactFilters({ categories }: CompactFiltersProps) {
  const { language } = useLanguageStore()
  const isVi = language === "vi"

  const text = isVi
    ? {
        searchPlaceholder: "Tìm kiếm câu hỏi...",
        allCategories: "Tất cả danh mục",
        selectCategory: "Chọn danh mục",
        filterByCategory: "Lọc theo danh mục",
        filterByStatus: "Lọc theo trạng thái",
        allStatus: "Tất cả trạng thái",
        open: "Đang mở",
        closed: "Đã đóng",
        sortResults: "Sắp xếp kết quả",
        newest: "Mới nhất",
        mostAnswers: "Nhiều câu trả lời",
        clearAllFilters: "Xóa tất cả bộ lọc",
        clearFilters: "Xóa bộ lọc",
      }
    : {
        searchPlaceholder: "Search questions...",
        allCategories: "All Categories",
        selectCategory: "Select category",
        filterByCategory: "Filter by category",
        filterByStatus: "Filter by status",
        allStatus: "All Status",
        open: "Open",
        closed: "Closed",
        sortResults: "Sort results",
        newest: "Newest",
        mostAnswers: "Most Answers",
        clearAllFilters: "Clear all filters",
        clearFilters: "Clear filters",
      }

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const [category, setCategory] = useState(
    searchParams.get("category") || "any"
  )
  const [status, setStatus] = useState(searchParams.get("status") || "any")
  const [sort, setSort] = useState(searchParams.get("sort") || "newest")
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Check if any filter is active
  useEffect(() => {
    const active =
      category !== "any" ||
      status !== "any" ||
      sort !== "newest" ||
      searchParams.has("query")
    setHasActiveFilters(active)
  }, [category, status, sort, searchParams])

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")

    if (value === "any") {
      params.delete("category")
    } else {
      params.set("category", value)
    }

    setCategory(value)
    replace(`${pathname}?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")

    if (value === "any") {
      params.delete("status")
    } else {
      params.set("status", value)
    }

    setStatus(value)
    replace(`${pathname}?${params.toString()}`)
  }

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    params.set("sort", value)

    setSort(value)
    replace(`${pathname}?${params.toString()}`)
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams()
    setCategory("any")
    setStatus("any")
    setSort("newest")
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Flex wrap="wrap" align="center" gap={8} style={{ width: "100%" }}>
      {/* Search - Full width on first row */}
      <div style={{ flex: "1 1 100%", minWidth: "200px", marginBottom: 12 }}>
        <Search placeholder={text.searchPlaceholder} />
      </div>

      {/* Category Filter - Searchable */}
      <Select
        value={category}
        onChange={(value) => handleCategoryChange(value)}
        style={{
          minWidth: "120px",
          flex: "1 1 auto",
        }}
        options={[
          { label: text.allCategories, value: "any" },
          ...categories.map((cat) => ({
            label: cat.name,
            value: String(cat.id),
          })),
        ]}
        placeholder={text.selectCategory}
        allowClear={category !== "any"}
        title={text.filterByCategory}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        style={{
          height: "36px",
          padding: "0 10px",
          borderRadius: "0.375rem",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          fontSize: "13px",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.2s",
          borderColor: status !== "any" ? "#2563eb" : "#e5e7eb",
          flex: "1 1 auto",
          minWidth: "100px",
        }}
        onMouseEnter={(e) => {
          if (status === "any") {
            e.currentTarget.style.borderColor = "#60a5fa"
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor =
            status !== "any" ? "#2563eb" : "#e5e7eb"
        }}
        title={text.filterByStatus}
      >
        <option value="any">{text.allStatus}</option>
        <option value="open">{text.open}</option>
        <option value="closed">{text.closed}</option>
      </select>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => handleSortChange(e.target.value)}
        style={{
          height: "36px",
          padding: "0 10px",
          borderRadius: "0.375rem",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          fontSize: "13px",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.2s",
          flex: "1 1 auto",
          minWidth: "130px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#60a5fa"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb"
        }}
        title={text.sortResults}
      >
        <option value="newest">{text.newest}</option>
        <option value="most-answers">{text.mostAnswers}</option>
      </select>

      {/* Clear Filters Button */}
      <Tooltip title={text.clearAllFilters}>
        <Button
          type="text"
          size="small"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          style={{
            height: "36px",
            padding: "0 12px",
            color: hasActiveFilters ? "#ef4444" : "#d1d5db",
            opacity: hasActiveFilters ? 1 : 0.5,
            cursor: hasActiveFilters ? "pointer" : "not-allowed",
          }}
          icon={<ClearOutlined />}
          title={text.clearFilters}
        ></Button>
      </Tooltip>
    </Flex>
  )
}
