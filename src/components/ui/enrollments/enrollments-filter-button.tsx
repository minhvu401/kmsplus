"use client"

import React from "react"
import { Button, Popover, Select } from "antd"
import { FilterOutlined } from "@ant-design/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"

interface EnrollmentsFilterButtonProps {
  departments: string[]
}

export default function EnrollmentsFilterButton({
  departments,
}: EnrollmentsFilterButtonProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get("status") || "any"
  const currentDepartment = searchParams.get("department") || "any"
  const { language } = useLanguageStore()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")

    if (value === "any") {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    router.replace(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")
    params.delete("department")
    params.set("page", "1")
    router.replace(`${pathname}?${params.toString()}`)
  }

  const content = (
    <div className="w-72 space-y-4">
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {language === "vi" ? "Trạng thái" : "Status"}
        </div>
        <Select
          value={currentStatus}
          className="w-full"
          onChange={(value) => updateParam("status", value)}
          options={[
            { label: language === "vi" ? "Tất cả" : "Any", value: "any" },
            {
              label: language === "vi" ? "Chưa bắt đầu" : "Not Started",
              value: "Not Started",
            },
            {
              label: language === "vi" ? "Đang học" : "In Progress",
              value: "In Progress",
            },
            {
              label: language === "vi" ? "Hoàn thành" : "Completed",
              value: "Completed",
            },
          ]}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {language === "vi" ? "Phòng ban" : "Department"}
        </div>
        <Select
          value={currentDepartment}
          className="w-full"
          onChange={(value) => updateParam("department", value)}
          options={[
            { label: language === "vi" ? "Tất cả" : "Any", value: "any" },
            ...departments.map((department) => ({
              label: department,
              value: department,
            })),
          ]}
        />
      </div>

      <Button block onClick={resetFilters}>
        {language === "vi" ? "Đặt lại bộ lọc" : "Reset filters"}
      </Button>
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Button
        icon={<FilterOutlined />}
        size="large"
        className="rounded-lg text-gray-600 font-medium"
      >
        {language === "vi" ? "Bộ lọc" : "Filter"}
      </Button>
    </Popover>
  )
}
