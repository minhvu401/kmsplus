"use server"

import { sql } from "@/lib/database"

/**
 * Type cho User response
 */

export type Article = {
  id: string
  title: string
  content?: string
  article_tags: string | null
  category_name?: string | null
  author_name?: string | null
  status: string
  updated_at: Date
  is_deleted: boolean
  image_url?: string | null
  thumbnail_url?: string | null
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
  thumbnail_url?: string | null
}

export type UpdateArticleInput = {
  id: number
  title: string
  content: string
  tags: string[]
  category_id?: number | null
  image_url?: string | null
  thumbnail_url?: string | null
}

export async function createArticleAction(input: CreateArticleInput): Promise<{ success: boolean; message: string; articleId?: string }> {
  try {
    const { title, content, tags, author_id, status, category_id, image_url, thumbnail_url } = input

    // Only allow known statuses to avoid invalid DB values
    const normalizedStatus = status === 'draft' || status === 'pending' || status === 'published'
      ? status
      : 'draft'

    // 1. Insert article mới
    const articleResult = await sql`
      INSERT INTO articles (title, content, author_id, status, category_id, image_url, thumbnail_url, created_at, updated_at)
      VALUES (
        ${title},
        ${content},
        ${author_id},
        ${normalizedStatus},
        ${category_id ?? null},
        ${image_url ?? null},
        ${thumbnail_url ?? null},
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
    SELECT 
      a.id, 
      a.title, 
      a.content,
      a.status, 
      a.updated_at,
      a.is_deleted,
      a.image_url,
      a.thumbnail_url,
      STRING_AGG(t.name, ', ') as article_tags,
      c.name as category_name,
      u.full_name as author_name
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    GROUP BY a.id, a.title, a.content, a.status, a.updated_at, a.is_deleted, a.image_url, a.thumbnail_url, c.name, u.full_name
    ORDER BY a.updated_at DESC
  `
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
  statusFilter?: string,
  isDeletedFilter?: boolean | 'all'
): Promise<Article[]> {
  const query = `%${searchQuery}%`

  const articles = await sql`
    SELECT 
      a.id, 
      a.title, 
      a.status, 
      a.updated_at,
      a.is_deleted,
      a.image_url,
      a.thumbnail_url,
      STRING_AGG(t.name, ', ') as article_tags,
      c.name as category_name,
      u.full_name as author_name
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    
    WHERE a.title ILIKE ${query}
      ${categoryId ? sql`AND a.category_id = ${categoryId}` : sql``}
      ${statusFilter && statusFilter !== 'All' ? sql`AND a.status = ${statusFilter}` : sql``}
      ${isDeletedFilter === true ? sql`AND a.is_deleted = TRUE` : isDeletedFilter === false ? sql`AND a.is_deleted = FALSE` : sql``}
    
    GROUP BY 
      a.id, a.title, a.status, a.updated_at, a.is_deleted, a.image_url, a.thumbnail_url, c.name, u.full_name
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
      SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${articleId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    return { success: true, message: 'Article deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting article:', error)
    return { success: false, message: error?.message || 'Failed to delete article' }
  }
}

export async function restoreArticleAction(articleId: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW()
      WHERE id = ${articleId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    return { success: true, message: 'Article restored successfully' }
  } catch (error: any) {
    console.error('Error restoring article:', error)
    return { success: false, message: error?.message || 'Failed to restore article' }
  }
}

export async function approveArticleAction(articleId: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET status = 'published', updated_at = NOW()
      WHERE id = ${articleId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    return { success: true, message: 'Article approved successfully' }
  } catch (error: any) {
    console.error('Error approving article:', error)
    return { success: false, message: error?.message || 'Failed to approve article' }
  }
}

export async function rejectArticleAction(articleId: number, reason: string = ''): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET status = 'rejected', reason = ${reason}, updated_at = NOW()
      WHERE id = ${articleId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    return { success: true, message: 'Article rejected successfully' }
  } catch (error: any) {
    console.error('Error rejecting article:', error)
    return { success: false, message: error?.message || 'Failed to reject article' }
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
        a.reason,
        a.category_id,
        a.author_id,
        a.image_url,
        a.thumbnail_url,
        STRING_AGG(t.name, ',') as tags,
        a.created_at,
        a.updated_at,
        u.full_name as author_name,
        u.email as author_email
      FROM articles a
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ${articleId}
      GROUP BY a.id, a.title, a.content, a.status, a.reason, a.category_id, a.author_id, a.image_url, a.thumbnail_url, a.created_at, a.updated_at, u.full_name, u.email
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
        reason: article.reason,
        category_id: article.category_id,
        author_id: article.author_id,
        author_name: article.author_name,
        author_email: article.author_email,
        image_url: article.image_url,
        thumbnail_url: article.thumbnail_url,
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
    const { id, title, content, tags, category_id, image_url, thumbnail_url } = input

    // Update article
    const result = await sql`
      UPDATE articles
      SET 
        title = ${title}, 
        content = ${content}, 
        category_id = ${category_id ?? null},
        image_url = ${image_url ?? null},
        thumbnail_url = ${thumbnail_url ?? null},
        updated_at = NOW()
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

/**
 * Update articles table constraint to allow 'rejected' status
 * This function modifies the CHECK constraint on the status column
 */
export async function updateArticlesStatusConstraint(): Promise<{ success: boolean; message: string }> {
  try {
    // Drop existing constraint
    await sql`
      ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check
    `
    
    // Add new constraint with 'rejected' status
    await sql`
      ALTER TABLE articles ADD CONSTRAINT articles_status_check CHECK (status IN ('draft', 'pending', 'published', 'rejected'))
    `
    
    return { success: true, message: 'Articles status constraint updated successfully' }
  } catch (error: any) {
    console.error('Error updating articles status constraint:', error)
    return { success: false, message: error?.message || 'Failed to update constraint' }
  }
}
