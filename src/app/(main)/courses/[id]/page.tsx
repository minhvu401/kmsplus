/**
 * Course Detail Page
 * @/(main)/courses/[id]
 */

import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import NextAuth from "next-auth"
import CourseCurriculum from "@/app/(main)/courses/components/CourseCurriculum"
import EnrollButton from "../components/EnrollButton"
import { checkEnrollmentStatus } from "@/action/enrollment/enrollmentAction"
import { getCurrentUser, verifyToken } from "@/lib/auth"
import { authConfig } from "@/lib/auth.config"

import {
  getCourseByIdAction,
  getAllCoursesAction,
} from "@/service/course.service"
import { getUserDetail } from "@/service/user.service"
import { getAllReviewsAction } from "@/service/review.service"
import type { Course } from "@/service/course.service"
import { sql } from "@/lib/database"
import Link from "next/link"
import { Button, Tabs, Card, Image, Progress, Avatar } from "antd"
import { PlayCircleOutlined, UserOutlined, StarFilled } from "@ant-design/icons" // Đã có PlayCircleOutlined ở đây

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const courseId = Number(id)
  if (isNaN(courseId)) {
    return { title: "Khóa học không hợp lệ" }
  }
  const course = await getCourseByIdAction(courseId)
  return {
    title: course?.title || "Chi tiết Khóa học",
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const courseId = Number(id)

  if (isNaN(courseId)) {
    notFound()
  }

  // 1. Lấy thông tin người dùng hiện tại
  const { auth } = NextAuth(authConfig)
  const session = await auth()
  const user = await getCurrentUser()
  let viewerId: number | null = null

  const sessionUserId = Number((session as any)?.user?.id)
  if (Number.isFinite(sessionUserId)) {
    viewerId = sessionUserId
  }

  const parsedUserId = user ? Number(user.id) : NaN
  if (!viewerId && Number.isFinite(parsedUserId)) {
    viewerId = parsedUserId
  }

  // Fallback: decode legacy JWT cookie to get numeric user id.
  if (!viewerId) {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (token) {
      try {
        const decoded = await verifyToken(token)
        const decodedId = Number(decoded.id)
        if (Number.isFinite(decodedId)) {
          viewerId = decodedId
        }
      } catch {
        // Keep viewerId null if token is invalid/expired.
      }
    }
  }

  // Fallback for NextAuth payloads that may only include email.
  if (!viewerId && user?.email) {
    const userRows = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER(${user.email})
        AND status = 'active'
      LIMIT 1
    `
    if (userRows.length > 0) {
      viewerId = Number(userRows[0].id)
    }
  }

  // 2. Fetch dữ liệu song song (Tối ưu hiệu năng)
  const [course, enrollment, coursesRes, reviewsMeta] = await Promise.all([
    getCourseByIdAction(courseId),
    // ✅ FIX LỖI 3: Khai báo và gán giá trị cho biến enrollment ở đây
    viewerId ? checkEnrollmentStatus(courseId, viewerId) : null,
    getAllCoursesAction({ limit: 6, page: 1, sort: "newest" }),
    getAllReviewsAction({ course_id: courseId, page: 1, limit: 1 }),
  ])

  if (!course) {
    notFound()
  }

  // ✅ Authorization matrix for course visibility/status
  const hasViewer = viewerId !== null
  const creatorId = Number(course.creator_id)
  const isCreator =
    hasViewer && Number.isFinite(creatorId) && viewerId === creatorId

  let isAdmin = false
  let isAssignedToPrivateCourse = false
  let isSupervisingHeadOfDepartment = false

  if (hasViewer) {
    const roleRows = await sql`
      SELECT LOWER(r.name) AS name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${viewerId}
    `
    const roleNames = roleRows.map((row: any) => String(row.name || ""))
    isAdmin = roleNames.some((role) => role.includes("admin"))

    const assignedRows = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM assignment_rules ar
        WHERE ar.course_id = ${courseId}
          AND (
            ar.target_type = 'all_employees'
            OR (ar.target_type = 'department' AND ar.department_id = (SELECT department_id FROM users WHERE id = ${viewerId}))
            OR (ar.target_type = 'role' AND ar.role_id IN (SELECT role_id FROM user_roles WHERE user_id = ${viewerId}))
            OR (ar.target_type = 'user' AND ar.user_id = ${viewerId})
          )
      ) AS is_assigned
    `
    isAssignedToPrivateCourse = Boolean(assignedRows?.[0]?.is_assigned)

    const supervisingRows = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM users creator
        JOIN department d ON d.id = creator.department_id
        WHERE creator.id = ${creatorId}
          AND d.head_of_department_id = ${viewerId}
          AND d.is_deleted = FALSE
      ) AS is_supervising_hod
    `
    isSupervisingHeadOfDepartment = Boolean(
      supervisingRows?.[0]?.is_supervising_hod
    )
  }

  const isPublished = course.status === "published"
  const isPrivate = course.visibility === "private"
  const isPublic = course.visibility === "public" || course.visibility === null
  const isDraft = course.status === "draft"
  const isPendingOrRejected =
    course.status === "pending_approval" || course.status === "rejected"

  let canViewCourse = false

  if (isPublished && isPublic) {
    // Status published & Visibility public: Anyone can see
    canViewCourse = true
  } else if (isPublished && isPrivate) {
    // Status published & Visibility private:
    // assigned users, creator, supervising HoD, system admin
    canViewCourse =
      isAssignedToPrivateCourse ||
      isCreator ||
      isSupervisingHeadOfDepartment ||
      isAdmin
  } else if (isDraft) {
    // Status draft: Creator & System Admin
    canViewCourse = isCreator || isAdmin
  } else if (isPendingOrRejected) {
    // Status pending_approval & rejected:
    // Creator, supervising HoD, System Admin
    canViewCourse = isCreator || isSupervisingHeadOfDepartment || isAdmin
  }

  if (!canViewCourse) {
    notFound()
  }

  const creator = await getUserDetail(String(course.creator_id))
  const averageRating = Number(course.average_rating ?? 0).toFixed(1)
  const ratingsCount = reviewsMeta.totalCount

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
                <div className="flex items-center gap-2">
                  <span>By</span>
                  <Avatar
                    size={20}
                    src={creator?.avatar_url || undefined}
                    icon={<UserOutlined />}
                  />
                  <span>
                    {creator?.full_name || "Người tạo không xác định"}
                  </span>
                </div>
                <div>·</div>
                <div>{course.enrollment_count} students</div>
                <div>·</div>
                <div className="flex items-center gap-1">
                  <StarFilled className="text-yellow-500" />
                  <span>{averageRating}</span>
                  <span className="text-gray-500">({ratingsCount})</span>
                </div>
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
                      courseStatus={course.status}
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
                            <div className="flex items-center gap-4">
                              <Avatar
                                size={56}
                                src={creator?.avatar_url || undefined}
                                icon={<UserOutlined />}
                              />
                              <div>
                                <p className="text-base font-semibold text-gray-800">
                                  {creator?.full_name ||
                                    "Người tạo không xác định"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {creator?.email || "Không có email"}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </section>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card title="Các khóa học liên quan">
              <div className="mt-3 space-y-3">
                {related.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    Không có khóa học liên quan.
                  </p>
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
