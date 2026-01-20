"use server"

import { sql } from "@/lib/database"

/**
 * Type cho User response
 */

export type Article = {
  id: string
  title: string
  article_tags: string | null
  category_name?: string | null
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
  tags: string[]
  author_id: number
  status: 'draft' | 'pending' | 'published'
  category_id?: number | null
  image_url?: string | null
}

export type UpdateArticleInput = {
  id: number
  title: string
  content: string
  tags: string[]
  category_id?: number | null
}

export async function createArticleAction(input: CreateArticleInput): Promise<{ success: boolean; message: string; articleId?: string }> {
  try {
    const { title, content, tags, author_id, status, category_id, image_url } = input

    // Only allow known statuses to avoid invalid DB values
    const normalizedStatus = status === 'draft' || status === 'pending' || status === 'published'
      ? status
      : 'draft'

    // 1. Insert article mới
    const articleResult = await sql`
      INSERT INTO articles (title, content, author_id, status, category_id, image_url, created_at, updated_at)
      VALUES (
        ${title},
        ${content},
        ${author_id},
        ${normalizedStatus},
        ${category_id ?? null},
        ${image_url ?? null},
        NOW(),
        NOW()
      )
      RETURNING id
    `
    
    const articleId = articleResult[0].id

    // 2. Insert tags vào bảng article_tags (tự tạo tag mới nếu chưa có)
    if (tags && tags.length > 0) {
      // Lấy category mặc định cho tag mới (dùng category đầu tiên chưa bị xóa)
      let defaultCategoryId: number | null = null
      const catRes = await sql`SELECT id FROM categories WHERE is_deleted = false ORDER BY id ASC LIMIT 1`
      if (catRes.length > 0) {
        defaultCategoryId = catRes[0].id
      }

      for (const tagName of tags) {
        // Nếu không có category mặc định, bỏ qua tag mới
        const tagResult = await sql`
          SELECT id FROM tags WHERE name = ${tagName} LIMIT 1
        `
        let tagId: number | null = null

        if (tagResult.length > 0) {
          tagId = tagResult[0].id
        } else if (defaultCategoryId !== null) {
          // Tạo tag mới với category mặc định
          const newTagResult = await sql`
            INSERT INTO tags (name, category_id, created_at)
            VALUES (${tagName}, ${defaultCategoryId}, NOW())
            RETURNING id
          `
          tagId = newTagResult[0].id
        }

        if (tagId !== null) {
          await sql`
            INSERT INTO article_tags (article_id, tag_id)
            VALUES (${articleId}, ${tagId})
          `
        }
      }
    }

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
  tagFilter?: string,
  categoryId?: number,
  statusFilter?: string
): Promise<Article[]> {
  const query = `%${searchQuery}%`

  const articles = await sql`
    SELECT 
      a.id, 
      a.title, 
      a.status, 
      a.updated_at,
      STRING_AGG(t.name, ', ') as article_tags,
      c.name as category_name
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    LEFT JOIN categories c ON a.category_id = c.id
    
    WHERE a.title ILIKE ${query}
      ${categoryId ? sql`AND a.category_id = ${categoryId}` : sql``}
      ${statusFilter && statusFilter !== 'All' ? sql`AND a.status = ${statusFilter}` : sql``}
    
    GROUP BY 
      a.id, a.title, a.status, a.updated_at, c.name
    ORDER BY 
      a.id ASC
  `

  // Nếu có tag filter và không phải "All Tags"
  if (tagFilter && tagFilter !== "All Tags") {
    return (articles as Article[]).filter((a: any) =>
      (a.article_tags || '').toLowerCase().includes(tagFilter.toLowerCase())
    ) as Article[]
  }

  return articles as Article[]
}

export async function getAllCategoriesAction(): Promise<{ id: number; name: string }[]> {
  const categories = await sql`
    SELECT id, name 
    FROM categories
    WHERE is_deleted = false
    ORDER BY name ASC
  `
  return categories as { id: number; name: string }[]
}

export async function deleteArticleAction(articleId: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET status = 'archived', updated_at = NOW()
      WHERE id = ${articleId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    return { success: true, message: 'Article archived successfully' }
  } catch (error: any) {
    console.error('Error archiving article:', error)
    return { success: false, message: error?.message || 'Failed to archive article' }
  }
}

export async function getArticleByIdAction(articleId: number): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const articles = await sql`
      SELECT 
        a.id,
        a.title,
        a.content,
        a.status,
        a.category_id,
        STRING_AGG(t.name, ',') as tags,
        a.created_at,
        a.updated_at
      FROM articles a
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.id = ${articleId}
      GROUP BY a.id, a.title, a.content, a.status, a.category_id, a.created_at, a.updated_at
      LIMIT 1
    `

    if (articles.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    const article = articles[0]
    const tags = article.tags ? article.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []

    return {
      success: true,
      data: {
        id: article.id,
        title: article.title,
        content: article.content,
        status: article.status,
        category_id: article.category_id,
        tags,
        created_at: article.created_at,
        updated_at: article.updated_at,
      }
    }
  } catch (error: any) {
    console.error('Error fetching article:', error)
    return { success: false, message: error?.message || 'Failed to fetch article' }
  }
}

export async function updateArticleAction(input: UpdateArticleInput): Promise<{ success: boolean; message: string }> {
  try {
    const { id, title, content, tags, category_id } = input

    // Update article
    const result = await sql`
      UPDATE articles
      SET title = ${title}, content = ${content}, category_id = ${category_id ?? null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    // Delete existing tags
    await sql`
      DELETE FROM article_tags WHERE article_id = ${id}
    `

    // Insert new tags
    if (tags && tags.length > 0) {
      let defaultCategoryId: number | null = null
      const catRes = await sql`SELECT id FROM categories WHERE is_deleted = false ORDER BY id ASC LIMIT 1`
      if (catRes.length > 0) {
        defaultCategoryId = catRes[0].id
      }

      for (const tagName of tags) {
        const tagResult = await sql`
          SELECT id FROM tags WHERE name = ${tagName} LIMIT 1
        `
        let tagId: number | null = null

        if (tagResult.length > 0) {
          tagId = tagResult[0].id
        } else if (defaultCategoryId !== null) {
          const newTagResult = await sql`
            INSERT INTO tags (name, category_id, created_at)
            VALUES (${tagName}, ${defaultCategoryId}, NOW())
            RETURNING id
          `
          tagId = newTagResult[0].id
        }

        if (tagId !== null) {
          await sql`
            INSERT INTO article_tags (article_id, tag_id)
            VALUES (${id}, ${tagId})
          `
        }
      }
    }

    return { success: true, message: 'Article updated successfully' }
  } catch (error: any) {
    console.error('Error in updateArticleAction:', error)
    return { success: false, message: error?.message || 'Failed to update article' }
  }
}
