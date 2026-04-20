import React from "react"
import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"
import DocumentPageClient from "./DocumentPageClient"

interface Category {
  id: number
  name: string
  description?: string
  doc_count: number
}

// Lấy danh sách danh mục (chỉ hiện danh mục phân quyền hoặc dành cho tất cả)
// Thêm tham số role vào hàm
async function getCategoriesDashboard(
  departmentId?: string | number | null,
  role?: string | null
): Promise<Category[]> {
  // 1. DÀNH CHO SYSTEM ADMIN: Thấy TẤT CẢ danh mục, không giới hạn phòng ban
  if (role === "ADMIN") {
    return (await sql`
      SELECT dc.id, dc.name, dc.description, COUNT(d.id)::int as doc_count
      FROM document_categories dc
      LEFT JOIN documents d ON d.category_id = dc.id AND d.status = 'PUBLISHED'
      GROUP BY dc.id, dc.name, dc.description
      ORDER BY dc.name ASC
    `) as Category[]
  }
  // 2. DÀNH CHO NHÂN VIÊN/HOD CÓ PHÒNG BAN: Thấy danh mục chung (NULL) + danh mục của phòng mình
  if (departmentId) {
    return (await sql`
      SELECT dc.id, dc.name, dc.description, COUNT(d.id)::int as doc_count
      FROM document_categories dc
      LEFT JOIN documents d ON d.category_id = dc.id AND d.status = 'PUBLISHED'
      WHERE dc.department_id IS NULL OR dc.department_id = ${departmentId}
      GROUP BY dc.id, dc.name, dc.description
      ORDER BY dc.name ASC
    `) as Category[]
  }

  // 3. NGƯỜI DÙNG KHÔNG CÓ PHÒNG BAN: Chỉ thấy danh mục chung
  return (await sql`
    SELECT dc.id, dc.name, dc.description, COUNT(d.id)::int as doc_count
    FROM document_categories dc
    LEFT JOIN documents d ON d.category_id = dc.id AND d.status = 'PUBLISHED'
    WHERE dc.department_id IS NULL
    GROUP BY dc.id, dc.name, dc.description
    ORDER BY dc.name ASC
  `) as Category[]
}

export default async function DocumentDashboard() {
  const authUser = await getCurrentUser()
  let departmentId = null
  let role = null

  if (authUser) {
    role = authUser.role // Lấy role từ thông tin đăng nhập
    const users =
      await sql`SELECT department_id FROM users WHERE id = ${Number(authUser.id)}`
    if (users.length > 0) {
      departmentId = users[0].department_id
    }
  }

  // Truyền thêm role vào hàm lấy dữ liệu
  const categories = await getCategoriesDashboard(departmentId, role)

  return <DocumentPageClient categories={categories} />
}
