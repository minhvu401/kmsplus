"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"

export async function fetchCategories() {
  try {
    const list = await sql`
      SELECT c.id, c.name, c.description, c.parent_id, c.department_id, d.name as department_name
      FROM document_categories c
      LEFT JOIN department d ON c.department_id = d.id
      ORDER BY c.name ASC
    `
    return list as any[]
  } catch (error: any) {
    throw new Error("Lỗi lấy danh mục: " + error.message)
  }
}

export async function createCategory(data: { name: string; description?: string; department_id?: number }) {
  try {
    const res = await sql`
      INSERT INTO document_categories (name, description, department_id)
      VALUES (${data.name}, ${data.description || null}, ${data.department_id || null})
      RETURNING *
    `
    revalidatePath("/documents/management")
    return res[0]
  } catch (error: any) {
    throw new Error("Lỗi tạo danh mục: " + error.message)
  }
}

export async function fetchDocuments() {
  try {
    const list = await sql`
      SELECT d.id, d.title, d.status, d.version, d.updated_at,
             dc.name as category_name, dc.id as category_id
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      ORDER BY d.updated_at DESC
    `
    return list as any[]
  } catch (error: any) {
    throw new Error("Lỗi lấy tài liệu: " + error.message)
  }
}

export async function getDocumentById(id: string) {
  try {
    const list = await sql`SELECT * FROM documents WHERE id = ${id}`
    const doc = list[0] || null
    if (doc) {
      doc.attachments = await sql`SELECT * FROM document_attachments WHERE document_id = ${id} ORDER BY created_at ASC`
    }
    return doc
  } catch (error: any) {
    throw new Error("Lỗi tải chi tiết tài liệu: " + error.message)
  }
}

export async function saveDocument(data: {
  id?: string
  title: string
  category_id: string
  content: string
  status: string
  version: string
  attachments?: Array<{
    file_name: string
    file_url: string
    file_size?: number
    file_type?: string
  }>
}) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Chưa đăng nhập hoặc phiên làm việc hết hạn")

    let result
    if (data.id) {
      const res = await sql`
        UPDATE documents
        SET title = ${data.title},
            category_id = ${data.category_id},
            content = ${data.content},
            status = ${data.status},
            version = ${data.version},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${data.id}
        RETURNING *
      `
      result = res[0]
    } else {
      const res = await sql`
        INSERT INTO documents (title, category_id, content, status, version, author_id)
        VALUES (
          ${data.title}, 
          ${data.category_id}, 
          ${data.content}, 
          ${data.status || 'DRAFT'}, 
          ${data.version || '1.0'}, 
          ${user.id}
        )
        RETURNING *
      `
      result = res[0]
    }

    if (result?.id) {
      if (data.attachments) {
        // Delete all old attachments
        await sql`DELETE FROM document_attachments WHERE document_id = ${result.id}`
        // Insert new ones
        for (const file of data.attachments) {
          await sql`
            INSERT INTO document_attachments (document_id, file_name, file_url, file_size, file_type, uploaded_by)
            VALUES (${result.id}, ${file.file_name}, ${file.file_url}, ${file.file_size || null}, ${file.file_type || null}, ${user.id})
          `
        }
      }
    }
    
    revalidatePath("/documents/management")
    return result
  } catch (error: any) {
    throw new Error("Lỗi lưu tài liệu: " + error.message)
  }
}

export async function deleteDocument(id: string) {
  try {
    await sql`DELETE FROM documents WHERE id = ${id}`
    revalidatePath("/documents/management")
    return true
  } catch (error: any) {
    throw new Error("Lỗi xóa tài liệu: " + error.message)
  }
}