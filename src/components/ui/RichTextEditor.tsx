// @/components/ui/RichTextEditor.tsx
"use client"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

// 👇 Thay đổi đoạn này: Dùng .then() để lấy mod.default
const ReactQuill = dynamic(
  () => import("react-quill-new").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded" />, // Thêm loading state cho mượt
  }
)

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: Props) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  }

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      placeholder={placeholder}
      className="h-60 mb-12"
    />
  )
}
