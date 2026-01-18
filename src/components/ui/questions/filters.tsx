"use client"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Typography } from "antd"

type Category = {
    id: number;
    name: string;
}

const { Text } = Typography;

//------------------------------- CATEGORY FILTER ---------------------------------
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
        <div className="flex items-center gap-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category:
            </label>
            <select
                id="category"
                value={selected}
                onChange={(e) => handleChange(e.target.value)}
                className="block w-auto rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
                <option value="any">Any</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

// -------------------- STATUS FILTER --------------------
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
    params.set("page", "1") // reset pagination

    if (value === "any") {
      params.delete("status")
    } else {
      params.set("status", value)
    }

    replace(`${pathname}?${params.toString()}`)
    setSelected(value)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="status" className="text-sm font-medium text-gray-700">
        Status:
      </label>
      <select
        id="status"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option key="Any" value="any">
          Any
        </option>
        <option key="Open" value="open">
          Open
        </option>
        <option key="Closed" value="close">
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
    params.set("page", "1") // reset pagination

    params.set("sort", value)

    replace(`${pathname}?${params.toString()}`)
    setSelected(value)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option key="Newest" value="newest">
          Newest
        </option>
        <option key="Most Views" value="most-views">
          Most Popular
        </option>
        <option key="Most Answers" value="most-answers">
          Most Answers
        </option>
      </select>
    </div>
  )
}
