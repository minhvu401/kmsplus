"use server"

import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"
import { getAllArticlesAction, filterByTagAction, getAllTagsAction, createArticleAction, deleteArticleAction, getAllCategoriesAction, getArticleByIdAction, updateArticleAction, restoreArticleAction, approveArticleAction, rejectArticleAction, resubmitArticleAction, updateArticlesStatusConstraint, getTopAuthorsAction, getPublishedArticlesAction } from "@/service/articles.service"

export async function setupArticlesConstraint() {
  await requireAuth()
  return updateArticlesStatusConstraint()
}

export async function getAllArticles() {
  await requireAuth()
  return getAllArticlesAction()
}

export async function getAllTags() {
  await requireAuth()
  return getAllTagsAction()
}

export async function filterByTag(searchQuery: string, tagFilter?: string) {
  await requireAuth()
  return filterByTagAction(searchQuery, tagFilter)
}

export async function filterByTagAndCategory(
  searchQuery: string,
  tagFilter?: string,
  categoryId?: number,
  statusFilter?: string,
  isDeletedFilter?: boolean | 'all',
  sortOrder: 'newest' | 'oldest' = 'newest',
  page: number = 1,
  pageSize: number = 12,
) {
  const currentUser = await requireAuth()
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null

  let managedDepartmentId: number | null = null
  if (currentUserId && Number.isFinite(currentUserId)) {
    const deptRows = await sql`
      SELECT id
      FROM department
      WHERE head_of_department_id = ${currentUserId}
        AND is_deleted = FALSE
      LIMIT 1
    `

    managedDepartmentId = deptRows.length > 0 ? Number(deptRows[0].id) : null
  }

  const result = await filterByTagAction(
    searchQuery,
    tagFilter,
    categoryId,
    statusFilter,
    isDeletedFilter,
    sortOrder,
    page,
    pageSize,
    {
      currentUserId,
      managedDepartmentId,
    }
  )

  return {
    ...result,
    currentUserId,
    isHeadOfDepartmentView: managedDepartmentId !== null,
  }
}

export async function deleteArticle(id: number) {
  await requireAuth()
  return deleteArticleAction(id)
}

export async function restoreArticle(id: number) {
  await requireAuth()
  return restoreArticleAction(id)
}

export async function approveArticle(id: number) {
  const currentUser = await requireAuth()
  return approveArticleAction(id, Number(currentUser.id))
}

export async function rejectArticle(id: number) {
  const currentUser = await requireAuth()
  return rejectArticleAction(id, '', Number(currentUser.id))
}

export async function resubmitArticle(
  id: number,
  title: string,
  content: string,
  tags?: string[],
  category_id?: number | null,
  image_url?: string | null,
  thumbnail_url?: string | null
) {
  await requireAuth()
  return resubmitArticleAction(id, title, content, tags, category_id, image_url, thumbnail_url)
}

export async function getAllCategories() {
  await requireAuth()
  return getAllCategoriesAction()
}

export async function createArticle(formData: FormData) {
  try {
    // Lấy thông tin user hiện tại (đã authenticated)
    const currentUser = await requireAuth()
    console.log('Current user:', currentUser)
    
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const status = ((formData.get('status') as string) || 'draft') as 'draft' | 'pending' | 'published'
    const tags = formData.get('tags') as string
    const categoryIdRaw = formData.get('category_id') as string | null
    const category_id = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null
    const image_url = (formData.get('image_url') as string) || null
    const thumbnail_url = (formData.get('thumbnail_url') as string) || null

    console.log('Form data:', { title, content, status, tags, category_id, image_url, thumbnail_url })

    // Validate input
    if (!title || !content) {
      return { 
        success: false, 
        message: 'Title and content are required' 
      }
    }

    // Cast author_id sang số (bigint trong database)
    const authorId = parseInt(currentUser.id, 10)
    console.log('Author ID:', authorId)

    // Parse tags from JSON string
    let parsedTags: string[] = []
    if (tags) {
      try {
        parsedTags = JSON.parse(tags)
      } catch (e) {
        console.error('Error parsing tags:', e)
      }
    }

    // Gọi service layer để thực hiện SQL queries
    const result = await createArticleAction({
      title,
      content,
      tags: parsedTags,
      author_id: authorId,
      status,
      category_id,
      image_url,
      thumbnail_url
    })

    console.log('Create article result:', result)
    return result

  } catch (error: any) {
    console.error('Error in createArticle action:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail
    })
    return { 
      success: false, 
      message: `Error: ${error?.message || 'Failed to create article'}` 
    }
  }
}

export async function getArticleById(id: number) {
  try {
    await requireAuth()
    return await getArticleByIdAction(id)
  } catch (error: any) {
    console.error('Error fetching article:', error)
    return { 
      success: false, 
      message: error?.message || 'Failed to fetch article' 
    }
  }
}

export async function updateArticle(formData: FormData) {
  try {
    await requireAuth()
    
    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const tags = formData.get('tags') as string
    const categoryIdRaw = formData.get('category_id') as string | null
    const category_id = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null
    const image_url = (formData.get('image_url') as string) || null
    const thumbnail_url = (formData.get('thumbnail_url') as string) || null

    if (!title || !content) {
      return { 
        success: false, 
        message: 'Title and content are required' 
      }
    }

    let parsedTags: string[] = []
    if (tags) {
      try {
        parsedTags = JSON.parse(tags)
      } catch (e) {
        console.error('Error parsing tags:', e)
      }
    }

    const result = await updateArticleAction({
      id: parseInt(id),
      title,
      content,
      tags: parsedTags,
      category_id,
      image_url,
      thumbnail_url
    })

    return result
  } catch (error: any) {
    console.error('Error in updateArticle action:', error)
    return { 
      success: false, 
      message: error?.message || 'Failed to update article' 
    }
  }
}

export async function getTopAuthors(limit: number = 5) {
  try {
    await requireAuth()
    return await getTopAuthorsAction(limit)
  } catch (error: any) {
    console.error('Error fetching top authors:', error)
    return []
  }
}

export async function getPublishedArticles(params: {
  searchQuery?: string
  selectedTags?: string[]
  categoryId?: number | null
  sortOrder?: 'newest' | 'oldest'
  page?: number
  pageSize?: number
}) {
  await requireAuth()
  return getPublishedArticlesAction(params)
}
