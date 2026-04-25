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
import CourseDetail from "@/components/CourseDetail"

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

  const related = (coursesRes?.courses || []).filter((c) => c.id !== courseId).slice(0, 5)

  return (
    <CourseDetail
      id={String(courseId)}
      course={course}
      enrollment={enrollment}
      creator={creator}
      related={related}
      averageRating={averageRating}
      ratingsCount={ratingsCount}
    />
  )
}
