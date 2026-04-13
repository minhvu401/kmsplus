import { getCourseReviewsForManagement } from "@/action/reviews/reviewActions"
import {
  getCourseById,
  getCourseManagementAccess,
} from "@/action/courses/courseAction"
import Pagination from "@/components/ui/questions/pagination"
import PageSizeSelector from "@/components/ui/questions/page-size-selector"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import ManageReviewsTable from "@/components/ui/reviews/manage-reviews"
import ViewReviewsTable from "@/components/ui/reviews/view-reviews"
import FeedbackPageText from "@/components/ui/reviews/feedback-page-text"
import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"
import { Flex } from "antd"
import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    page?: string
    limit?: string
  }>
}

export default async function CourseManageReviewsPage(props: PageProps) {
  const user = await requireAuth()

  const params = await props.params
  const searchParams = await props.searchParams

  const courseId = Number(params.id)
  if (!Number.isFinite(courseId) || courseId <= 0) {
    redirect("/courses/management?flash=course-not-found")
  }

  const access = await getCourseManagementAccess(courseId)
  if (!access.allowed) {
    const target = access.redirectTo || "/courses/management"
    const flash = access.flash ? `?flash=${access.flash}` : ""
    redirect(`${target}${flash}`)
  }

  const currentPage = Number(searchParams?.page) || 1
  const pageSize = Number(searchParams?.limit) || 10

  const [course, reviewsResult] = await Promise.all([
    getCourseById(courseId),
    getCourseReviewsForManagement({
      course_id: courseId,
      page: currentPage,
      limit: pageSize,
    }),
  ])

  if (!course) {
    redirect("/courses/management?flash=course-not-found")
  }

  const { reviews, totalCount } = reviewsResult

  const roleRows = await sql`
    SELECT LOWER(r.name) AS name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${Number(user.id)}
  `
  const roleNames = roleRows.map((row: any) => String(row.name || ""))

  const managedDepartmentRows = await sql`
    SELECT id
    FROM department
    WHERE head_of_department_id = ${Number(user.id)}
      AND is_deleted = FALSE
    LIMIT 1
  `

  const isTrainingManagerRole = roleNames.some((name) =>
    name.includes("training manager")
  )
  const isHeadOfDepartmentManager = managedDepartmentRows.length > 0
  const useReadOnlyReviewsTable =
    isTrainingManagerRole || isHeadOfDepartmentManager

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <PageWrapper>
      <Flex className="p-6" vertical>
        <FeedbackPageText
          courseTitle={(course as any)?.title || ""}
          courseId={courseId}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          currentCount={reviews.length}
        />

        {useReadOnlyReviewsTable ? (
          <ViewReviewsTable reviews={reviews} />
        ) : (
          <ManageReviewsTable reviews={reviews} courseId={courseId} />
        )}

        <Flex className="flex justify-end my-6">
          <PageSizeSelector currentPageSize={pageSize} />
        </Flex>

        <Flex className="flex justify-center mt-2">
          <Pagination totalPages={totalPages} />
        </Flex>

      </Flex>
    </PageWrapper>
  )
}
