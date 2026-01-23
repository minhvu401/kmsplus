/**
 * Course Detail Page
 * @/(main)/courses/[id]
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import CourseCurriculum from "@/app/(main)/courses/components/CourseCurriculum"
import EnrollButton from "../components/EnrollButton"
import { checkEnrollmentStatus } from "@/action/enrollment/enrollmentAction"
import { getCurrentUser } from "@/lib/auth"

import {
  getCourseByIdAction,
  getAllCoursesAction,
} from "@/service/course.service"
import type { Course } from "@/service/course.service"
import Link from "next/link"
import { Button, Tabs, Card, Image, Progress } from "antd"
import { PlayCircleOutlined, UserOutlined } from "@ant-design/icons" // Đã có PlayCircleOutlined ở đây

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const courseId = Number(id)
  if (isNaN(courseId)) {
    return { title: "Invalid Course" }
  }
  const course = await getCourseByIdAction(courseId)
  return {
    title: course?.title || "Course Details",
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const courseId = Number(id)

  if (isNaN(courseId)) {
    notFound()
  }

  // 1. Lấy thông tin người dùng hiện tại
  const user = await getCurrentUser()

  // 2. Fetch dữ liệu song song (Tối ưu hiệu năng)
  const [course, enrollment, coursesRes] = await Promise.all([
    getCourseByIdAction(courseId),
    // ✅ FIX LỖI 3: Khai báo và gán giá trị cho biến enrollment ở đây
    user ? checkEnrollmentStatus(courseId, Number(user.id)) : null,
    getAllCoursesAction({ limit: 6, page: 1, sort: "newest" }),
  ])

  if (!course) {
    notFound()
  }

  const related = (coursesRes?.courses || [])
    .filter((c) => c.id !== courseId)
    .slice(0, 5)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded shadow">
              <h1 className="text-2xl font-bold text-gray-900">
                {course.title}
              </h1>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <div>By Creator #{course.creator_id}</div>
                <div>·</div>
                <div>{course.enrollment_count} students</div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
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
                  <div className="text-sm text-gray-600 mt-2 mb-4">
                    Course Duration: {course.duration_hours ?? "0"} hours
                  </div>

                  {/* ✅ LOGIC HIỂN THỊ NÚT: Đã có biến enrollment để kiểm tra */}
                  {enrollment ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-600">Your Progress</span>
                        <span className="text-blue-600">
                          {/* Dùng progress_percentage từ DB của bạn */}
                          {Number(enrollment.progress_percentage)}%
                        </span>
                      </div>
                      <Progress
                        percent={Number(enrollment.progress_percentage)}
                        showInfo={false}
                        strokeColor="#22c55e"
                        status="active"
                      />
                      <Link href={`/courses/${id}/learning`}>
                        <Button
                          type="primary"
                          size="large"
                          block
                          className="bg-blue-600 h-12 font-bold text-lg"
                        >
                          <PlayCircleOutlined /> Continue Learning
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <EnrollButton
                      courseId={courseId}
                      courseTitle={course.title}
                    />
                  )}
                </aside>
              </div>

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
                          <h3 className="text-lg font-semibold mb-4 text-gray-800">
                            Nội dung khóa học
                          </h3>
                          <CourseCurriculum
                            sections={(course as any).curriculum || []}
                          />
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
                              Creator id #{course.creator_id}.
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

          <div className="lg:col-span-1">
            <Card title="Related Courses">
              <div className="mt-3 space-y-3">
                {related.length === 0 && (
                  <p className="text-gray-400 text-sm">No related courses.</p>
                )}
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/courses/${r.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {r.thumbnail_url ? (
                        <Image
                          src={r.thumbnail_url}
                          alt={r.title}
                          className="w-full h-full object-cover"
                          preview={false}
                        />
                      ) : null}
                    </div>
                    <div className="text-sm truncate font-medium text-gray-700">
                      {r.title}
                    </div>
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
