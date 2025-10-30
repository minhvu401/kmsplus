import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getCourseByIdAction,
  getAllCoursesAction,
} from "@/service/course.service"
import type { Course } from "@/service/course.service"
import Link from "next/link"
import { Button, Tabs, Card, Image } from "antd"

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number(params.id)
  if (!id || Number.isNaN(id)) return { title: "Course" }
  const course = await getCourseByIdAction(id)
  return { title: course ? course.title : "Course" }
}

export default async function CourseDetailPage({ params }: Props) {
  const id = Number(params.id)
  if (!id || Number.isNaN(id)) return notFound()

  // Fetch course from DB (server-side). Using service directly to read from Neon.
  const course: Course | null = await getCourseByIdAction(id)
  if (!course) return notFound()

  // Optional: fetch related courses for the bottom section
  const related =
    (await getAllCoursesAction({ page: 1, limit: 6 })).courses || []

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header: title, meta, thumbnail/video */}
            <div className="bg-white p-6 rounded shadow">
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <div>By Creator #{course.creator_id}</div>
                <div>·</div>
                <div>{course.enrollment_count} students</div>
                <div>·</div>
                <div>
                  {course.published_at
                    ? new Date(course.published_at).toLocaleDateString()
                    : "Unpublished"}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* Thumbnail or video preview */}
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-72 object-cover rounded"
                      preview
                    />
                  ) : (
                    <div className="w-full h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      No media
                    </div>
                  )}
                </div>

                <aside className="bg-gray-50 p-4 rounded">
                  {/* <div className="text-xl font-semibold">
                    {course.status === "published" ? "$99" : "$0"}
                  </div> */}
                  <div className="text-sm text-gray-600 mt-2">
                    Course Duration: {course.duration_hours ?? "-"} hours
                  </div>
                  <div className="mt-4">
                    <Button type="primary" size="large" block>
                      Enroll Now
                    </Button>
                    {/* <Button size="large" block className="mt-2">
                      Buy Now
                    </Button> */}
                  </div>
                </aside>
              </div>

              {/* Tabs: Overview / Curriculum / Instructor / Review */}
              <div className="mt-6 border-t pt-4">
                <Tabs
                  defaultActiveKey="1"
                  items={[
                    {
                      key: "1",
                      label: "Overview",
                      children: (
                        <section>
                          <h2 className="text-lg font-semibold mb-2">
                            Description
                          </h2>
                          <p className="text-gray-700 whitespace-pre-line">
                            {course.description ?? "No description provided."}
                          </p>
                        </section>
                      ),
                    },
                    {
                      key: "2",
                      label: "Curriculum",
                      children: (
                        <section>
                          <h3 className="text-lg font-semibold mb-2">
                            Curriculum
                          </h3>
                          <Card>
                            <p className="text-sm text-gray-600">
                              Curriculum items coming from DB — implement course
                              sections/lectures table and query them to display
                              real data.
                            </p>
                          </Card>
                        </section>
                      ),
                    },
                    {
                      key: "3",
                      label: "Instructor",
                      children: (
                        <section>
                          <h3 className="text-lg font-semibold mb-2">
                            Course instructor
                          </h3>
                          <Card>
                            <p className="text-sm text-gray-600">
                              Instructor info not yet modeled in DB — currently
                              showing creator id #{course.creator_id}.
                            </p>
                          </Card>
                        </section>
                      ),
                    },
                    {
                      key: "4",
                      label: "Review",
                      children: (
                        <section>
                          <h3 className="text-lg font-semibold mb-2">
                            Students Feedback
                          </h3>
                          <div className="space-y-4">
                            <Card>No reviews yet.</Card>
                          </div>
                        </section>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Related / right column for smaller screens we already show price box inside header */}
          <div className="lg:col-span-1">
            <Card title="Related Courses">
              <div className="mt-3 space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/courses/${r.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden">
                      {r.thumbnail_url ? (
                        <Image
                          src={r.thumbnail_url}
                          alt={r.title}
                          className="w-full h-full object-cover"
                          preview={false}
                        />
                      ) : null}
                    </div>
                    <div className="text-sm truncate">{r.title}</div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
