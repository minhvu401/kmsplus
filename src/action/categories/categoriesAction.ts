"use server"

import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import {
  getAllCategoriesAction,
  getCategoryByIdAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  restoreCategoryAction,
} from "@/service/categories.service"

/**
 * Get all categories
 */
export async function getAllCategories() {
  await requirePermission(Permission.VIEW_CATEGORY_LIST)
  return getAllCategoriesAction()
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number) {
  try {
    await requirePermission(Permission.VIEW_CATEGORY_LIST)
    return await getCategoryByIdAction(id)
  } catch (error: any) {
    console.error("Error fetching category:", error)
    return {
      success: false,
      message: error?.message || "Failed to fetch category",
    }
  }
}

/**
 * Create new category
 */
export async function createCategory(formData: FormData) {
  try {
    await requirePermission(Permission.CREATE_CATEGORY)

    const name = formData.get("name") as string
    const departmentIdRaw = formData.get("department_id") as string | null
    const department_id = departmentIdRaw ? parseInt(departmentIdRaw, 10) : null

    if (!name) {
      return {
        success: false,
        message: "Category name is required",
      }
    }

    const result = await createCategoryAction({
      name,
      department_id,
    })

    return result
  } catch (error: any) {
    console.error("Error in createCategory action:", error)
    return {
      success: false,
      message: error?.message || "Failed to create category",
    }
  }
}

/**
 * Update category
 */
export async function updateCategory(formData: FormData) {
  try {
    await requirePermission(Permission.UPDATE_CATEGORY)

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const departmentIdRaw = formData.get("department_id") as string | null
    const department_id = departmentIdRaw ? parseInt(departmentIdRaw, 10) : null

    if (!id || !name) {
      return {
        success: false,
        message: "Category ID and name are required",
      }
    }

    const result = await updateCategoryAction({
      id: parseInt(id),
      name,
      department_id,
    })

    return result
  } catch (error: any) {
    console.error("Error in updateCategory action:", error)
    return {
      success: false,
      message: error?.message || "Failed to update category",
    }
  }
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategory(id: number) {
  await requirePermission(Permission.DELETE_CATEGORY)
  return deleteCategoryAction(id)
}

/**
 * Restore deleted category
 */
export async function restoreCategory(id: number) {
  await requirePermission(Permission.DELETE_CATEGORY)
  return restoreCategoryAction(id)
}
