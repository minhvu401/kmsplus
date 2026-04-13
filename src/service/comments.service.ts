"use server"

import { sql } from "@/lib/database"
import { emitUserNotification } from "@/lib/notification-realtime"

const VIETNAM_NOW = sql`TIMEZONE('Asia/Ho_Chi_Minh', NOW())`

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
  user_avatar_url?: string | null
}

export async function getCommentsByArticleId(
  articleId: number
): Promise<Comment[]> {
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
        u.email as user_email,
        u.avatar_url as user_avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ${articleId}
        AND c.deleted_at IS NULL
      ORDER BY c.created_at DESC
    `
    return comments as Comment[]
  } catch (error: any) {
    console.error("Error fetching comments:", error)
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
      INSERT INTO comments (article_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (${article_id}, ${user_id}, ${content}, ${parent_id || null}, ${VIETNAM_NOW}, ${VIETNAM_NOW})
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: "Failed to create comment" }
    }

    const commentId = String(result[0].id)

    try {
      const articleResult = await sql`
        SELECT id, title, author_id, thumbnail_url
        FROM articles
        WHERE id = ${article_id}
        LIMIT 1
      `

      if (articleResult.length > 0) {
        const article = articleResult[0]
        const articleAuthorId = Number(article.author_id)

        if (articleAuthorId && articleAuthorId !== user_id) {
          const commenterResult = await sql`
            SELECT full_name
            FROM users
            WHERE id = ${user_id}
            LIMIT 1
          `

          const commenterName = commenterResult[0]?.full_name || "Có người"

          const unreadCountResult = await sql`
            SELECT COUNT(*)::INT AS total
            FROM notifications
            WHERE user_id = ${articleAuthorId}
              AND type = 'article_comment'
              AND article_id = ${article_id}
              AND is_read = FALSE
          `

          const unreadCommentsForArticle =
            (unreadCountResult[0]?.total || 0) + 1
          const normalizedComment = content.replace(/\s+/g, " ").trim()
          const commentPreview =
            normalizedComment.length > 120
              ? `${normalizedComment.slice(0, 120)}...`
              : normalizedComment

          await sql`
            INSERT INTO notifications (
              user_id,
              title,
              content,
              thumbnail_url,
              type,
              redirect_url,
              is_read,
              created_at,
              article_id,
              comment_id,
              course_id
            )
            VALUES (
              ${articleAuthorId},
              ${`Bài viết "${article.title}" có bình luận mới`},
              ${`${commenterName} vừa bình luận: "${commentPreview}". Hiện có ${unreadCommentsForArticle} bình luận mới chưa đọc cho bài viết này.`},
              ${article.thumbnail_url ?? null},
              ${"article_comment"},
              ${`/articles/${article_id}#comment-${commentId}`},
              ${false},
              ${VIETNAM_NOW},
              ${article_id},
              ${parseInt(commentId)},
              ${null}
            )
          `

          emitUserNotification({
            type: "notification_created",
            userId: articleAuthorId,
            notificationType: "article_comment",
            articleId: article_id,
            commentId,
            createdAt: new Date().toISOString(),
          })
        }
      }
    } catch (notificationError: any) {
      console.error("Error creating comment notification:", notificationError)
    }

    return {
      success: true,
      message: "Comment created successfully",
      commentId,
    }
  } catch (error: any) {
    console.error("Error creating comment:", error)
    return {
      success: false,
      message: error?.message || "Failed to create comment",
    }
  }
}

export async function updateCommentAction(input: {
  id: number
  user_id: number
  content: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const { id, user_id, content } = input

    // Check if comment exists and belongs to user
    const commentCheck = await sql`
      SELECT user_id FROM comments WHERE id = ${id} AND deleted_at IS NULL
    `

    if (commentCheck.length === 0) {
      return { success: false, message: "Comment not found or already deleted" }
    }

    const comment = commentCheck[0]
    if (comment.user_id !== user_id) {
      return {
        success: false,
        message: "You don't have permission to edit this comment",
      }
    }

    const result = await sql`
      UPDATE comments
      SET content = ${content}, updated_at = ${VIETNAM_NOW}
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: "Comment not found or already deleted" }
    }

    return { success: true, message: "Comment updated successfully" }
  } catch (error: any) {
    console.error("Error updating comment:", error)
    return {
      success: false,
      message: error?.message || "Failed to update comment",
    }
  }
}

export async function deleteCommentAction(
  commentId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if comment exists and belongs to user
    const commentCheck = await sql`
      SELECT user_id FROM comments WHERE id = ${commentId} AND deleted_at IS NULL
    `

    if (commentCheck.length === 0) {
      return { success: false, message: "Comment not found" }
    }

    const comment = commentCheck[0]
    if (comment.user_id !== userId) {
      return {
        success: false,
        message: "You don't have permission to delete this comment",
      }
    }

    const result = await sql`
      UPDATE comments
      SET deleted_at = ${VIETNAM_NOW}
      WHERE id = ${commentId} AND deleted_at IS NULL
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: "Comment not found" }
    }

    return { success: true, message: "Comment deleted successfully" }
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return {
      success: false,
      message: error?.message || "Failed to delete comment",
    }
  }
}
