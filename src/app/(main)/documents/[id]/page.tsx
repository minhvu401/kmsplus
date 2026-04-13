import React from "react"
import { sql } from "@/lib/database"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftOutlined, CalendarOutlined, FileSyncOutlined, UserOutlined, PaperClipOutlined, DownloadOutlined } from "@ant-design/icons"
import { getCurrentUser } from "@/lib/auth"
import DocumentAttachmentPreviewer from "./DocumentAttachmentPreviewer"

// Lấy dữ liệu chi tiết Document (chỉ lấy tài liệu PUBLISHED) và kiểm tra quyền category
async function getDocumentDetail(id: string, departmentId?: string | number | null) {
  const docs = await sql`
    SELECT d.*, c.name as category_name, u.email as author_email
    FROM documents d
    LEFT JOIN document_categories c ON d.category_id = c.id
    LEFT JOIN users u ON d.author_id = u.id
    WHERE d.id = ${id} 
      AND d.status = 'PUBLISHED'
      AND (c.department_id IS NULL ${departmentId ? sql`OR c.department_id = ${departmentId}` : sql``})
  `
  const doc = docs[0] || null
  if (doc) {
    doc.attachments = await sql`SELECT * FROM document_attachments WHERE document_id = ${id} ORDER BY created_at ASC`
  }
  return doc
}

export default async function DocumentReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getCurrentUser()
  let departmentId = null

  if (authUser) {
    const users = await sql`SELECT department_id FROM users WHERE id = ${Number(authUser.id)}`
    if (users.length > 0) {
      departmentId = users[0].department_id
    }
  }

  const document = await getDocumentDetail(id, departmentId)

  if (!document) return notFound()

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        
        {/* Header Tài liệu */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-white">
          <Link href={`/documents/category/${document.category_id}`} className="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-6 text-sm font-medium">
            <ArrowLeftOutlined className="mr-2" /> Về thư mục {document.category_name}
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-6">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center text-sm text-blue-100 gap-y-3 gap-x-6">
            <div className="flex items-center bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <UserOutlined className="mr-2" />
              <span>Biên soạn: <span className="font-semibold text-white">{document.author_email || 'Hệ thống'}</span></span>
            </div>
            
            <div className="flex items-center bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <FileSyncOutlined className="mr-2" />
              <span>Phiên bản: <span className="font-semibold text-white">{document.version}</span></span>
            </div>

            <div className="flex items-center bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <CalendarOutlined className="mr-2" />
              <span>Cập nhật: <span className="font-semibold text-white">
                {new Date(document.updated_at).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span></span>
            </div>
          </div>
        </header>

        {/* Nội dung Tài liệu (Rich Text HTML) */}
        <div className="p-8 md:p-10 prose prose-blue prose-base max-w-none text-gray-800 bg-white">
          <div 
            dangerouslySetInnerHTML={{ __html: document.content }} 
            className="quill-content-reader"
          />
        </div>

        {/* Khu vực xem tệp đính kèm */}
        <DocumentAttachmentPreviewer attachments={document.attachments} />

        {/* Footer Tài liệu */}
        <footer className="bg-gray-50 p-6 border-t border-gray-100 text-center text-gray-500 text-sm">
           Tài liệu nội bộ thuộc sự quản lý của doanh nghiệp. Vui lòng không sao chép chia sẻ ra bên ngoài.
        </footer>
      </article>

      {/* Style phụ trợ cho Quill Viewer */}
      <style dangerouslySetInnerHTML={{__html: `
        .quill-content-reader h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #1e3a8a; }
        .quill-content-reader h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e0e7ff; }
        .quill-content-reader p { margin-bottom: 1.25rem; line-height: 1.75; }
        .quill-content-reader ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .quill-content-reader ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .quill-content-reader strong { font-weight: 600; color: #111827; }
        .quill-content-reader blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #4b5563; font-style: italic; background: #eff6ff; padding: 1rem; border-radius: 0.5rem; }
        .quill-content-reader img { max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 2rem auto; display: block; }
      `}}/>
    </div>
  )
}