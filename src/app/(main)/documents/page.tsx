import React from "react"
import { sql } from "@/lib/database"
import Link from "next/link"
import { BookOutlined, FileTextOutlined } from "@ant-design/icons"

import { getCurrentUser } from "@/lib/auth"

// Lấy danh sách danh mục (chỉ hiện danh mục phân quyền hoặc dành cho tất cả)
// Thêm tham số role vào hàm
async function getCategoriesDashboard(departmentId?: string | number | null, role?: string | null) {
  // 1. DÀNH CHO SYSTEM ADMIN: Thấy TẤT CẢ danh mục, không giới hạn phòng ban
  if (role === "ADMIN") {
    return await sql`
      SELECT dc.id, dc.name, dc.description, COUNT(d.id)::int as doc_count
      FROM document_categories dc
      LEFT JOIN documents d ON d.category_id = dc.id AND d.status = 'PUBLISHED'
      GROUP BY dc.id, dc.name, dc.description
      ORDER BY dc.name ASC
    `
  }
  // 2. DÀNH CHO NHÂN VIÊN/HOD CÓ PHÒNG BAN: Thấy danh mục chung (NULL) + danh mục của phòng mình
  if (departmentId) {
    return await sql`
      SELECT dc.id, dc.name, dc.description, COUNT(d.id)::int as doc_count
      FROM document_categories dc
      LEFT JOIN documents d ON d.category_id = dc.id AND d.status = 'PUBLISHED'
      WHERE dc.department_id IS NULL OR dc.department_id = ${departmentId}
      GROUP BY dc.id, dc.name, dc.description
      ORDER BY dc.name ASC
    `
  }
  
  // 3. NGƯỜI DÙNG KHÔNG CÓ PHÒNG BAN: Chỉ thấy danh mục chung
  return await sql`
    SELECT dc.id, dc.name, dc.description, COUNT(d.id)::int as doc_count
    FROM document_categories dc
    LEFT JOIN documents d ON d.category_id = dc.id AND d.status = 'PUBLISHED'
    WHERE dc.department_id IS NULL
    GROUP BY dc.id, dc.name, dc.description
    ORDER BY dc.name ASC
  `
}

export default async function DocumentDashboard() {
  const authUser = await getCurrentUser()
  let departmentId = null
  let role = null

  if (authUser) {
    role = authUser.role // Lấy role từ thông tin đăng nhập
    const users = await sql`SELECT department_id FROM users WHERE id = ${Number(authUser.id)}`
    if (users.length > 0) {
      departmentId = users[0].department_id
    }
  }

  // Truyền thêm role vào hàm lấy dữ liệu
  const categories = await getCategoriesDashboard(departmentId, role)

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <BookOutlined className="mr-3 text-blue-600" />
          Wiki & Chính Sách Nội Bộ
        </h1>
        <p className="text-gray-600 text-base">
          Trung tâm lưu trữ kiến thức, quy định và tài liệu chuẩn của công ty.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-100 shadow-sm">
          <BookOutlined className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500">Chưa có danh mục tài liệu nào.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/documents/category/${category.id}`}
              className="block group"
            >
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOutlined className="text-xl" />
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {category.doc_count} tài liệu
                  </span>
                </div>
                
                <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h2>
                
                <p className="text-gray-500 text-sm line-clamp-2 mt-auto">
                  {category.description || "Nhấn để xem các tài liệu và chính sách trong thư mục này."}
                </p>
                
                <div className="mt-6 flex items-center text-blue-600 text-sm font-medium">
                  Xem chi tiết <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}