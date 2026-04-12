"use client"

import React from "react"
import { Button, Dropdown } from "antd"
import { SortAscendingOutlined } from "@ant-design/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"

export default function EnrollmentsSortButton() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguageStore()

  const sortOptions: Record<string, string> = {
    "name-asc":
      language === "vi" ? "Theo tên (A-Z)" : "Alphabetically (A-Z)",
    "progress-desc":
      language === "vi"
        ? "Theo phần trăm tiến độ"
        : "By Progress Percentage",
    "enrollment-date-desc":
      language === "vi"
        ? "Ngày ghi danh (Mới nhất)"
        : "Enrollment Date (Newest)",
    "enrollment-date-asc":
      language === "vi"
        ? "Ngày ghi danh (Cũ nhất)"
        : "Enrollment Date (Oldest)",
  }

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
        items: Object.entries(sortOptions).map(([value, label]) => ({
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
        {language === "vi" ? "Sắp xếp" : "Sort"}
      </Button>
    </Dropdown>
  )
}
