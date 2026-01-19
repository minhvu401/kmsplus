// app/questions/[id]/page.tsx
// view question details & answers
import {
  getQuestionDetails,
  getAnswersForQuestion,
  fetchFilteredAnswers,
  getActiveCategories,
} from "@/action/question/questionActions"
import AnswerSection from "@/components/ui/questions/answer-section"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import QuestionDetails from "@/components/ui/questions/question-details"
import { QuestionDetailsNotification } from "@/components/ui/questions/questions-notification"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    sort?: string
    page?: string
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
  const user = await requireAuth()

  // Fetch question details
  const question = await getQuestionDetails(id)
  const answers = await getAnswersForQuestion(Number(id))
  const paginatedAnswers = await fetchFilteredAnswers(currentPage, Number(id))
  const categories = await getActiveCategories()

  if (!question) {
    return notFound()
  }

  return (
    <PageWrapper>
      <QuestionDetailsNotification
        id={id}
        key={`${id}-${resolvedSearchParams?.closed}-${resolvedSearchParams?.opened}-${resolvedSearchParams?.updated}-${resolvedSearchParams?.answerCreated}-${resolvedSearchParams?.answerDeleted}`}
      />
      <QuestionDetails userId={Number(user.id)} question={question} categories={categories} />
      <AnswerSection
        questionId={Number(id)}
        answer_count={question.answer_count}
        is_closed={question.is_closed}
        answers={answers}
        paginatedAnswers={paginatedAnswers}
      />
    </PageWrapper>
  )
}
