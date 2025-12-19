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

export type CreateArticleInput = {
  title: string
  content: string
  category: string
  author_id: number
}

export async function createArticleAction(input: CreateArticleInput): Promise<{ success: boolean; message: string; articleId?: string }> {
  try {
    const { title, content, category, author_id } = input

    // 1. Tìm tag_id từ category name
    const tagResult = await sql`
      SELECT id FROM tags WHERE name = ${category} LIMIT 1
    `
    
    if (tagResult.length === 0) {
      return { success: false, message: `Tag "${category}" not found in database` }
    }
    
    const tagId = tagResult[0].id

    // 2. Tạo slug từ title (lowercase, replace spaces với dashes)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-')          // Thay spaces bằng dashes
      .replace(/-+/g, '-')           // Loại bỏ dashes trùng
      .trim()

    // 3. Insert article mới với slug
    const articleResult = await sql`
      INSERT INTO articles (title, content, slug, author_id, status, created_at, updated_at)
      VALUES (
        ${title},
        ${content},
        ${slug},
        ${author_id},
        'published',
        NOW(),
        NOW()
      )
      RETURNING id
    `
    
    const articleId = articleResult[0].id

    // 3. Insert vào bảng article_tags (many-to-many relationship)
    await sql`
      INSERT INTO article_tags (article_id, tag_id)
      VALUES (${articleId}, ${tagId})
    `

    return { 
      success: true, 
      message: 'Article created successfully',
      articleId 
    }
  } catch (error: any) {
    console.error('Error in createArticleAction:', error)
    return { 
      success: false, 
      message: error?.message || 'Failed to create article' 
    }
  }
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
