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
import { Role } from "@/enum/role.enum"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import QuestionBackLink from "./QuestionBackLink"

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
  const isSystemAdmin = user.role === Role.ADMIN

  // Fetch question details
  const question = await getQuestionDetails(id)
  const answers = await getAnswersForQuestion(Number(id))
  const paginatedAnswers = await fetchFilteredAnswers(
    currentPage,
    Number(id),
    pageSize
  )
  const { totalAnswerItems, totalPages } = await fetchAnswerPages(
    Number(id),
    pageSize
  )
  const categories = await getActiveCategories()

  if (!question) {
    return notFound()
  }

  return (
    <>
      <div className="pl-4 pt-2 pb-3">
        <QuestionBackLink backTarget={backTarget} />
      </div>
      <PageWrapper>
        <QuestionsMessage scroll={false} />
        <QuestionDetails
          userId={Number(user.id)}
          isSystemAdmin={isSystemAdmin}
          question={question}
          categories={categories}
        />
        <AnswerSection
          questionId={Number(id)}
          answer_count={totalAnswerItems}
          is_closed={question.is_closed}
          answers={answers}
          paginatedAnswers={paginatedAnswers}
          totalPages={totalPages}
          userId={Number(user.id)}
          isSystemAdmin={isSystemAdmin}
        />
      </PageWrapper>
    </>
  )
}
