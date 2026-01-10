"use client"

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react"
import {
  Form,
  Select,
  Button,
  Card,
  Space,
  Flex,
  Typography,
  Divider,
  message,
} from "antd"
import {
  CloseOutlined,
  SendOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from "@ant-design/icons"
import { useRouter } from "next/navigation"
import {
  getAllTags,
  createArticle,
  getAllCategories,
} from "@/action/articles/articlesManagementAction"
import type { Tag } from "@/service/articles.service"
import "./editor.css"

const { Title, Text } = Typography

export default function CreateArticlePage() {
  const [form] = Form.useForm()
  const [titleContent, setTitleContent] = useState("")
  const [contentValue, setContentValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"draft" | "published">(
    "published"
  )
  const titleEditorRef = useRef<HTMLDivElement>(null)
  const contentEditorRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)
  const router = useRouter()

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0)
      return true
    }
    return false
  }

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (selection && savedSelectionRef.current) {
      try {
        selection.removeAllRanges()
        selection.addRange(savedSelectionRef.current)
      } catch (e) {
        console.log("Could not restore selection")
      }
    }
  }

  const focusEditor = (editorRef: React.RefObject<HTMLDivElement>) => {
    editorRef.current?.focus({ preventScroll: true })
  }

  const applyFormat = (
    command: string,
    editorRef: React.RefObject<HTMLDivElement>
  ) => {
    restoreSelection()
    document.execCommand(command, false)
    focusEditor(editorRef)
  }

  const applyHeading = (
    level: string,
    editorRef: React.RefObject<HTMLDivElement>
  ) => {
    restoreSelection()
    document.execCommand("formatBlock", false, level)
    focusEditor(editorRef)
  }

  const applyQuote = (editorRef: React.RefObject<HTMLDivElement>) => {
    restoreSelection()
    document.execCommand("formatBlock", false, "<blockquote>")
    focusEditor(editorRef)
  }

  const handleTitleInput = () => {
    if (titleEditorRef.current) {
      setTitleContent(titleEditorRef.current.innerText)
    }
  }

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      return
    }
    saveSelection()
  }

  const handleTitlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData
      .getData("text/plain")
      .replace(/\s+/g, " ")
      .trim()
    document.execCommand("insertText", false, text)
  }

  const handleContentInput = () => {
    if (contentEditorRef.current) {
      setContentValue(contentEditorRef.current.innerHTML)
    }
  }

  const handleContentSelectionChange = () => {
    saveSelection()
  }

  // Load tags & categories từ database khi component mount
  useEffect(() => {
    ;(async () => {
      setLoadingTags(true)
      setLoadingCategories(true)
      try {
        const [tagsRes, categoriesRes] = await Promise.all([
          getAllTags(),
          getAllCategories(),
        ])
        setTags(tagsRes || [])
        setCategories(categoriesRes || [])
      } catch (err: any) {
        console.error("Error loading tags/categories:", err)
        message.error("Failed to load tags or categories")
        setTags([])
        setCategories([])
      } finally {
        setLoadingTags(false)
        setLoadingCategories(false)
      }
    })()
  }, [])

  const handleSubmit = async (values: any) => {
    console.log("Form values:", values)
    setLoading(true)

    try {
      // Tạo FormData để gửi lên server
      const formData = new FormData()
      formData.append("title", titleContent)
      formData.append("content", contentValue)
      formData.append("status", submitStatus)
      formData.append("tags", JSON.stringify(selectedTags))
      formData.append(
        "category_id",
        values?.categoryId ? String(values.categoryId) : ""
      )

      console.log("Sending data:", {
        title: titleContent,
        content: contentValue,
        status: submitStatus,
        tags: selectedTags,
        category_id: values?.categoryId ?? null,
      })

      // Gọi server action
      const result = await createArticle(formData)

      console.log("Create article result:", result)

      if (result.success) {
        message.success(result.message || "Article created successfully!")
        setTitleContent("")
        setContentValue("")
        setSelectedTags([])
        form.resetFields()
        setSubmitStatus("published")

        // Redirect về trang management sau 1 giây
        setTimeout(() => {
          router.push("/articles/management")
        }, 1000)
      } else {
        console.error("Failed to create article:", result.message)
        message.error(result.message || "Failed to create article")
      }
    } catch (error: any) {
      console.error("Error creating article:", error)
      message.error(error?.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex vertical className="flex-1">
      <main className="flex-1 overflow-auto px-8 py-6">
        <Card className="max-w-4xl mx-auto">
          <Title level={2} className="!mb-6">
            Create An Article
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            validateTrigger="onBlur"
          >
            {/* Title Field */}
            <Form.Item
              label={
                <Text strong className="text-base">
                  Title
                </Text>
              }
              name="title"
              rules={[
                {
                  required: true,
                  validator: (_, value) => {
                    const textContent = titleContent
                      .replace(/<[^>]*>/g, "")
                      .trim()
                    if (!textContent) {
                      return Promise.reject("Please enter a title")
                    }
                    if (textContent.length > 150) {
                      return Promise.reject(
                        "Title must be less than 150 characters"
                      )
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <div>
                <div
                  ref={titleEditorRef}
                  contentEditable
                  onInput={handleTitleInput}
                  onMouseDown={() => saveSelection()}
                  onKeyDown={handleTitleKeyDown}
                  onPaste={handleTitlePaste}
                  className="border border-gray-300 rounded p-3 min-h-[60px] focus:outline-none focus:border-blue-500"
                  style={{ backgroundColor: "white" }}
                  data-placeholder="Type something here..."
                />
              </div>
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {titleContent.replace(/<[^>]*>/g, "").trim().length} / 150
              </Text>
            </Flex>

            {/* Content Field */}
            <Form.Item
              label={
                <Text strong className="text-base">
                  Content
                </Text>
              }
              name="content"
              rules={[
                {
                  required: true,
                  validator: (_, value) => {
                    const textContent = contentValue
                      .replace(/<[^>]*>/g, "")
                      .trim()
                    if (!textContent) {
                      return Promise.reject("Please enter content")
                    }
                    if (textContent.length > 3000) {
                      return Promise.reject(
                        "Content must be less than 3000 characters"
                      )
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <div>
                <Space size="small" className="mb-2" wrap>
                  <Select
                    style={{ width: 140 }}
                    size="small"
                    placeholder="Heading"
                    options={[
                      { label: "Normal", value: "p" },
                      { label: "H1", value: "h1" },
                      { label: "H2", value: "h2" },
                      { label: "H3", value: "h3" },
                    ]}
                    onChange={(value) =>
                      applyHeading(`<${value}>`, contentEditorRef)
                    }
                    dropdownMatchSelectWidth={false}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<BoldOutlined />}
                    onClick={() => applyFormat("bold", contentEditorRef)}
                    title="Bold"
                    aria-label="Bold"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ItalicOutlined />}
                    onClick={() => applyFormat("italic", contentEditorRef)}
                    title="Italic"
                    aria-label="Italic"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<UnderlineOutlined />}
                    onClick={() => applyFormat("underline", contentEditorRef)}
                    title="Underline"
                    aria-label="Underline"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<OrderedListOutlined />}
                    onClick={() =>
                      applyFormat("insertOrderedList", contentEditorRef)
                    }
                    title="Numbered List"
                    aria-label="Numbered list"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<UnorderedListOutlined />}
                    onClick={() =>
                      applyFormat("insertUnorderedList", contentEditorRef)
                    }
                    title="Bullet List"
                    aria-label="Bullet list"
                  />
                  <Button
                    type="text"
                    size="small"
                    onClick={() => applyQuote(contentEditorRef)}
                    title="Quote"
                    aria-label="Quote"
                  >
                    &quot;
                  </Button>
                </Space>
                <div
                  ref={contentEditorRef}
                  contentEditable
                  onInput={handleContentInput}
                  onMouseDown={handleContentSelectionChange}
                  onMouseUp={handleContentSelectionChange}
                  onClick={handleContentSelectionChange}
                  onKeyDown={handleContentSelectionChange}
                  onKeyUp={handleContentSelectionChange}
                  onFocus={handleContentSelectionChange}
                  className="border border-gray-300 rounded p-3 min-h-[300px] focus:outline-none focus:border-blue-500"
                  style={{ backgroundColor: "white" }}
                  data-placeholder="Type something here..."
                />
              </div>
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {contentValue.replace(/<[^>]*>/g, "").trim().length} / 3,000
              </Text>
            </Flex>

            <Divider />

            {/* Category Field */}
            <Form.Item
              label={
                <Text strong className="text-base">
                  Category
                </Text>
              }
              name="categoryId"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                size="large"
                placeholder="Select a category"
                loading={loadingCategories}
                options={categories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                optionFilterProp="label"
                showSearch
                allowClear
              />
            </Form.Item>

            <Divider />

            {/* Tags Field */}
            <Form.Item
              label={
                <Text strong className="text-base">
                  Tags
                </Text>
              }
              name="tags"
            >
              <Select
                mode="tags"
                options={tags.map((tag) => ({
                  label: tag.name,
                  value: tag.name,
                }))}
                size="large"
                loading={loadingTags}
                placeholder="Type to search or add new tags"
                value={selectedTags}
                onChange={setSelectedTags}
                maxTagCount="responsive"
                showSearch
                tokenSeparators={[","]}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            {/* Action Buttons */}
            <Form.Item className="!mb-0">
              <Flex justify="flex-end" gap="middle" className="pt-4">
                <Button
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => setSubmitStatus("draft")}
                  htmlType="submit"
                  loading={loading}
                >
                  Save Draft
                </Button>
                <Button
                  size="large"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    form.resetFields()
                    setTitleContent("")
                    setContentValue("")
                    setSelectedTags([])
                    setSubmitStatus("published")
                  }}
                  disabled={loading}
                >
                  Leave
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => setSubmitStatus("published")}
                  loading={loading}
                >
                  Post
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-8 py-4">
        <Flex justify="space-between" align="center">
          <Text type="secondary" className="text-sm">
            © 2025 - KMSPlus. Designed by <Text strong>KMS Team</Text>. All
            rights reserved
          </Text>
          <Space size="large">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              FAQs
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Terms & Condition
            </a>
          </Space>
        </Flex>
      </footer>
    </Flex>
  )
}
