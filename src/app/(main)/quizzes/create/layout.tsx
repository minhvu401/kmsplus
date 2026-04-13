import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"

/**
 * Create Quiz Layout - Server-side authorization
 * Ensures only users with CREATE_QUIZ permission can access /quizzes/create
 */
export default async function CreateQuizLayout({
  children,
}: {
  children: ReactNode
}) {
  try {
    // Check if user has CREATE_QUIZ permission
    await requirePermission(Permission.CREATE_QUIZ)
  } catch (error) {
    // Redirect to quizzes list if permission denied
    redirect("/quizzes?error=unauthorized")
  }

  return <>{children}</>
}
