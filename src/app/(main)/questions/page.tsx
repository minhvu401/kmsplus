import PageWrapper from "@/components/ui/questions/page-wrapper"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import {
  FilterCategory,
  FilterStatus,
  SortBy,
} from "@/components/ui/questions/filters"
import {
  getActiveCategories,
  fetchQuestionsPages,
  fetchFilteredQuestions,
} from "@/action/question/questionActions"
import Pagination from "@/components/ui/questions/pagination"
import QuestionsList from "@/components/ui/questions/questions-list"
import QuestionsNotification from "@/components/ui/questions/questions-notification"
import PageSizeSelector from "@/components/ui/questions/page-size-selector"
import { Flex } from "antd"
import { requireAuth } from "@/lib/auth"

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string
    page?: string
    limit?: string
    category?: string
    status?: string
    sort?: string
  }>
}) {
  const user = await requireAuth()
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""
  const category = searchParams?.category || "any"
  const status = searchParams?.status || "any"
  const sort = searchParams?.sort || "newest"
  const currentPage = Number(searchParams?.page) || 1
  const pageSize = Number(searchParams?.limit) || 10
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
  
  const noSearchResults = query !== "" && questions.length === 0
  const isEmpty = questions.length === 0
  const categories = await getActiveCategories()

  return (
    <PageWrapper>
      <QuestionsNotification />

      <Flex align="center" gap={28} style={{ marginBottom: 24 }}>
        <Search placeholder="Search questions..." />
        <CreateQuestion categories={categories} userId={Number(user.id)} />
      </Flex>

      <Flex align="center" gap={56} style={{ marginBottom: 24, width: "100%" }}>
        <FilterCategory categories={categories} />
        <FilterStatus />
        <SortBy />
      </Flex>

      <Flex
        style={{
          marginBottom: 24,
          width: "100%",
          minHeight: isEmpty ? undefined : "60vh",
        }}
      >
        <QuestionsList questions={questions} noSearchResults={noSearchResults} />
      </Flex>

      <Flex className="flex justify-end my-6">
        <PageSizeSelector currentPageSize={pageSize} />
      </Flex>

      <Flex className="flex justify-center mt-8">
        <Pagination totalPages={totalPages} />
      </Flex>

      <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
        Showing {questions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} questions
      </Flex>
    </PageWrapper>
  )
}
