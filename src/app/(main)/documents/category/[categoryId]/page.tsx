import React from "react"
import { sql } from "@/lib/database"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FileTextOutlined, ArrowLeftOutlined, CalendarOutlined, FileSyncOutlined } from "@ant-design/icons"
import { getCurrentUser } from "@/lib/auth"

// Lấy danh sách Document liên quan tới 1 Category cụ thể
async function getCategoryAndDocuments(categoryId: string, departmentId?: string | number | null) {
  let categoryQuery;
  
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
  if (!category) return null

  const documents = await sql`
    SELECT id, title, version, updated_at
    FROM documents
    WHERE category_id = ${categoryId} AND status = 'PUBLISHED'
    ORDER BY updated_at DESC
  `

  return { category, documents }
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const authUser = await getCurrentUser()
  let departmentId = null

  if (authUser) {
    const users = await sql`SELECT department_id FROM users WHERE id = ${Number(authUser.id)}`
    if (users.length > 0) {
      departmentId = users[0].department_id
    }
  }

  const data = await getCategoryAndDocuments(categoryId, departmentId)

  if (!data) return notFound()

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/documents" 
          className="text-gray-500 hover:text-blue-600 transition-colors flex items-center font-medium"
        >
          <ArrowLeftOutlined className="mr-2" /> Quay lại Thư mục gốc
        </Link>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
          {data.documents.length} tài liệu xuất bản
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{data.category.name}</h1>
        <p className="text-gray-600 text-base leading-relaxed">
          {data.category.description || "Thư mục này chứa văn bản nội quy quy định liên quan."}
        </p>
      </div>

      <div className="space-y-4">
        {data.documents.length === 0 ? (
             <div className="text-center py-20 text-gray-500">Thư mục chưa có bài viết tài liệu nào được hiển thị</div>
        ) : (
          data.documents.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`} className="block group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                
                <div className="flex items-start mb-4 md:mb-0">
                  <div className="bg-blue-50 p-3 rounded-full mr-5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileTextOutlined className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center"><FileSyncOutlined className="mr-1"/> Phiên bản {doc.version}</span>
                        <span className="flex items-center">
                            <CalendarOutlined className="mr-1"/> Cập nhật {new Date(doc.updated_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-blue-600 font-medium">
                  Đọc nội dung <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>

              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}