// @/components/ui/RichTextEditor.tsx
"use client"
import dynamic from "next/dynamic"
import React from "react"
import "react-quill-new/dist/quill.snow.css"

// Load dynamic để tránh lỗi SSR
const ReactQuill = dynamic(
  () => import("react-quill-new").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 bg-gray-50 animate-pulse rounded border border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    ),
  }
)

interface Props {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  size?: "default" | "compact"
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  size = "default",
}: Props) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  }

  const handleEditorChange = (
    content: string,
    delta: any,
    source: any,
    editor: any
  ) => {
    if (onChange) {
      // Chỉ truyền content (HTML string) ra ngoài
      onChange(content)
    }
  }

  // Fallback textarea khi Quill không tải được
  if (!isClient) {
    return (
      <div className="border border-gray-300 rounded-lg">
        <textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || "Start typing your content here..."}
          className={`w-full p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg ${
            size === "compact" ? "min-h-[110px]" : "min-h-[150px]"
          }`}
        />
      </div>
    )
  }

  const isCompact = size === "compact"

  return (
    <div className={`rich-text-editor ${isCompact ? "compact-editor" : ""}`}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={handleEditorChange}
        modules={modules}
        placeholder={placeholder}
        className={isCompact ? "h-44 mb-12" : "h-60 mb-12"}
        style={{
          minHeight: isCompact ? "140px" : "200px",
        }}
      />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          border-radius: 8px 8px 0 0;
          border-color: #d9d9d9;
        }
        .rich-text-editor .ql-container {
          border-radius: 0 0 8px 8px;
          border-color: #d9d9d9;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
        }
        .rich-text-editor.compact-editor .ql-editor {
          min-height: 100px;
        }
      `}</style>
    </div>
  )
}
