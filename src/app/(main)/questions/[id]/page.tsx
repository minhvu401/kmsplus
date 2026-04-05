// app/questions/[id]/page.tsx
// view question details & answers
import {
  getQuestionDetails,
  getAnswersForQuestion,
  fetchFilteredAnswers,
  fetchAnswerPages,
  getActiveCategories,
} from "@/action/question/questionActions"
import AnswerSection from "@/components/ui/questions/answer-section"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import QuestionDetails from "@/components/ui/questions/question-details"
import QuestionsMessage from "@/components/ui/questions/questions-message"
import { requireAuth } from "@/lib/auth"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    page?: string
    limit?: string
    returnTo?: string
    opened?: string
    closed?: string
    updated?: string
    answerCreated?: string
    answerDeleted?: string
  }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const currentPage = Number(resolvedSearchParams?.page) || 1
  const pageSize = Number(resolvedSearchParams?.limit) || 5
  const backTargetRaw = resolvedSearchParams?.returnTo
  const backTarget =
    typeof backTargetRaw === "string" && backTargetRaw.startsWith("/questions")
      ? backTargetRaw
      : "/questions"
  const user = await requireAuth()

  // Fetch question details
  const question = await getQuestionDetails(id)
  const answers = await getAnswersForQuestion(Number(id))
  const paginatedAnswers = await fetchFilteredAnswers(
    currentPage,
    Number(id),
    pageSize
  )
  const { totalItems: topLevelAnswerCount, totalPages } =
    await fetchAnswerPages(Number(id), pageSize)
  const categories = await getActiveCategories()

  if (!question) {
    return notFound()
  }

  return (
    <PageWrapper>
      <div className="mb-4">
        <Link
          href={backTarget}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Back to Q&A Forum
        </Link>
      </div>
      <QuestionsMessage scroll={false} />
      <QuestionDetails
        userId={Number(user.id)}
        question={question}
        categories={categories}
      />
      <AnswerSection
        questionId={Number(id)}
        answer_count={topLevelAnswerCount}
        is_closed={question.is_closed}
        answers={answers}
        paginatedAnswers={paginatedAnswers}
        totalPages={totalPages}
        userId={Number(user.id)}
      />
    </PageWrapper>
  )
}
