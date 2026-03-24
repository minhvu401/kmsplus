import { getCourseReviewsForManagement } from "@/action/reviews/reviewActions"
import { getCourseById } from "@/action/courses/courseAction"
import Pagination from "@/components/ui/questions/pagination"
import PageSizeSelector from "@/components/ui/questions/page-size-selector"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import ManageReviewsTable from "@/components/ui/reviews/manage-reviews"
import { Permission } from "@/enum/permission.enum"
import { requirePermission } from "@/lib/requirePermission"
import { Flex } from "antd"
import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    page?: string
    limit?: string
  }>
}

export default async function CourseManageReviewsPage(props: PageProps) {
  await requirePermission(Permission.UPDATE_COURSE)

  const params = await props.params
  const searchParams = await props.searchParams

  const courseId = Number(params.id)
  if (!Number.isFinite(courseId) || courseId <= 0) {
    notFound()
  }

  const currentPage = Number(searchParams?.page) || 1
  const pageSize = Number(searchParams?.limit) || 10

  const [course, { reviews, totalCount }] = await Promise.all([
    getCourseById(courseId),
    getCourseReviewsForManagement({
      course_id: courseId,
      page: currentPage,
      limit: pageSize,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <PageWrapper>
      <Flex className="p-6" vertical>
        <Flex className="mb-6 flex items-center justify-between">
          <h1 className="text-gray-600 text-3xl font-bold">Manage course reviews</h1>
        </Flex>

        <Flex className="mb-4 text-gray-500 text-sm">
          Course Name: {(course as any)?.title || `Course #${courseId}`}
        </Flex>

        <ManageReviewsTable reviews={reviews} courseId={courseId} />

        <Flex className="flex justify-end my-6">
          <PageSizeSelector currentPageSize={pageSize} />
        </Flex>

        <Flex className="flex justify-center mt-2">
          <Pagination totalPages={totalPages} />
        </Flex>

        <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
          Showing {reviews.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} reviews
        </Flex>
      </Flex>
    </PageWrapper>
  )
}
