import Pagination from "@/components/ui/questions/pagination"
import PageSizeSelector from "@/components/ui/questions/page-size-selector"
import ManageQuestionsTable from "@/components/ui/questions/manage-questions"
import {
  fetchFilteredQuestions,
  fetchQuestionsPages,
} from "@/action/question/questionActions"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import { getActiveCategories } from "@/action/question/questionActions"
import { Flex } from "antd"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import QuestionsNotification from "@/components/ui/questions/questions-notification"

export default async function QuestionsManagePage(props: {
  searchParams?: Promise<{
    page?: string
    limit?: string
    query?: string
    category?: string
    status?: string
    sort?: string
  }>
}) {
  const user = await requirePermission(Permission.UPDATE_QUESTION)

  const searchParams = await props.searchParams
  const currentPage = Number(searchParams?.page) || 1
  const pageSize = Number(searchParams?.limit) || 10
  const query = searchParams?.query || ""
  const category = searchParams?.category || "any"
  const status = searchParams?.status || "any"
  const sort = searchParams?.sort || "newest"
  const categories = await getActiveCategories()

  const { totalItems, totalPages } = await fetchQuestionsPages(
    query,
    category,
    status,
    pageSize
  )

  const questions = await fetchFilteredQuestions(
    query,
    category,
    status,
    sort,
    currentPage,
    pageSize
  )

  return (
    <PageWrapper>
      <Flex className="p-6" vertical>
        <QuestionsNotification />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
            Q&amp;A Management
          </h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Manage and organize forum questions
          </p>
        </div>

        <Flex align="center" gap={28} style={{ marginBottom: 24 }}>
          <Search placeholder="Search questions..." />
          <CreateQuestion
            categories={categories}
            userId={Number(user.id)}
            returnTo="/questions/manage"
          />
        </Flex>

        {/* Table */}
        <ManageQuestionsTable questions={questions} categories={categories} />

        {/* Page Size Selector */}
        <Flex className="flex justify-end my-6">
          <PageSizeSelector currentPageSize={pageSize} />
        </Flex>

        {/* Pagination */}
        <Flex className="flex justify-center mt-8">
          <Pagination totalPages={totalPages} />
        </Flex>

        {/* Info */}
        <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
          Showing {questions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
          questions
        </Flex>
      </Flex>
    </PageWrapper>
  )
}
