import PageWrapper from '@/components/ui/questions/page-wrapper'
import { getAttemptResult, getAttemptRouteInfo } from '@/action/quiz/quizActions'
import QuizResult from '@/components/ui/quizzes/quiz-result'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from 'antd'

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
      <QuizResult result={result} />
      <div className="mt-8 flex justify-center">
        <Link href={`/courses/${parsedCourseId}/learning?itemId=${routeInfo.curriculum_item_id}`}>
          <Button type="primary" size="large">
            Back to Learning
          </Button>
        </Link>
      </div>
    </PageWrapper>
  )
}
