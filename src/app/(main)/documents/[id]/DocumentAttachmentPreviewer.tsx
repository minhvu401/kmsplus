"use client"
import React, { useState } from "react"
import { Modal, Button } from "antd"
import { PaperClipOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons"

interface Attachment {
  id: number
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
}

export default function DocumentAttachmentPreviewer({ attachments }: { attachments: Attachment[] }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>("")
  const [textContent, setTextContent] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) return null

  const handlePreview = async (file: Attachment) => {
    let url = file.file_url
    setTextContent(null)
    
    // Kiểm tra các định dạng file Office để dùng Viewer của Microsoft
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    const isOffice = officeExtensions.some(ext => file.file_name.toLowerCase().endsWith(ext))
    
    if (file.file_name.toLowerCase().endsWith('.txt') || file.file_name.toLowerCase().endsWith('.md')) {
      try {
        const response = await fetch(file.file_url)
        if (response.ok) {
          const text = await response.text()
          setTextContent(text)
        } else {
          setTextContent("Không thể tải nội dung file text.")
        }
      } catch (err) {
        setTextContent("Lỗi khi tải file text. Hãy tải file xuống trực tiếp.")
      }
      setPreviewUrl(file.file_url)
      setPreviewTitle(file.file_name)
      return
    }

    if (isOffice) {
      url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.file_url)}`
    } else if (file.file_name.toLowerCase().endsWith('.pdf')) {
      url = file.file_url
    } else if (['.jpg', '.png', '.gif', '.jpeg', '.webp'].some(ext => file.file_name.toLowerCase().endsWith(ext))) {
       url = file.file_url
    } else {
      url = `https://docs.google.com/gview?url=${encodeURIComponent(file.file_url)}&embedded=true`
    }

    setPreviewUrl(url)
    setPreviewTitle(file.file_name)
  }

  const handleDownload = async (file: Attachment) => {
    try {
      // Dùng fetch để tải file về thành blob nhằm ép trình duyệt hiển thị đúng tên và đuôi file gốc
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.file_name; // Sử dụng tên file gốc có sẵn trong database
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback nếu có lỗi CORS
      window.open(file.file_url, '_blank');
    }
  }

  const isImage = (fileName: string) => {
    return ['.jpg', '.png', '.gif', '.jpeg', '.webp'].some(ext => fileName.toLowerCase().endsWith(ext))
  }

  return (
    <div className="bg-gray-50 p-6 border-t border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
        <PaperClipOutlined className="mr-2 text-blue-600" /> 
        Tệp đính kèm ({attachments.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {attachments.map((file) => (
          <div key={file.id || file.file_url} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors shadow-sm">
            <div className="flex flex-col overflow-hidden mr-3">
              <span className="text-sm font-medium text-gray-700 truncate" title={file.file_name}>
                {file.file_name}
              </span>
              {file.file_size && (
                <span className="text-xs text-gray-500">
                  {(file.file_size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
            <div className="flex space-x-1 flex-shrink-0">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                className="text-blue-600 hover:bg-blue-50"
                onClick={() => handlePreview(file)}
                title="Xem trước"
              />
              <Button
                type="text"
                icon={<DownloadOutlined />}
                className="text-green-600 hover:bg-green-50"
                onClick={() => handleDownload(file)}
                title="Tải xuống"
              />
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!previewUrl}
        title={previewTitle}
        footer={null}
        onCancel={() => {
          setPreviewUrl(null)
          setTextContent(null)
        }}
        width={1000}
        styles={{ body: { height: '80vh', padding: 0 } }}
        destroyOnClose
      >
        {textContent !== null ? (
          <div className="w-full h-full p-8 overflow-auto bg-white border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">{textContent}</pre>
          </div>
        ) : previewUrl && isImage(previewTitle) ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={previewTitle} className="max-w-full max-h-full object-contain drop-shadow-md rounded" />
          </div>
        ) : (
          <iframe
            src={previewUrl || ''}
            className="w-full h-full border-0"
            title="Preview Attachment"
          />
        )}
      </Modal>
    </div>
  )
}
