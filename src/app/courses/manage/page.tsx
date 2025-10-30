import Link from "next/link"
import { getAllCoursesAction } from "@/service/course.service"
import { deleteCourse } from "@/action/courses/courseAction"
import type { Course } from "@/service/course.service"
import type { Metadata } from "next"
import ManageCoursesClient from "./ManageCoursesClient"

export const metadata: Metadata = {
  title: "Course Management",
}

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function ManagerCoursesPage({ searchParams }: Props) {
  const page = Number(searchParams?.page || "1") || 1
  const query = Array.isArray(searchParams?.query)
    ? searchParams?.query[0]
    : (searchParams?.query as string) || ""
  const limit = 10

  const { courses = [], totalCount = 0 } =
    (await getAllCoursesAction({ query, page, limit })) || {}

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
