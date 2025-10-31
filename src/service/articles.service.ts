"use server"

import { sql } from "@/lib/database"

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

export type Tag = {
  id: string
  name: string
}

export async function getAllArticlesAction(): Promise<Article[]> {
  const articles = await sql`
    SELECT a.id, title, t.name as article_tags, status, updated_at 
    FROM articles a
    inner JOIN article_tags at ON a.id = at.article_id
    inner JOIN tags t ON at.tag_id = t.id
    ORDER BY updated_at DESC
  `
  console.log("Fetched articles:", articles) // Debug log
  return articles as Article[]
}

export async function getAllTagsAction(): Promise<Tag[]> {
  const tags = await sql`
    SELECT id, name 
    FROM tags
    ORDER BY name ASC
  `
  return tags as Tag[]
}

export async function filterByTagAction(
  searchQuery: string,
  tagFilter?: string
): Promise<Article[]> {
  const query = `%${searchQuery}%`

  // Nếu có tag filter và không phải "All Tags"
  if (tagFilter && tagFilter !== "All Tags") {
    const articles = await sql`
      SELECT 
        a.id, 
        a.title, 
        a.status, 
        a.updated_at,
        STRING_AGG(t.name, ', ') as article_tags
      FROM articles a
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      
      WHERE a.title ILIKE ${query}
      
      GROUP BY 
        a.id, a.title, a.status, a.updated_at
      
      -- Filter theo tag sau khi GROUP BY
      HAVING STRING_AGG(t.name, ', ') ILIKE ${`%${tagFilter}%`}
      
      ORDER BY 
        a.id ASC
    `
    return articles as Article[]
  }

  // Không có tag filter hoặc "All Tags"
  const articles = await sql`
    SELECT 
      a.id, 
      a.title, 
      a.status, 
      a.updated_at,
      STRING_AGG(t.name, ', ') as article_tags
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    
    WHERE a.title ILIKE ${query} 
    
    GROUP BY 
      a.id, a.title, a.status, a.updated_at
    ORDER BY 
      a.id ASC
  `

  return articles as Article[]
}
