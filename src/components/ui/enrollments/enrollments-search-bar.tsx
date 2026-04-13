"use client"

import React, { useEffect, useState } from "react"
import { Input } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"

export default function EnrollmentsSearchBar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryParam = searchParams.get("query") || ""
  const { language } = useLanguageStore()
  const [query, setQuery] = useState(queryParam)

  useEffect(() => {
    setQuery(queryParam)
  }, [queryParam])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentQuery = (searchParams.get("query") || "").trim()
      const params = new URLSearchParams(searchParams.toString())
      const normalized = query.trim()

      // Do not reset page when only pagination/filter/sort changes.
      if (normalized === currentQuery) {
        return
      }

      if (normalized) {
        params.set("query", normalized)
      } else {
        params.delete("query")
      }

      params.set("page", "1")

      const nextQueryString = params.toString()
      const currentQueryString = searchParams.toString()

      if (nextQueryString !== currentQueryString) {
        router.replace(`${pathname}?${nextQueryString}`)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [pathname, query, router, searchParams])

  return (
    <Input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      prefix={<SearchOutlined className="text-gray-400" />}
      placeholder={
        language === "vi"
          ? "Tìm theo tên hoặc email học viên..."
          : "Search by learner name or email..."
      }
      className="w-full md:w-96 rounded-lg bg-gray-50 hover:bg-white focus:bg-white border-gray-200"
      size="large"
      allowClear
    />
  )
}
