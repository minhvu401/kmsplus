"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import { message } from "antd"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import "quill/dist/quill.snow.css"

interface QuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  height = 400,
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<any>(null)
  const initializedRef = useRef(false)
  const valueRef = useRef<string>(value)
  const isSettingContent = useRef(false)
  const [isReady, setIsReady] = useState(false)

  // Keep latest value for async init
  useEffect(() => {
    valueRef.current = value
  }, [value, isReady])

  const imageHandler = useCallback(async () => {
    const input = document.createElement("input")
    input.setAttribute("type", "file")
    input.setAttribute("accept", "image/*")

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file || !quillRef.current) return

      try {
        message.loading({ content: "Uploading image...", key: "imageUpload" })
        const result = await uploadImageToCloudinary(file, "article-content")
        const url = result.secure_url

        const range = quillRef.current.getSelection()
        if (range) {
          quillRef.current.insertEmbed(range.index, "image", url)
          quillRef.current.setSelection(range.index + 1)
        }

        message.success({
          content: "Image uploaded successfully",
          key: "imageUpload",
        })
      } catch (error: any) {
        console.error("Image upload error:", error)
        message.error({
          content: error?.message || "Failed to upload image",
          key: "imageUpload",
        })
      }
    }

    input.click()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || initializedRef.current) return

    const initializeQuill = async () => {
      try {
        const Quill = (await import("quill")).default

        // Clear any existing toolbar siblings and container content to avoid duplicates
        const parent = container.parentElement
        parent?.querySelectorAll(".ql-toolbar").forEach((node) => node.remove())
        container.innerHTML = ""

        const quill = new Quill(container, {
          theme: "snow",
          placeholder: placeholder,
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, 4, false] }],
              ["bold", "italic", "underline", "strike"],
              ["blockquote", "code-block"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image", "video"],
              ["clean"],
            ],
          },
          formats: [
            "header",
            "bold",
            "italic",
            "underline",
            "strike",
            "blockquote",
            "code-block",
            "list",
            "link",
            "image",
            "video",
          ],
        })

        // Set custom image handler
        const toolbar = quill.getModule("toolbar") as any
        toolbar.addHandler("image", imageHandler)

        // Set initial content using latest value
        const initialHtml = valueRef.current || ""
        quill.root.innerHTML = initialHtml

        // Handle text changes (skip when programmatically setting content)
        quill.on("text-change", () => {
          if (isSettingContent.current) return
          const html = quill.root.innerHTML
          onChange(html === "<p><br></p>" ? "" : html)
        })

        quillRef.current = quill
        initializedRef.current = true
        setIsReady(true)
      } catch (error) {
        console.error("Failed to initialize Quill:", error)
      }
    }

    initializeQuill()
  }, []) // Empty dependency array - initialize only once

  // Separate effect for content updates after init - PRIORITY update
  useEffect(() => {
    if (!quillRef.current) {
      return
    }

    const currentHtml = quillRef.current.root.innerHTML

    if (currentHtml !== value && value !== undefined) {
      isSettingContent.current = true
      quillRef.current.root.innerHTML = value || ""
      isSettingContent.current = false
    }
  }, [value])

  return (
    <div className="quill-wrapper">
      <div
        ref={containerRef}
        style={{ height: `${height}px`, background: "white" }}
      />
    </div>
  )
}
