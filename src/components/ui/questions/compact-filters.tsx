"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Flex, Button, Tooltip, Select } from "antd"
import { ClearOutlined } from "@ant-design/icons"
import Search from "./search"
import { Category } from "@/service/question.service"

interface CompactFiltersProps {
  categories: Category[]
}

export default function CompactFilters({ categories }: CompactFiltersProps) {
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
        <Search placeholder="Search questions..." />
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
          { label: "All Categories", value: "any" },
          ...categories.map((cat) => ({
            label: cat.name,
            value: String(cat.id),
          })),
        ]}
        placeholder="Select category"
        allowClear={category !== "any"}
        title="Filter by category"
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
        title="Filter by status"
      >
        <option value="any">All Status</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
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
        title="Sort results"
      >
        <option value="newest">Newest</option>
        <option value="most-answers">Most Answers</option>
      </select>

      {/* Clear Filters Button */}
      <Tooltip title="Clear all filters">
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
          title="Clear filters"
        ></Button>
      </Tooltip>
    </Flex>
  )
}
