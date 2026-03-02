"use server"

import { requireAuth } from "@/lib/auth"
import { 
  getAllCategoriesAction, 
  getCategoryByIdAction, 
  createCategoryAction, 
  updateCategoryAction, 
  deleteCategoryAction,
  restoreCategoryAction
} from "@/service/categories.service"

/**
 * Get all categories
 */
export async function getAllCategories() {
  await requireAuth()
  return getAllCategoriesAction()
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number) {
  try {
    await requireAuth()
    return await getCategoryByIdAction(id)
  } catch (error: any) {
    console.error('Error fetching category:', error)
    return { 
      success: false, 
      message: error?.message || 'Failed to fetch category' 
    }
  }
}

/**
 * Create new category
 */
export async function createCategory(formData: FormData) {
  try {
    await requireAuth()
    
    const name = formData.get('name') as string
    const parentIdRaw = formData.get('parent_id') as string | null
    const parent_id = parentIdRaw ? parseInt(parentIdRaw, 10) : null

    if (!name) {
      return { 
        success: false, 
        message: 'Category name is required' 
      }
    }

    const result = await createCategoryAction({
      name,
      parent_id,
    })

    return result
  } catch (error: any) {
    console.error('Error in createCategory action:', error)
    return { 
      success: false, 
      message: error?.message || 'Failed to create category' 
    }
  }
}

/**
 * Update category
 */
export async function updateCategory(formData: FormData) {
  try {
    await requireAuth()
    
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const parentIdRaw = formData.get('parent_id') as string | null
    const parent_id = parentIdRaw ? parseInt(parentIdRaw, 10) : null

    if (!id || !name) {
      return { 
        success: false, 
        message: 'Category ID and name are required' 
      }
    }

    const result = await updateCategoryAction({
      id: parseInt(id),
      name,
      parent_id,
    })

    return result
  } catch (error: any) {
    console.error('Error in updateCategory action:', error)
    return { 
      success: false, 
      message: error?.message || 'Failed to update category' 
    }
  }
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategory(id: number) {
  await requireAuth()
  return deleteCategoryAction(id)
}

/**
 * Restore deleted category
 */
export async function restoreCategory(id: number) {
  await requireAuth()
  return restoreCategoryAction(id)
}
