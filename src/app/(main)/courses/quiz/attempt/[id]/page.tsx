import { getAttemptRouteInfo } from '@/action/quiz/quizActions';
import { redirect } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const attemptId = Number((await params).id);

  if (!Number.isInteger(attemptId)) {
    throw new Error('Invalid attempt ID');
  }

  const attemptRoute = await getAttemptRouteInfo(attemptId)
  redirect(`/courses/${attemptRoute.course_id}/learning/attempt/${attemptId}`)
}
