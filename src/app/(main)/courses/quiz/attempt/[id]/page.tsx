import { getAttemptRouteInfo } from "@/action/quiz/quizActions"
import { redirect, notFound } from "next/navigation"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const attemptId = Number((await params).id)

  if (!Number.isInteger(attemptId)) {
    notFound()
  }

  let attemptRoute
  try {
    attemptRoute = await getAttemptRouteInfo(attemptId)
  } catch (error) {
    notFound()
  }

  redirect(`/courses/${attemptRoute.course_id}/learning/attempt/${attemptId}`)
}
