"use server"
import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"
import * as service from "@/service/questionbank.service"

export async function getQuestions(
  page: number = 1,
  limit: number = 10,
  filters?: service.GetQuestionsFilters
) {
  // await requireAuth()
  return service.getQuestionsAction(page, limit, filters)
}

export async function getQuestionsByCategory(categoryId: number) {
  console.log(
    "🟦 [getQuestionsByCategory] Fetching questions for categoryId:",
    categoryId
  )
  // await requireAuth()
  const questionsData = await service.getQuestionsByCategoryAction(categoryId)
  console.log(
    "🟦 [getQuestionsByCategory] Questions returned:",
    questionsData?.length || 0,
    "questions"
  )
  return questionsData
}

export async function getAllQuestions() {
  // await requireAuth()
  return service.getAllQuestionsAction()
}

export async function getCategories() {
  // await requireAuth()
  return service.getCategoriesAction()
}

export async function getCategoriesForQuestionModal() {
  try {
    const user = await requireAuth()
    if (!user?.id) return []

    const userId = parseInt(user.id, 10)
    if (!Number.isFinite(userId)) return []

    const check = await sql`
      SELECT
        u.department_id as user_dept,
        EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${userId}
            AND (
              LOWER(r.name) LIKE '%system admin%'
              OR LOWER(r.name) LIKE '%admin%'
            )
        ) as is_system_admin
      FROM users u
      WHERE u.id = ${userId}
      LIMIT 1
    `

    if (check.length === 0) return []
    const { user_dept, is_system_admin } = check[0] as {
      user_dept: number | null
      is_system_admin: boolean
    }

    if (is_system_admin) {
      const allCategories = await sql`
        SELECT id, name
        FROM categories
        WHERE (is_deleted = false OR is_deleted IS NULL)
          AND id <> 1
        ORDER BY name ASC
      `
      return allCategories.map((c: any) => ({ id: Number(c.id), name: c.name }))
    }

    if (!user_dept) {
      return []
    }

    const departmentCategories = await sql`
      SELECT id, name
      FROM categories
      WHERE (is_deleted = false OR is_deleted IS NULL)
        AND department_id = ${user_dept}
      ORDER BY name ASC
    `

    return departmentCategories.map((c: any) => ({
      id: Number(c.id),
      name: c.name,
    }))
  } catch (error) {
    console.error("Failed to get question modal categories:", error)
    return []
  }
}

export async function getQuestionBankViewerContext() {
  try {
    const user = await requireAuth()
    if (!user?.id) {
      return { currentUserId: null, isSystemAdmin: false }
    }

    const userId = parseInt(user.id, 10)
    if (!Number.isFinite(userId)) {
      return { currentUserId: null, isSystemAdmin: false }
    }

    const roleCheck = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId}
          AND (
            LOWER(r.name) LIKE '%system admin%'
            OR LOWER(r.name) LIKE '%admin%'
          )
      ) as is_system_admin
    `

    return {
      currentUserId: userId,
      isSystemAdmin: Boolean(roleCheck?.[0]?.is_system_admin),
    }
  } catch (error) {
    console.error("Failed to get question bank viewer context:", error)
    return { currentUserId: null, isSystemAdmin: false }
  }
}

export async function createQuestion(questionData: any) {
  const user = await requireAuth()
  const creatorId = parseInt(user.id, 10)

  if (!Number.isFinite(creatorId)) {
    throw new Error("Invalid authenticated user")
  }

  return service.createQuestionAction({ ...questionData, creatorId })
}

export async function getQuestionById(id: string) {
  // await requireAuth()
  return service.getQuestionByIdAction(id)
}

export async function updateQuestionAction(id: string, questionData: any) {
  // await requireAuth()
  return service.updateQuestionAction(id, questionData)
}

export async function deleteQuestion(id: string) {
  // await requireAuth()
  return service.deleteQuestionAction(id)
}
