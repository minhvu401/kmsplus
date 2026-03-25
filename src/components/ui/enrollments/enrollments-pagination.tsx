"use client"

import React from "react"
import { Pagination } from "antd"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface EnrollmentsPaginationProps {
  totalItems: number
  currentPage: number
  pageSize: number
}

export default function EnrollmentsPagination({
  totalItems,
  currentPage,
  pageSize,
}: EnrollmentsPaginationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Pagination
      current={currentPage}
      pageSize={pageSize}
      total={totalItems}
      onChange={handleChange}
      showSizeChanger={false}
    />
  )
}
