"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"

export async function fetchCategories() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    // Lấy department_id của user hiện tại
    const userRecord = await sql`SELECT department_id FROM users WHERE id = ${Number(user.id)}`
    const deptId = userRecord.length > 0 ? userRecord[0].department_id : null

    // Nếu là ADMIN, hiển thị toàn bộ
    if (user.role === 'ADMIN') {
      const list = await sql`
        SELECT c.id, c.name, c.description, c.parent_id, c.department_id, d.name as department_name
        FROM document_categories c
        LEFT JOIN department d ON c.department_id = d.id
        ORDER BY c.name ASC
      `
      return list as any[]
    }

    // Nếu là HOD / Các Role khác: Chỉ hiển thị danh mục chung (NULL) và danh mục phòng ban của mình
    const list = await sql`
      SELECT c.id, c.name, c.description, c.parent_id, c.department_id, d.name as department_name
      FROM document_categories c
      LEFT JOIN department d ON c.department_id = d.id
      WHERE c.department_id IS NULL OR c.department_id = ${deptId}
      ORDER BY c.name ASC
    `
    return list as any[]
  } catch (error: any) {
    throw new Error("Lỗi lấy danh mục: " + error.message)
  }
}

export async function createCategory(data: { name: string; description?: string; department_id?: number }) {
   try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    // Ràng buộc HOD không được tạo danh mục cho phòng ban khác
    if (user.role !== 'ADMIN') {
      const userRecord = await sql`SELECT department_id FROM users WHERE id = ${Number(user.id)}`
      const deptId = userRecord.length > 0 ? userRecord[0].department_id : null
      
      // Nếu data.department_id khác với phòng ban của HOD (và không phải tạo danh mục dùng chung - nếu bạn cho phép)
      if (data.department_id !== deptId && data.department_id !== null) {
        throw new Error("Không có quyền tạo danh mục cho phòng ban này")
      }
    }

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
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const userRecord = await sql`SELECT department_id FROM users WHERE id = ${Number(user.id)}`
    const deptId = userRecord.length > 0 ? userRecord[0].department_id : null

    // ADMIN thấy tất cả tài liệu
    if (user.role === 'ADMIN') {
      const list = await sql`
        SELECT d.id, d.title, d.status, d.version, d.updated_at,
               dc.name as category_name, dc.id as category_id
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        ORDER BY d.updated_at DESC
      `
      return list as any[]
    }

    // Role khác chỉ thấy tài liệu có category thuộc phòng ban mình hoặc category chung (NULL)
    const list = await sql`
      SELECT d.id, d.title, d.status, d.version, d.updated_at,
             dc.name as category_name, dc.id as category_id
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      WHERE dc.department_id IS NULL OR dc.department_id = ${deptId}
      ORDER BY d.updated_at DESC
    `
    return list as any[]
  } catch (error: any) {
    throw new Error("Lỗi lấy tài liệu: " + error.message)
  }
}

export async function getDocumentById(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const list = await sql`
      SELECT d.*, dc.department_id 
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      WHERE d.id = ${id}
    `
    const doc = list[0] || null

    if (!doc) return null

    // Bảo mật: Không cho phép xem tài liệu của phòng ban khác nếu không phải ADMIN
    if (user.role !== 'ADMIN') {
      const userRecord = await sql`SELECT department_id FROM users WHERE id = ${Number(user.id)}`
      const deptId = userRecord.length > 0 ? userRecord[0].department_id : null

      if (doc.department_id !== null && doc.department_id !== deptId) {
        throw new Error("Bạn không có quyền xem tài liệu này")
      }
    }

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

    // Lấy thông tin phòng ban của category mà tài liệu này thuộc về
    const catRecord = await sql`SELECT department_id FROM document_categories WHERE id = ${data.category_id}`
    const catDeptId = catRecord.length > 0 ? catRecord[0].department_id : null

    // Bảo mật Update/Create file
    if (user.role !== 'ADMIN') {
      const userRecord = await sql`SELECT department_id FROM users WHERE id = ${Number(user.id)}`
      const deptId = userRecord.length > 0 ? userRecord[0].department_id : null

      if (catDeptId !== null && catDeptId !== deptId) {
        throw new Error("Bạn không có quyền thêm/sửa tài liệu ở danh mục của phòng ban khác")
      }
    }
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
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    // Bảo mật Delete
    if (user.role !== 'ADMIN') {
      const docRecord = await sql`
        SELECT dc.department_id FROM documents d
        JOIN document_categories dc ON d.category_id = dc.id
        WHERE d.id = ${id}
      `
      const docDeptId = docRecord.length > 0 ? docRecord[0].department_id : null
      const userRecord = await sql`SELECT department_id FROM users WHERE id = ${Number(user.id)}`
      const deptId = userRecord.length > 0 ? userRecord[0].department_id : null

      if (docDeptId !== null && docDeptId !== deptId) {
        throw new Error("Bạn không có quyền xóa tài liệu của phòng ban khác")
      }
    }

    await sql`DELETE FROM documents WHERE id = ${id}`
    revalidatePath("/documents/management")
    return true
  } catch (error: any) {
    throw new Error("Lỗi xóa tài liệu: " + error.message)
  }
}