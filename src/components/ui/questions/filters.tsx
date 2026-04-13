"use client"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Typography } from "antd"
import { Category } from "@/service/question.service"

const { Text } = Typography

export function FilterCategory({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const currentCategory = searchParams.get("category") || "any"
  const [selected, setSelected] = useState(currentCategory)

  useEffect(() => {
    setSelected(currentCategory)
  }, [currentCategory])

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")

    if (value === "any") {
      params.delete("category")
    } else {
      params.set("category", value)
    }

    replace(`${pathname}?${params.toString()}`)
    setSelected(value)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="category" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        Category:
      </label>
      <select
        id="category"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          height: "36px",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          padding: "0 12px",
          fontSize: "14px",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = "#2563eb"
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = "#e5e7eb"
        }}
      >
        <option value="any">Any</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FilterStatus() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const currentStatus = searchParams.get("status") || "any"
  const [selected, setSelected] = useState(currentStatus)

  useEffect(() => {
    setSelected(currentStatus)
  }, [currentStatus])

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")

    if (value === "any") {
      params.delete("status")
    } else {
      params.set("status", value)
    }

    replace(`${pathname}?${params.toString()}`)
    setSelected(value)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="status" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        Status:
      </label>
      <select
        id="status"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          height: "36px",
          minWidth: "120px",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          padding: "0 12px",
          fontSize: "14px",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = "#2563eb"
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = "#e5e7eb"
        }}
      >
        <option key="Any" value="any">
          Any
        </option>
        <option key="Open" value="open">
          Open
        </option>
        <option key="Closed" value="closed">
          Closed
        </option>
      </select>
    </div>
  )
}

export function SortBy() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const currentSortCondition = searchParams.get("sort") || "newest"
  const [selected, setSelected] = useState(currentSortCondition)

  useEffect(() => {
    setSelected(currentSortCondition)
  }, [currentSortCondition])

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    params.set("sort", value)

    replace(`${pathname}?${params.toString()}`)
    setSelected(value)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          height: "36px",
          minWidth: "140px",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          padding: "0 12px",
          fontSize: "14px",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = "#2563eb"
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = "#e5e7eb"
        }}
      >
        <option key="Newest" value="newest">
          Newest
        </option>
        <option key="Most Answers" value="most-answers">
          Most Answers
        </option>
      </select>
    </div>
  )
}
