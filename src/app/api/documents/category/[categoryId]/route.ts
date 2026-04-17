import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's department
    const userRecord = await sql`
      SELECT department_id FROM users WHERE id = ${Number(user.id)}
    `
    const departmentId =
      userRecord.length > 0 ? userRecord[0].department_id : null

    // Get category with permission check
    let categoryQuery
    if (departmentId) {
      categoryQuery = await sql`
        SELECT * FROM document_categories 
        WHERE id = ${categoryId} 
        AND (department_id IS NULL OR department_id = ${departmentId})
      `
    } else {
      categoryQuery = await sql`
        SELECT * FROM document_categories 
        WHERE id = ${categoryId} 
        AND department_id IS NULL
      `
    }

    const category = categoryQuery[0]
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Get published documents in this category
    const documents = await sql`
      SELECT id, title, version, updated_at
      FROM documents
      WHERE category_id = ${categoryId} AND status = 'PUBLISHED'
      ORDER BY updated_at DESC
    `

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
      },
      documents: documents || [],
    })
  } catch (error: any) {
    console.error("Error fetching category documents:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
