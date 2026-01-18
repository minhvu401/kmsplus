// @src/app/(main)/courses/manage/courses-manage-page.tsx
// Course management page component

import Link from "next/link"
import { getAllCourses } from "@/action/courses/courseAction"
import { deleteCourseAPI } from "@/action/courses/courseAction"
import type { Course } from "@/service/course.service"
import type { Metadata } from "next"
import ManageCoursesClient from "../components/ManageCoursesClient"
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Course Management",
}

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ManagerCoursesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params?.page || "1") || 1
  const query = Array.isArray(params?.query)
    ? params?.query[0]
    : (params?.query as string) || ""
  const limit = 10

  // 3. Gọi API lấy dữ liệu (Giữ nguyên)
  const { courses = [], totalCount = 0 } =
    (await getAllCourses({ query, page, limit })) || {}

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <ManageCoursesClient
          courses={courses}
          totalCount={totalCount}
          query={query}
          page={page}
        />
      </div>
    </main>
  )
}
