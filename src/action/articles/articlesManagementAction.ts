"use server"

import { requireAuth } from "@/lib/auth"
import { getAllArticlesAction, filterByTagAction, getAllTagsAction, createArticleAction } from "@/service/articles.service"

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

export async function createArticle(formData: FormData) {
  try {
    // Lấy thông tin user hiện tại (đã authenticated)
    const currentUser = await requireAuth()
    console.log('Current user:', currentUser)
    
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string

    console.log('Form data:', { title, content, category })

    // Validate input
    if (!title || !content || !category) {
      return { 
        success: false, 
        message: 'All fields are required' 
      }
    }

    // Cast author_id sang số (bigint trong database)
    const authorId = parseInt(currentUser.id, 10)
    console.log('Author ID:', authorId)

    // Gọi service layer để thực hiện SQL queries
    const result = await createArticleAction({
      title,
      content,
      category,
      author_id: authorId
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
