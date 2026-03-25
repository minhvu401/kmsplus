import { CreateQuestion } from "@/components/ui/questions/create-button"
import {
  getActiveCategories,
  fetchQuestionsPages,
  fetchFilteredQuestions,
  getTopKnowledgeSharers,
} from "@/action/question/questionActions"
import Pagination from "@/components/ui/questions/pagination"
import QuestionsList from "@/components/ui/questions/questions-list"
import QuestionsMessage from "@/components/ui/questions/questions-message"
import PageSizeSelector from "@/components/ui/questions/page-size-selector"
import TopKnowledgeSharers from "@/components/ui/questions/top-knowledge-sharers"
import CompactFilters from "@/components/ui/questions/compact-filters"
import { Flex, Divider } from "antd"
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
  const topSharers = await getTopKnowledgeSharers(5)

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <QuestionsMessage />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          Q&A
        </h1>
        <Flex align="center" justify="space-between" gap={24} style={{ marginBottom: 16 }}>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Create, explore, and share questions and answers with your team. Enhance your knowledge base by contributing insights and finding solutions to common challenges.
          </p>
          <CreateQuestion categories={categories} userId={Number(user.id)} isFullWidth={false} />
        </Flex>
        <Divider style={{ borderColor: "rgba(37, 99, 235, 0.15)", margin: "16px 0" }} />
      </div>

      {/* Controls Widget - White Card (Compact) */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <CompactFilters categories={categories} />
      </div>

      {/* Main Content + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Widget - White Card (2 columns on desktop) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Questions List */}
            <Flex
              style={{
                marginBottom: 24,
                width: "100%",
                minHeight: isEmpty ? undefined : "auto",
              }}
            >
              <QuestionsList questions={questions} noSearchResults={noSearchResults} />
            </Flex>

            {/* Pagination Section */}
            {!isEmpty && (
              <>
                <Divider style={{ margin: "24px 0", borderColor: "#f3f4f6" }} />
                
                <Flex justify="space-between" align="center" style={{ marginTop: 20 }}>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Showing <span style={{ fontWeight: "500" }}>{questions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                    {Math.min(currentPage * pageSize, totalItems)}</span> of <span style={{ fontWeight: "500" }}>{totalItems}</span> questions
                  </div>
                  <Pagination totalPages={totalPages} />
                </Flex>

                <Flex justify="flex-end" style={{ marginTop: 16 }}>
                  <PageSizeSelector currentPageSize={pageSize} />
                </Flex>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - Top Knowledge Sharers */}
        <div className="lg:col-span-1">
          <TopKnowledgeSharers topSharers={topSharers} />
        </div>
      </div>
    </div>
  )
}
