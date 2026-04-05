"use server"

import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { sql } from "@/lib/database"
import {
  getAllArticlesAction,
  filterByTagAction,
  getAllTagsAction,
  createArticleAction,
  deleteArticleAction,
  getAllCategoriesAction,
  getArticleByIdAction,
  updateArticleAction,
  restoreArticleAction,
  approveArticleAction,
  rejectArticleAction,
  resubmitArticleAction,
  updateArticlesStatusConstraint,
  getTopAuthorsAction,
  getPublishedArticlesAction,
} from "@/service/articles.service"

export type CurrentUserInfo = {
  id: number
  email: string
  full_name: string
  avatar_url?: string
  department_id?: number | null
  status: string
  roles: string[]
  isAdmin: boolean
}

/**
 * Lấy thông tin user hiện tại với department_id và roles
 */
export async function getCurrentUserDetail(): Promise<CurrentUserInfo | null> {
  try {
    const authUser = await requireAuth()

    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.avatar_url,
        u.status,
        u.department_id,
        ARRAY_AGG(DISTINCT r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ${Number(authUser.id)} AND u.status = 'active'
      GROUP BY u.id, u.email, u.full_name, u.avatar_url, u.status, u.department_id
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0] as any
    const isAdmin =
      (user.roles || []).includes("admin") ||
      (user.roles || []).includes("Admin")

    return {
      id: Number(user.id),
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      department_id: user.department_id,
      status: user.status,
      roles: user.roles || [],
      isAdmin,
    }
  } catch (error: any) {
    console.error("Error getting current user detail:", error)
    return null
  }
}

export async function setupArticlesConstraint() {
  await requireAuth()
  return updateArticlesStatusConstraint()
}

export async function getAllArticles() {
  await requirePermission(Permission.VIEW_ARTICLE_LIST)
  return getAllArticlesAction()
}

export async function getAllTags() {
  await requireAuth()
  return getAllTagsAction()
}

export async function filterByTag(searchQuery: string, tagFilters?: string[]) {
  await requirePermission(Permission.SEARCH_ARTICLE)
  return filterByTagAction(searchQuery, tagFilters)
}

export async function filterByTagAndCategory(
  searchQuery: string,
  tagFilters?: string[],
  categoryId?: number,
  statusFilter?: string,
  isDeletedFilter?: boolean | "all",
  sortOrder: "newest" | "oldest" = "newest",
  page: number = 1,
  pageSize: number = 12
) {
  const currentUser = await getCurrentUserDetail()
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null
  const isAdmin = !!currentUser?.isAdmin

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
    tagFilters,
    categoryId,
    statusFilter,
    isDeletedFilter,
    sortOrder,
    page,
    pageSize,
    {
      currentUserId,
      managedDepartmentId,
    },
    currentUserId ?? undefined,
    isAdmin
  )

  return {
    ...result,
    currentUserId,
    isHeadOfDepartmentView: managedDepartmentId !== null,
  }
}

export async function deleteArticle(id: number) {
  await requirePermission(Permission.DELETE_ARTICLE)
  return deleteArticleAction(id)
}

export async function restoreArticle(id: number) {
  await requirePermission(Permission.DELETE_ARTICLE)
  return restoreArticleAction(id)
}

export async function approveArticle(id: number) {
  await requirePermission(Permission.APPROVE_ARTICLE)
  const currentUser = await requireAuth()
  return approveArticleAction(id, Number(currentUser.id))
}

export async function rejectArticle(id: number, reason: string = "") {
  await requirePermission(Permission.APPROVE_ARTICLE)
  const currentUser = await requireAuth()
  return rejectArticleAction(id, reason, Number(currentUser.id))
}

export async function resubmitArticle(
  id: number,
  title: string,
  content: string,
  tags?: string[],
  category_id?: number | null,
  department_id?: number | null,
  image_url?: string | null,
  thumbnail_url?: string | null
) {
  await requirePermission(Permission.UPDATE_ARTICLE)
  return resubmitArticleAction(
    id,
    title,
    content,
    tags,
    category_id,
    department_id,
    image_url,
    thumbnail_url
  )
}

export async function getAllCategories() {
  await requireAuth()
  return getAllCategoriesAction()
}

export async function createArticle(formData: FormData) {
  try {
    await requirePermission(Permission.CREATE_ARTICLE)
    const currentUser = await getCurrentUserDetail()
    if (!currentUser) {
      return {
        success: false,
        message: "Authentication required",
      }
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const status = ((formData.get("status") as string) || "draft") as
      | "draft"
      | "pending"
      | "published"
    const tags = formData.get("tags") as string
    const categoryIdRaw = formData.get("category_id") as string | null
    const category_id = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null
    const image_url = (formData.get("image_url") as string) || null
    const thumbnail_url = (formData.get("thumbnail_url") as string) || null

    // Validate input
    if (!title || !content) {
      return {
        success: false,
        message: "Title and content are required",
      }
    }

    // Cast author_id sang số (bigint trong database)
    const authorId = currentUser.id

    if (category_id !== null && !currentUser.isAdmin) {
      const categoryRows = await sql`
        SELECT department_id
        FROM categories
        WHERE id = ${category_id} AND is_deleted = false
        LIMIT 1
      `

      if (categoryRows.length === 0) {
        return {
          success: false,
          message: "Category not found",
        }
      }

      const categoryDepartmentId = categoryRows[0].department_id ?? null
      if (categoryDepartmentId !== (currentUser.department_id ?? null)) {
        return {
          success: false,
          message: "You can only use categories in your department",
        }
      }
    }

    // Parse tags from JSON string
    let parsedTags: string[] = []
    if (tags) {
      try {
        parsedTags = JSON.parse(tags)
      } catch (e) {
        console.error("Error parsing tags:", e)
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
      thumbnail_url,
    })

    return result
  } catch (error: any) {
    console.error("Error in createArticle action:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    })
    return {
      success: false,
      message: `Error: ${error?.message || "Failed to create article"}`,
    }
  }
}

export async function getArticleById(id: number) {
  try {
    await requirePermission(Permission.READ_ARTICLE)
    return await getArticleByIdAction(id)
  } catch (error: any) {
    console.error("Error fetching article:", error)
    return {
      success: false,
      message: error?.message || "Failed to fetch article",
    }
  }
}

export async function updateArticle(formData: FormData) {
  try {
    await requirePermission(Permission.UPDATE_ARTICLE)
    const currentUser = await getCurrentUserDetail()
    if (!currentUser) {
      return {
        success: false,
        message: "Authentication required",
      }
    }

    const id = formData.get("id") as string
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const tags = formData.get("tags") as string
    const categoryIdRaw = formData.get("category_id") as string | null
    const category_id = categoryIdRaw ? parseInt(categoryIdRaw, 10) : null
    const image_url = (formData.get("image_url") as string) || null
    const thumbnail_url = (formData.get("thumbnail_url") as string) || null

    if (!title || !content) {
      return {
        success: false,
        message: "Title and content are required",
      }
    }

    let parsedTags: string[] = []
    if (tags) {
      try {
        parsedTags = JSON.parse(tags)
      } catch (e) {
        console.error("Error parsing tags:", e)
      }
    }

    const articleRows = await sql`
      SELECT author_id
      FROM articles
      WHERE id = ${parseInt(id, 10)}
      LIMIT 1
    `

    if (articleRows.length === 0) {
      return {
        success: false,
        message: "Article not found",
      }
    }

    if (
      !currentUser.isAdmin &&
      Number(articleRows[0].author_id) !== currentUser.id
    ) {
      return {
        success: false,
        message: "You can only edit your own articles",
      }
    }

    if (category_id !== null && !currentUser.isAdmin) {
      const categoryRows = await sql`
        SELECT department_id
        FROM categories
        WHERE id = ${category_id} AND is_deleted = false
        LIMIT 1
      `

      if (categoryRows.length === 0) {
        return {
          success: false,
          message: "Category not found",
        }
      }

      const categoryDepartmentId = categoryRows[0].department_id ?? null
      if (categoryDepartmentId !== (currentUser.department_id ?? null)) {
        return {
          success: false,
          message: "You can only use categories in your department",
        }
      }
    }

    const result = await updateArticleAction({
      id: parseInt(id),
      title,
      content,
      tags: parsedTags,
      category_id,
      image_url,
      thumbnail_url,
    })

    return result
  } catch (error: any) {
    console.error("Error in updateArticle action:", error)
    return {
      success: false,
      message: error?.message || "Failed to update article",
    }
  }
}

export async function getTopAuthors(limit: number = 5) {
  try {
    await requireAuth()
    return await getTopAuthorsAction(limit)
  } catch (error: any) {
    console.error("Error fetching top authors:", error)
    return []
  }
}

export async function getPublishedArticles(params: {
  searchQuery?: string
  selectedTags?: string[]
  categoryId?: number | null
  sortOrder?: "newest" | "oldest"
  page?: number
  pageSize?: number
}) {
  await requireAuth()
  return getPublishedArticlesAction(params)
}
