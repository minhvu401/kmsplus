"use client"

import React from "react"
import { Button, Dropdown } from "antd"
import { SortAscendingOutlined } from "@ant-design/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const SORT_OPTIONS: Record<string, string> = {
  "name-asc": "Alphabetically (A-Z)",
  "progress-desc": "By Progress Percentage",
  "enrollment-date-desc": "Enrollment Date (Newest)",
  "enrollment-date-asc": "Enrollment Date (Oldest)",
}

export default function EnrollmentsSortButton() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get("sort") || "name-asc"

  const handleSortChange = ({ key }: { key: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", key)
    params.set("page", "1")
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Dropdown
      menu={{
        selectedKeys: [currentSort],
        onClick: handleSortChange,
        items: Object.entries(SORT_OPTIONS).map(([value, label]) => ({
          key: value,
          label,
        })),
      }}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button
        icon={<SortAscendingOutlined />}
        size="large"
        className="rounded-lg text-gray-600 font-medium"
      >
        Sort
      </Button>
    </Dropdown>
  )
}
