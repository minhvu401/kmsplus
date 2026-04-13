"use server"

import { sql } from "@/lib/database"

export type SiteCounts = {
  questions: number
  answers: number
  comments: number
  courses: number
}

export async function getSiteCountsAction(): Promise<SiteCounts> {
  try {
    const rows = await sql`
      SELECT
        (SELECT COUNT(*) FROM questions WHERE deleted_at IS NULL) AS questions,
        (SELECT COUNT(*) FROM answers WHERE deleted_at IS NULL) AS answers,
        (SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL) AS comments
    `

    const r: any = rows[0] || { questions: 0, answers: 0, comments: 0, courses: 0 }
    return {
      questions: Number(r.questions ?? 0),
      answers: Number(r.answers ?? 0),
      comments: Number(r.comments ?? 0),
      courses: Number(r.courses ?? 0),
    }
  } catch (error) {
    console.error("Error fetching site counts:", error)
    return { questions: 0, answers: 0, comments: 0, courses: 0 }
  }
}

export async function getUserCountsAction(userId: string | number): Promise<SiteCounts> {
  try {
    const rows = await sql`
      SELECT
        (SELECT COUNT(*) FROM questions WHERE deleted_at IS NULL AND user_id = ${userId}) AS questions,
        (SELECT COUNT(*) FROM answers WHERE deleted_at IS NULL AND user_id = ${userId}) AS answers,
        (SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL AND user_id = ${userId}) AS comments,
        (SELECT COUNT(DISTINCT e.course_id)
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.user_id = ${userId}
           AND c.status = 'published'
           AND c.deleted_at IS NULL
        ) AS courses
    `

    const r: any = rows[0] || { questions: 0, answers: 0, comments: 0, courses: 0 }
    return {
      questions: Number(r.questions ?? 0),
      answers: Number(r.answers ?? 0),
      comments: Number(r.comments ?? 0),
      courses: Number(r.courses ?? 0),
    }
  } catch (error) {
    console.error("Error fetching user counts:", error)
    return { questions: 0, answers: 0, comments: 0, courses: 0 }
  }
}
