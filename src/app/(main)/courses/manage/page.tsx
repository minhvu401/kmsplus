import Link from "next/link"
import { getAllCoursesAction } from "@/service/course.service"
import { deleteCourse } from "@/action/courses/courseAction"
import type { Course } from "@/service/course.service"
import type { Metadata } from "next"

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

  const { courses = [], totalCount = 0 } =
    (await getAllCoursesAction({ query, page, limit })) || {}

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded p-6 shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Course List</h2>
            <Link
              href="/courses/create"
              className="px-4 py-2 bg-sky-600 text-white rounded"
            >
              Create new Course
            </Link>
          </div>

          <form method="get" className="mb-4 flex gap-3">
            <input
              name="query"
              defaultValue={query}
              placeholder="Search course..."
              className="flex-1 border px-3 py-2 rounded"
            />
            <button className="px-4 py-2 bg-gray-200 rounded" type="submit">
              Search
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[800px]">
              <thead className="bg-sky-600 text-white">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Course Name</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Last Updated</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c: Course) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{`Q${String(c.id).padStart(3, "0")}`}</td>
                    <td className="p-3">{c.title}</td>
                    <td className="p-3 text-sky-600">{c.status}</td>
                    <td className="p-3">
                      {c.updated_at
                        ? new Date(c.updated_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${c.id}/update`}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          ✎
                        </Link>

                        {/* Server action form for delete */}
                        <form action={deleteCourse}>
                          <input type="hidden" name="id" value={String(c.id)} />
                          <button
                            type="submit"
                            className="px-2 py-1 border rounded text-sm text-red-600"
                          >
                            🗑
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {courses.length} of {totalCount} courses
          </div>
        </div>
      </div>
    </main>
  )
}
