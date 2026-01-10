// List questions in Q&A Forum
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
} from "@/action/question/questionActions"
import Pagination from "@/components/ui/questions/pagination"

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string
    page?: string
    category?: string
    status?: string
    sort?: string
  }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""
  const category = searchParams?.category || "any"
  const status = searchParams?.status || "any"
  const sort = searchParams?.sort || "newest"
  const currentPage = Number(searchParams?.page) || 1
  const totalPages = await fetchQuestionsPages(query, category, status)

  const categories = await getActiveCategories()

  return (
    <PageWrapper>

      <QuestionsNotification />

      <Flex align="center" gap={28} style={{ marginBottom: 24 }}>
        <Search placeholder="Search questions..." />
        <CreateQuestion />
      </Flex>

      <Flex align="center" gap={56} style={{ marginBottom: 24 }}>
        <FilterCategory categories={categories} />
        <FilterStatus />
        <QuestionsSortBy />
      </Flex>

      <div style={{ marginBottom: 24 }}>
        <QuestionsList questions={questions} noSearchResults={noSearchResults} />
      </div>
      <div className="flex justify-end items-center gap-14 mb-6">
        <Pagination totalPages={totalPages} />
      </div>
    </PageWrapper>
  );
}
