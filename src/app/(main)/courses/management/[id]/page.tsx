import {
  getCourseById,
  getCourseManagementAccess,
} from "@/action/courses/courseAction"
import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CourseManagementByIdPage({ params }: PageProps) {
  const { id } = await params
  const courseId = Number(id)

  if (!Number.isFinite(courseId) || courseId <= 0) {
    redirect("/courses/management?flash=course-not-found")
  }

  const access = await getCourseManagementAccess(courseId)
  if (!access.allowed) {
    const target = access.redirectTo || "/courses/management"
    const flash = access.flash ? `?flash=${access.flash}` : ""
    redirect(`${target}${flash}`)
  }

  const course = await getCourseById(courseId)
  if (!course) {
    redirect("/courses/management?flash=course-not-found")
  }

  redirect(`/courses/management/${courseId}/enrollments`)
}
