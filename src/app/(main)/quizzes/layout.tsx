import { ReactNode } from "react"

/**
 * Quiz Layout - Main wrapper
 * Authorization checks are handled by child layouts (create/, [id]/)
 */
export default async function QuizzesLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
