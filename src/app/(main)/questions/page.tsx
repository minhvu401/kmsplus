import {
  getActiveCategories,
  fetchQuestionsPages,
  fetchFilteredQuestions,
  getTopKnowledgeSharers,
} from "@/action/question/questionActions"
import QuestionsMessage from "@/components/ui/questions/questions-message"
import { requireAuth } from "@/lib/auth"
import QuestionsPageContent from "./QuestionsPageContent"

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
  const topSharers = await getTopKnowledgeSharers(5)

  return (
    <>
      <QuestionsMessage />

      <QuestionsPageContent
        categories={categories}
        userId={Number(user.id)}
        questions={questions}
        noSearchResults={noSearchResults}
        isEmpty={isEmpty}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        topSharers={topSharers}
      />
    </>
  )
}
