"use server"

import { sql } from "@/lib/neonClient"

/**
 * Type cho User response
 */

export type Article = {
  id: string
  title: string
  article_tags: string | null
  status: string
  updated_at: Date
}

export async function getAllArticlesAction(): Promise<Article[]> {
  const articles = await sql`
    SELECT a.id, title, t.name, status, updated_at 
    FROM articles a
    JOIN
  article_tags at ON a.article_id = at.article_id
JOIN
  tags t ON at.tag_id = t.tag_id;
    ORDER BY updated_at DESC
  `
  console.log("Fetched articles:", articles) // Debug log
  return articles as Article[]
}
