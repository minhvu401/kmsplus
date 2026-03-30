"use server"

import { sql } from "@/lib/database"

const VIETNAM_NOW = sql`TIMEZONE('Asia/Ho_Chi_Minh', NOW())`

/**
 * Type cho User response
 */

export type Article = {
  id: string
  author_id?: number
  title: string
  content?: string
  article_tags: string | null
  category_id?: number | null
  category_name?: string | null
  department_id?: number | null
  department_name?: string | null
  author_name?: string | null
  approver_name?: string | null
  status: string
  approved_by?: number | null
  approved_at?: Date | null
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
  is_deleted: boolean
  image_url?: string | null
  thumbnail_url?: string | null
  comment_count?: number
}

export type Tag = {
  id: string
  name: string
}

export type PaginatedArticlesResult = {
  data: Article[]
  total: number
}

export type PublishedArticlesQuery = {
  searchQuery?: string
  selectedTags?: string[]
  categoryId?: number | null
  sortOrder?: 'newest' | 'oldest'
  page?: number
  pageSize?: number
}

export type CreateArticleInput = {
  title: string
  content: string
  tags: string[]
  author_id: number
  status: 'draft' | 'pending' | 'published'
  category_id?: number | null
  department_id?: number | null
  image_url?: string | null
  thumbnail_url?: string | null
}

export type UpdateArticleInput = {
  id: number
  title: string
  content: string
  tags: string[]
  category_id?: number | null
  department_id?: number | null
  image_url?: string | null
  thumbnail_url?: string | null
}

async function createArticleStatusNotification(params: {
  userId: number
  articleId: number
  articleTitle: string
  articleContent: string
  thumbnailUrl?: string | null
  type: 'article_approved' | 'article_rejected'
  reason?: string
}) {
  const {
    userId,
    articleId,
    articleTitle,
    articleContent,
    thumbnailUrl,
    type,
    reason,
  } = params

  const notificationTitle =
    type === 'article_approved'
      ? `Article approved: ${articleTitle}`
      : `Article rejected: ${articleTitle}`

  const baseContent =
    type === 'article_approved'
      ? `Your article "${articleTitle}" has been approved and published.`
      : `Your article "${articleTitle}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`

  const maxContentLength = 400
  const trimmedArticleContent = (articleContent || '').replace(/\s+/g, ' ').trim()
  const articlePreview = trimmedArticleContent
    ? ` Preview: ${trimmedArticleContent.slice(0, maxContentLength)}${trimmedArticleContent.length > maxContentLength ? '...' : ''}`
    : ''

  try {
    await sql`
      INSERT INTO notifications (
        user_id,
        title,
        content,
        thumbnail_url,
        type,
        redirect_url,
        is_read,
        created_at
      )
      VALUES (
        ${userId},
        ${notificationTitle},
        ${`${baseContent}${articlePreview}`},
        ${thumbnailUrl ?? null},
        ${type},
        ${`/articles/${articleId}`},
        FALSE,
        ${VIETNAM_NOW}
      )
    `
  } catch (error: any) {
    console.error('Error creating article status notification:', error)
  }
}

export async function createArticleAction(input: CreateArticleInput): Promise<{ success: boolean; message: string; articleId?: string }> {
  try {
    const { title, content, tags, author_id, status, category_id, image_url, thumbnail_url } = input

    // Only allow known statuses to avoid invalid DB values
    const normalizedStatus = status === 'draft' || status === 'pending' || status === 'published'
      ? status
      : 'draft'

    // 1. Insert article mới
    const shouldSetApproval = normalizedStatus === 'published'
    const articleResult = await sql`
      INSERT INTO articles (title, content, author_id, status, category_id, image_url, thumbnail_url, approved_by, approved_at, created_at, updated_at)
      VALUES (
        ${title},
        ${content},
        ${author_id},
        ${normalizedStatus},
        ${category_id ?? null},
        ${image_url ?? null},
        ${thumbnail_url ?? null},
        ${shouldSetApproval ? author_id : null},
        ${shouldSetApproval ? VIETNAM_NOW : null},
        ${VIETNAM_NOW},
        ${VIETNAM_NOW}
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
      a.author_id,
      a.title, 
      a.content,
      a.status, 
      a.approved_by,
      a.approved_at,
      a.deleted_at,
      a.created_at,
      a.updated_at,
      a.is_deleted,
      a.image_url,
      a.thumbnail_url,
      a.category_id,
      c.department_id,
      STRING_AGG(t.name, ', ') as article_tags,
      c.name as category_name,
      d.name as department_name,
      u.full_name as author_name,
      ua.full_name as approver_name
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN department d ON c.department_id = d.id
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN users ua ON a.approved_by = ua.id
    GROUP BY a.id, a.author_id, a.title, a.content, a.status, a.approved_by, a.approved_at, a.deleted_at, a.created_at, a.updated_at, a.is_deleted, a.image_url, a.thumbnail_url, c.name, u.full_name, ua.full_name
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
  isDeletedFilter?: boolean | 'all',
  sortOrder: 'newest' | 'oldest' = 'newest',
  page: number = 1,
  pageSize: number = 12,
  accessContext?: {
    currentUserId?: number | null
    managedDepartmentId?: number | null
  },
  userId?: number,
  isAdmin: boolean = false,
): Promise<PaginatedArticlesResult> {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 12
  const offset = (normalizedPage - 1) * normalizedPageSize
  const query = `%${searchQuery}%`
  const managedDepartmentId = accessContext?.managedDepartmentId ?? null
  const permissionCondition =
    managedDepartmentId !== null
      ? sql`AND a.author_id IN (
          SELECT u.id
          FROM users u
          WHERE u.department_id = ${managedDepartmentId}
        )`
      : sql``
  const hodNonDraftCondition =
    managedDepartmentId !== null ? sql`AND a.status <> 'draft'` : sql``

  const articles = await sql`
    SELECT 
      a.id, 
      a.author_id,
      a.title, 
      a.status, 
      a.approved_by,
      a.approved_at,
      a.deleted_at,
      a.created_at,
      a.updated_at,
      a.is_deleted,
      a.image_url,
      a.thumbnail_url,
      a.category_id,
      c.department_id,
      STRING_AGG(t.name, ', ') as article_tags,
      c.name as category_name,
      d.name as department_name,
      u.full_name as author_name,
      ua.full_name as approver_name
    FROM articles a
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN department d ON c.department_id = d.id
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN users ua ON a.approved_by = ua.id
    
    WHERE a.title ILIKE ${query}
      ${permissionCondition}
      ${hodNonDraftCondition}
      ${categoryId ? sql`AND a.category_id = ${categoryId}` : sql``}
      ${statusFilter && statusFilter !== 'All' ? sql`AND a.status = ${statusFilter}` : sql``}
      ${isDeletedFilter === true ? sql`AND a.is_deleted = TRUE` : isDeletedFilter === false ? sql`AND a.is_deleted = FALSE` : sql``}
      ${tagFilter && tagFilter !== 'All Tags'
        ? sql`AND EXISTS (
            SELECT 1
            FROM article_tags at_filter
            JOIN tags t_filter ON t_filter.id = at_filter.tag_id
            WHERE at_filter.article_id = a.id
              AND LOWER(t_filter.name) = LOWER(${tagFilter})
          )`
        : sql``}
      ${!isAdmin ? sql`AND a.author_id = ${userId ?? -1}` : sql``}
    
    GROUP BY 
      a.id, a.author_id, a.title, a.status, a.approved_by, a.approved_at, a.deleted_at, a.created_at, a.updated_at, a.is_deleted, a.image_url, a.thumbnail_url, c.name, u.full_name, ua.full_name
    ORDER BY
      COALESCE(a.approved_at, a.created_at) ${sortOrder === 'oldest' ? sql`ASC` : sql`DESC`},
      a.id DESC
    LIMIT ${normalizedPageSize}
    OFFSET ${offset}
  `

  const totalRows = await sql`
    SELECT COUNT(*)::INT AS total
    FROM articles a
    WHERE a.title ILIKE ${query}
      ${permissionCondition}
      ${hodNonDraftCondition}
      ${categoryId ? sql`AND a.category_id = ${categoryId}` : sql``}
      ${statusFilter && statusFilter !== 'All' ? sql`AND a.status = ${statusFilter}` : sql``}
      ${isDeletedFilter === true ? sql`AND a.is_deleted = TRUE` : isDeletedFilter === false ? sql`AND a.is_deleted = FALSE` : sql``}
      ${tagFilter && tagFilter !== 'All Tags'
        ? sql`AND EXISTS (
            SELECT 1
            FROM article_tags at_filter
            JOIN tags t_filter ON t_filter.id = at_filter.tag_id
            WHERE at_filter.article_id = a.id
              AND LOWER(t_filter.name) = LOWER(${tagFilter})
          )`
        : sql``}
      ${!isAdmin ? sql`AND a.author_id = ${userId ?? -1}` : sql``}
  `

  return {
    data: articles as Article[],
    total: totalRows[0]?.total || 0,
  }
}

export async function getAllCategoriesAction(): Promise<{ id: number; name: string; department_id?: number | null; department_name?: string | null }[]> {
  const categories = await sql`
    SELECT 
      c.id, 
      c.name,
      c.department_id,
      d.name as department_name
    FROM public.categories c
    LEFT JOIN public.department d ON c.department_id = d.id
    WHERE c.is_deleted = false
    ORDER BY d.name ASC NULLS LAST, c.name ASC
  `
  return categories as { id: number; name: string; department_id?: number | null; department_name?: string | null }[]
}

export async function getPublishedArticlesAction(
  params: PublishedArticlesQuery
): Promise<PaginatedArticlesResult> {
  const {
    searchQuery = '',
    selectedTags = [],
    categoryId,
    sortOrder = 'newest',
    page = 1,
    pageSize = 10,
  } = params

  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10
  const offset = (normalizedPage - 1) * normalizedPageSize
  const query = `%${searchQuery.trim()}%`
  const normalizedTags = selectedTags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  const selectedTagsCount = normalizedTags.length

  const articles = await sql`
    WITH filtered_ids AS (
      SELECT
        a.id,
        COALESCE(a.approved_at, a.created_at) AS sort_time
      FROM articles a
      LEFT JOIN article_tags at_filter ON at_filter.article_id = a.id
      LEFT JOIN tags t_filter ON t_filter.id = at_filter.tag_id
      WHERE a.is_deleted = FALSE
        AND a.status = 'published'
        AND (
          a.title ILIKE ${query}
          OR COALESCE(a.content, '') ILIKE ${query}
        )
        ${categoryId ? sql`AND a.category_id = ${categoryId}` : sql``}
      GROUP BY a.id, COALESCE(a.approved_at, a.created_at)
      ${selectedTagsCount > 0
        ? sql`HAVING COUNT(DISTINCT CASE WHEN LOWER(t_filter.name) = ANY(${normalizedTags}) THEN LOWER(t_filter.name) END) = ${selectedTagsCount}`
        : sql``}
      ORDER BY sort_time ${sortOrder === 'oldest' ? sql`ASC` : sql`DESC`}, a.id DESC
      LIMIT ${normalizedPageSize}
      OFFSET ${offset}
    )
    SELECT
      a.id,
      a.title,
      a.content,
      a.status,
      a.approved_by,
      a.approved_at,
      a.deleted_at,
      a.created_at,
      a.updated_at,
      a.is_deleted,
      a.image_url,
      a.thumbnail_url,
      STRING_AGG(DISTINCT t.name, ', ') AS article_tags,
      c.name AS category_name,
      u.full_name AS author_name,
      ua.full_name AS approver_name,
      COALESCE(cc.comment_count, 0)::INT AS comment_count,
      fi.sort_time
    FROM filtered_ids fi
    JOIN articles a ON a.id = fi.id
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tags t ON at.tag_id = t.id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN users ua ON a.approved_by = ua.id
    LEFT JOIN (
      SELECT article_id, COUNT(*)::INT AS comment_count
      FROM comments
      WHERE deleted_at IS NULL
      GROUP BY article_id
    ) cc ON cc.article_id = a.id
    GROUP BY
      a.id,
      a.title,
      a.content,
      a.status,
      a.approved_by,
      a.approved_at,
      a.deleted_at,
      a.created_at,
      a.updated_at,
      a.is_deleted,
      a.image_url,
      a.thumbnail_url,
      c.name,
      u.full_name,
      ua.full_name,
      cc.comment_count,
      fi.sort_time
    ORDER BY fi.sort_time ${sortOrder === 'oldest' ? sql`ASC` : sql`DESC`}, a.id DESC
  `

  const totalRows = await sql`
    SELECT COUNT(*)::INT AS total
    FROM (
      SELECT a.id
      FROM articles a
      LEFT JOIN article_tags at_filter ON at_filter.article_id = a.id
      LEFT JOIN tags t_filter ON t_filter.id = at_filter.tag_id
      WHERE a.is_deleted = FALSE
        AND a.status = 'published'
        AND (
          a.title ILIKE ${query}
          OR COALESCE(a.content, '') ILIKE ${query}
        )
        ${categoryId ? sql`AND a.category_id = ${categoryId}` : sql``}
      GROUP BY a.id
      ${selectedTagsCount > 0
        ? sql`HAVING COUNT(DISTINCT CASE WHEN LOWER(t_filter.name) = ANY(${normalizedTags}) THEN LOWER(t_filter.name) END) = ${selectedTagsCount}`
        : sql``}
    ) base
  `

  return {
    data: articles as Article[],
    total: totalRows[0]?.total || 0,
  }
}

export async function deleteArticleAction(articleId: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET is_deleted = TRUE, deleted_at = ${VIETNAM_NOW}, updated_at = ${VIETNAM_NOW}
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
      SET is_deleted = FALSE, deleted_at = NULL, updated_at = ${VIETNAM_NOW}
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

export async function approveArticleAction(
  articleId: number,
  actorUserId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET
        status = 'published',
        approved_by = ${actorUserId ?? null},
        approved_at = ${VIETNAM_NOW},
        updated_at = ${VIETNAM_NOW}
      WHERE id = ${articleId}
      RETURNING id, author_id, title, content, thumbnail_url, image_url
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    const updatedArticle = result[0]
    await createArticleStatusNotification({
      userId: Number(updatedArticle.author_id),
      articleId: Number(updatedArticle.id),
      articleTitle: updatedArticle.title || 'Untitled article',
      articleContent: updatedArticle.content || '',
      thumbnailUrl: updatedArticle.thumbnail_url || updatedArticle.image_url || null,
      type: 'article_approved',
    })

    if (actorUserId && actorUserId !== Number(updatedArticle.author_id)) {
      await createArticleStatusNotification({
        userId: actorUserId,
        articleId: Number(updatedArticle.id),
        articleTitle: updatedArticle.title || 'Untitled article',
        articleContent: updatedArticle.content || '',
        thumbnailUrl: updatedArticle.thumbnail_url || updatedArticle.image_url || null,
        type: 'article_approved',
      })
    }

    return { success: true, message: 'Article approved successfully' }
  } catch (error: any) {
    console.error('Error approving article:', error)
    return { success: false, message: error?.message || 'Failed to approve article' }
  }
}

export async function rejectArticleAction(
  articleId: number,
  reason: string = '',
  actorUserId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE articles
      SET
        status = 'rejected',
        reason = ${reason},
        approved_by = NULL,
        approved_at = NULL,
        updated_at = ${VIETNAM_NOW}
      WHERE id = ${articleId}
      RETURNING id, author_id, title, content, thumbnail_url, image_url
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    const updatedArticle = result[0]
    await createArticleStatusNotification({
      userId: Number(updatedArticle.author_id),
      articleId: Number(updatedArticle.id),
      articleTitle: updatedArticle.title || 'Untitled article',
      articleContent: updatedArticle.content || '',
      thumbnailUrl: updatedArticle.thumbnail_url || updatedArticle.image_url || null,
      type: 'article_rejected',
      reason,
    })

    if (actorUserId && actorUserId !== Number(updatedArticle.author_id)) {
      await createArticleStatusNotification({
        userId: actorUserId,
        articleId: Number(updatedArticle.id),
        articleTitle: updatedArticle.title || 'Untitled article',
        articleContent: updatedArticle.content || '',
        thumbnailUrl: updatedArticle.thumbnail_url || updatedArticle.image_url || null,
        type: 'article_rejected',
        reason,
      })
    }

    return { success: true, message: 'Article rejected successfully' }
  } catch (error: any) {
    console.error('Error rejecting article:', error)
    return { success: false, message: error?.message || 'Failed to reject article' }
  }
}

export async function resubmitArticleAction(
  articleId: number,
  title: string,
  content: string,
  tags?: string[],
  category_id?: number | null,
    department_id?: number | null,
  image_url?: string | null,
  thumbnail_url?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Update article with new content and reset status back to pending
    const result = await sql`
      UPDATE articles
      SET 
        title = ${title},
        content = ${content},
        status = 'pending',
        reason = null,
        approved_by = NULL,
        approved_at = NULL,
        category_id = ${category_id ?? null},
        image_url = ${image_url ?? null},
        thumbnail_url = ${thumbnail_url ?? null},
        updated_at = ${VIETNAM_NOW}
      WHERE id = ${articleId}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Article not found' }
    }

    // Delete existing tags
    await sql`
      DELETE FROM article_tags WHERE article_id = ${articleId}
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
            VALUES (${articleId}, ${tagId})
          `
        }
      }
    }

    return { success: true, message: 'Article resubmitted successfully' }
  } catch (error: any) {
    console.error('Error resubmitting article:', error)
    return { success: false, message: error?.message || 'Failed to resubmit article' }
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
        a.approved_by,
        a.approved_at,
        a.deleted_at,
        a.reason,
        a.category_id,
        c.department_id,
        a.author_id,
        a.image_url,
        a.thumbnail_url,
        STRING_AGG(t.name, ',') as tags,
        a.created_at,
        a.updated_at,
        c.name as category_name,
        d.name as department_name,
        u.full_name as author_name,
        u.email as author_email,
        ua.full_name as approver_name
      FROM articles a
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN department d ON c.department_id = d.id
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN users ua ON a.approved_by = ua.id
      WHERE a.id = ${articleId}
      GROUP BY a.id, a.title, a.content, a.status, a.approved_by, a.approved_at, a.deleted_at, a.reason, a.category_id, c.department_id, a.author_id, a.image_url, a.thumbnail_url, a.created_at, a.updated_at, c.name, d.name, u.full_name, u.email, ua.full_name
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
        approved_by: article.approved_by,
        approved_at: article.approved_at,
        deleted_at: article.deleted_at,
        reason: article.reason,
        category_id: article.category_id,
        department_id: article.department_id,
        author_id: article.author_id,
        category_name: article.category_name,
        department_name: article.department_name,
        author_name: article.author_name,
        author_email: article.author_email,
        approver_name: article.approver_name,
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
        updated_at = ${VIETNAM_NOW}
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

export type TopAuthor = {
  id: string
  name: string
  articleCount: number
}

/**
 * Get top authors by published article count
 */
export async function getTopAuthorsAction(limit: number = 5): Promise<TopAuthor[]> {
  try {
    const result = await sql`
      SELECT 
        u.id,
        COALESCE(u.full_name, u.email, 'Anonymous') as name,
        COUNT(a.id) as article_count
      FROM articles a
      RIGHT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published' AND a.is_deleted = false
      GROUP BY u.id, u.full_name, u.email
      ORDER BY COUNT(a.id) DESC
      LIMIT ${limit}
    `
    
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      articleCount: parseInt(row.article_count, 10),
    }))
  } catch (error: any) {
    console.error('Error fetching top authors:', error)
    return []
  }
}
