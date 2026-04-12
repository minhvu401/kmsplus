import QuizForm from "@/components/forms/quiz-form"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import {
  getQuestionsForAttempt,
  getTimeLimitForAttempt,
  getSavedAnswers,
  getAttemptMeta,
  getAttemptRouteInfo,
} from "@/action/quiz/quizActions"
import { notFound, redirect } from "next/navigation"

const normalizeSelectedOptionId = (value: unknown): number | number[] => {
  if (Array.isArray(value)) {
    const normalized = value.map((item) => Number(item)).filter(Number.isFinite)
    return normalized.length <= 1 ? (normalized[0] ?? -1) : normalized
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return normalizeSelectedOptionId(parsed)
    } catch {
      const asNumber = Number(value)
      return Number.isFinite(asNumber) ? asNumber : -1
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) return value
  return -1
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  const { id, attemptId } = await params
  const parsedCourseId = Number(id)
  const parsedAttemptId = Number(attemptId)

  if (!Number.isInteger(parsedCourseId) || !Number.isInteger(parsedAttemptId)) {
    notFound()
  }

  let routeInfo
  try {
    routeInfo = await getAttemptRouteInfo(parsedAttemptId)
  } catch (error) {
    notFound()
  }

  if (routeInfo.course_id !== parsedCourseId) {
    redirect(
      `/courses/${routeInfo.course_id}/learning/attempt/${parsedAttemptId}`
    )
  }

  let questions, timeLimit, savedAnswers, attemptMeta
  try {
    ;[questions, timeLimit, savedAnswers, attemptMeta] = await Promise.all([
      getQuestionsForAttempt(parsedAttemptId),
      getTimeLimitForAttempt(parsedAttemptId),
      getSavedAnswers(parsedAttemptId),
      getAttemptMeta(parsedAttemptId),
    ])
  } catch (error) {
    notFound()
  }

  const initialAnswers = Object.fromEntries(
    savedAnswers.map((a) => [
      a.question_id,
      normalizeSelectedOptionId(a.selected_option_id),
    ]).filter(([, selected]) => {
      if (typeof selected === "number") return selected >= 0
      return selected.length > 0
    })
  )

  return (
    <PageWrapper>
      <QuizForm
        attemptId={parsedAttemptId}
        courseId={parsedCourseId}
        attemptNumber={attemptMeta.attempt_number}
        questions={questions}
        durationSeconds={timeLimit}
        initialAnswers={initialAnswers}
      />
    </PageWrapper>
  )
}
