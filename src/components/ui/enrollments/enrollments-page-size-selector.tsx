"use client"

import React from "react"
import { Select } from "antd"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface EnrollmentsPageSizeSelectorProps {
  currentPageSize: number
}

export default function EnrollmentsPageSizeSelector({
  currentPageSize,
}: EnrollmentsPageSizeSelectorProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageSizeChange = (value: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("limit", value.toString())
    params.set("page", "1")
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 font-medium">Items per page:</span>
      <Select
        value={currentPageSize}
        onChange={handlePageSizeChange}
        style={{ width: 88 }}
        options={[
          { label: "5", value: 5 },
          { label: "10", value: 10 },
          { label: "20", value: 20 },
          { label: "50", value: 50 },
        ]}
      />
    </div>
  )
}
