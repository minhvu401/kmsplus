"use server"

import { sql } from "@/lib/database"

export type Category = {
  id: string
  parent_id: string | null
  name: string
  is_deleted: boolean
  created_at: Date
}

export type CreateCategoryInput = {
  name: string
  parent_id?: number | null
}

export type UpdateCategoryInput = {
  id: number
  name: string
  parent_id?: number | null
}

/**
 * Get all categories (including nested structure)
 */
export async function getAllCategoriesAction(): Promise<Category[]> {
  try {
    const categories = await sql`
      SELECT 
        id,
        parent_id,
        name,
        is_deleted,
        created_at
      FROM categories
      ORDER BY is_deleted ASC, parent_id NULLS FIRST, name ASC
    `
    return categories as Category[]
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Get category by ID
 */
export async function getCategoryByIdAction(categoryId: number): Promise<{ success: boolean; data?: Category; message?: string }> {
  try {
    const categories = await sql`
      SELECT 
        id,
        parent_id,
        name,
        is_deleted,
        created_at
      FROM categories
      WHERE id = ${categoryId}
      LIMIT 1
    `

    if (categories.length === 0) {
      return { success: false, message: 'Category not found' }
    }

    return {
      success: true,
      data: categories[0] as Category
    }
  } catch (error: any) {
    console.error('Error fetching category:', error)
    return { success: false, message: error?.message || 'Failed to fetch category' }
  }
}

/**
 * Create a new category
 */
export async function createCategoryAction(input: CreateCategoryInput): Promise<{ success: boolean; message: string; categoryId?: string }> {
  try {
    const { name, parent_id } = input

    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, message: 'Category name is required' }
    }

    // Check if parent_id exists (if provided)
    if (parent_id) {
      const parentCheck = await sql`
        SELECT id FROM categories WHERE id = ${parent_id} AND is_deleted = false
      `
      if (parentCheck.length === 0) {
        return { success: false, message: 'Parent category not found' }
      }
    }

    // Check for duplicate name
    const duplicate = await sql`
      SELECT id FROM categories WHERE name = ${name.trim()} AND is_deleted = false
    `
    if (duplicate.length > 0) {
      return { success: false, message: 'Category with this name already exists' }
    }

    const result = await sql`
      INSERT INTO categories (name, parent_id, created_at)
      VALUES (${name.trim()}, ${parent_id || null}, NOW())
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Failed to create category' }
    }

    return {
      success: true,
      message: 'Category created successfully',
      categoryId: result[0].id,
    }
  } catch (error: any) {
    console.error('Error creating category:', error)
    return { success: false, message: error?.message || 'Failed to create category' }
  }
}

/**
 * Update category
 */
export async function updateCategoryAction(input: UpdateCategoryInput): Promise<{ success: boolean; message: string }> {
  try {
    const { id, name, parent_id } = input

    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, message: 'Category name is required' }
    }

    // Prevent setting parent_id to itself
    if (parent_id && parent_id === id) {
      return { success: false, message: 'Category cannot be its own parent' }
    }

    // Check if parent_id exists (if provided)
    if (parent_id) {
      const parentCheck = await sql`
        SELECT id FROM categories WHERE id = ${parent_id} AND is_deleted = false
      `
      if (parentCheck.length === 0) {
        return { success: false, message: 'Parent category not found' }
      }
    }

    // Check for duplicate name (excluding current category)
    const duplicate = await sql`
      SELECT id FROM categories 
      WHERE name = ${name.trim()} 
        AND id != ${id}
        AND is_deleted = false
    `
    if (duplicate.length > 0) {
      return { success: false, message: 'Category with this name already exists' }
    }

    const result = await sql`
      UPDATE categories
      SET 
        name = ${name.trim()},
        parent_id = ${parent_id || null}
      WHERE id = ${id} AND is_deleted = false
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Category not found or already deleted' }
    }

    return { success: true, message: 'Category updated successfully' }
  } catch (error: any) {
    console.error('Error updating category:', error)
    return { success: false, message: error?.message || 'Failed to update category' }
  }
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategoryAction(categoryId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Check if category has children
    const children = await sql`
      SELECT id FROM categories WHERE parent_id = ${categoryId} AND is_deleted = false
    `
    if (children.length > 0) {
      return { success: false, message: 'Cannot delete category with subcategories. Delete subcategories first.' }
    }

    const result = await sql`
      UPDATE categories
      SET is_deleted = true
      WHERE id = ${categoryId} AND is_deleted = false
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Category not found or already deleted' }
    }

    return { success: true, message: 'Category deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return { success: false, message: error?.message || 'Failed to delete category' }
  }
}

/**
 * Restore deleted category
 */
export async function restoreCategoryAction(categoryId: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await sql`
      UPDATE categories
      SET is_deleted = false
      WHERE id = ${categoryId} AND is_deleted = true
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, message: 'Category not found or not deleted' }
    }

    return { success: true, message: 'Category restored successfully' }
  } catch (error: any) {
    console.error('Error restoring category:', error)
    return { success: false, message: error?.message || 'Failed to restore category' }
  }
}
