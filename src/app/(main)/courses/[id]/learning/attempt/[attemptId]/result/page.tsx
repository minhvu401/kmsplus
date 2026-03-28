import PageWrapper from '@/components/ui/questions/page-wrapper'
import { getAttemptResult, getAttemptRouteInfo } from '@/action/quiz/quizActions'
import QuizResult from '@/components/ui/quizzes/quiz-result'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

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
    redirect(`/courses/${routeInfo.course_id}/learning/attempt/${parsedAttemptId}/result`)
  }

  const result = await getAttemptResult(parsedAttemptId)

  return (
    <PageWrapper>
      <div className="mb-4">
        <Link
          href={`/courses/${parsedCourseId}/learning?itemId=${routeInfo.curriculum_item_id}`}
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
          Back to Learning
        </Link>
      </div>
      <QuizResult result={result} />
    </PageWrapper>
  )
}
