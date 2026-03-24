import QuizForm from '@/components/forms/quiz-form'
import PageWrapper from '@/components/ui/questions/page-wrapper'
import {
  getQuestionsForAttempt,
  getTimeLimitForAttempt,
  getSavedAnswers,
  getAttemptMeta,
  getAttemptRouteInfo,
} from '@/action/quiz/quizActions'
import { notFound, redirect } from 'next/navigation'

const normalizeSelectedOptionId = (value: unknown): string | string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String)
      if (typeof parsed === 'string') return parsed
      return String(parsed)
    } catch {
      return value
    }
  }
  if (value == null) return ''
  return String(value)
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

  const routeInfo = await getAttemptRouteInfo(parsedAttemptId)
  if (routeInfo.course_id !== parsedCourseId) {
    redirect(`/courses/${routeInfo.course_id}/learning/attempt/${parsedAttemptId}`)
  }

  const [questions, timeLimit, savedAnswers, attemptMeta] = await Promise.all([
    getQuestionsForAttempt(parsedAttemptId),
    getTimeLimitForAttempt(parsedAttemptId),
    getSavedAnswers(parsedAttemptId),
    getAttemptMeta(parsedAttemptId),
  ])

  const initialAnswers = Object.fromEntries(
    savedAnswers.map((a) => [
      a.question_id,
      normalizeSelectedOptionId(a.selected_option_id),
    ])
  )

  return (
    <PageWrapper>
      <QuizForm
        attemptId={parsedAttemptId}
        courseId={parsedCourseId}
        attemptNumber={attemptMeta.attempt_number}
        questions={questions}
        durationSeconds={timeLimit ? timeLimit * 60 : null}
        initialAnswers={initialAnswers}
      />
    </PageWrapper>
  )
}
