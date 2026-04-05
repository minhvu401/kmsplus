import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"

/**
 * Quiz Detail Layout - Server-side authorization
 * Ensures only users with UPDATE_QUIZ permission can access and edit quizzes
 */
export default async function QuizDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  try {
    // Check if user has UPDATE_QUIZ permission (ability to edit quiz)
    await requirePermission(Permission.UPDATE_QUIZ)
  } catch (error) {
    // Redirect to quizzes list if permission denied
    redirect("/quizzes?error=unauthorized")
  }

  return <>{children}</>
}
