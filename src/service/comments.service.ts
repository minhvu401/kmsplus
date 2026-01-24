"use server"

import { sql } from "@/lib/database"

export type Comment = {
  id: string
  article_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: Date
  updated_at: Date
  user_name: string
  user_email: string
}

export async function getCommentsByArticleId(articleId: number): Promise<Comment[]> {
  try {
    const comments = await sql`
      SELECT 
        c.id,
        c.article_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.full_name as user_name,
        u.email as user_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ${articleId}
        AND c.deleted_at IS NULL
      ORDER BY c.created_at DESC
    `
    return comments as Comment[]
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return []
  }
}

export async function createCommentAction(input: {
  article_id: number
  user_id: number
  content: string
  parent_id?: number | null
}): Promise<{ success: boolean; message: string; commentId?: string }> {
  try {
    const { article_id, user_id, content, parent_id } = input

    const result = await sql`
      INSERT INTO comments (article_id, user_id, content, parent_id)
      VALUES (${article_id}, ${user_id}, ${content}, ${parent_id || null})
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Failed to create comment' }
    }

    return {
      success: true,
      message: 'Comment created successfully',
      commentId: result[0].id,
    }
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return { success: false, message: error?.message || 'Failed to create comment' }
  }
}

export async function updateCommentAction(input: {
  id: number
  content: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const { id, content } = input

    const result = await sql`
      UPDATE comments
      SET content = ${content}, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Comment not found or already deleted' }
    }

    return { success: true, message: 'Comment updated successfully' }
  } catch (error: any) {
    console.error('Error updating comment:', error)
    return { success: false, message: error?.message || 'Failed to update comment' }
  }
}

export async function deleteCommentAction(commentId: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE comments
      SET deleted_at = NOW()
      WHERE id = ${commentId} AND deleted_at IS NULL
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Comment not found or already deleted' }
    }

    return { success: true, message: 'Comment deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting comment:', error)
    return { success: false, message: error?.message || 'Failed to delete comment' }
  }
}
