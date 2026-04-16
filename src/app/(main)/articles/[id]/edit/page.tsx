"use client"

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react"
import { useRouter, useParams } from "next/navigation"
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
  Modal,
  Spin,
} from "antd"
import {
  SendOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import {
  getAllTags,
  getAllCategories,
} from "@/action/articles/articlesManagementAction"
import {
  getArticleById,
  updateArticle,
} from "@/action/articles/articlesManagementAction"
import type { Tag } from "@/service/articles.service"

const { Title, Text } = Typography

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [form] = Form.useForm()
  const [titleContent, setTitleContent] = useState("")
  const [contentValue, setContentValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const titleEditorRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)
  const pendingValuesRef = useRef<any>(null)

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
        console.error("Error restoring selection:", e)
      }
    }
  }

  const focusEditor = (editorRef: React.RefObject<HTMLDivElement | null>) => {
    editorRef.current?.focus({ preventScroll: true })
  }

  const applyFormat = (
    command: string,
    editorRef: React.RefObject<HTMLDivElement | null>
  ) => {
    restoreSelection()
    document.execCommand(command, false)
    focusEditor(editorRef)
  }

  const applyHeading = (
    level: string,
    editorRef: React.RefObject<HTMLDivElement | null>
  ) => {
    restoreSelection()
    document.execCommand("formatBlock", false, level)
    focusEditor(editorRef)
  }

  const applyQuote = (editorRef: React.RefObject<HTMLDivElement | null>) => {
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

  // Load article data
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [articleRes, tagsRes, categoriesRes] = await Promise.all([
          getArticleById(parseInt(articleId)),
          getAllTags(),
          getAllCategories(),
        ])

        if (
          !articleRes.success ||
          !("data" in articleRes) ||
          !articleRes.data
        ) {
          message.error("Failed to load article")
          router.push("/articles/management")
          return
        }

        const article = articleRes.data
        setTitleContent(article.title)
        setContentValue(article.content)
        setSelectedTags(article.tags || [])
        setTags(tagsRes || [])
        setCategories(categoriesRes || [])

        form.setFieldsValue({
          title: article.title,
          content: article.content,
          categoryId: article.category_id,
          tags: article.tags,
        })

        // Set editor content
        if (titleEditorRef.current) {
          titleEditorRef.current.innerText = article.title
        }
        if (contentEditorRef.current) {
          contentEditorRef.current.innerHTML = article.content
        }
      } catch (err: any) {
        console.error("Error loading article:", err)
        message.error("Failed to load article")
        router.push("/articles/management")
      } finally {
        setLoading(false)
      }
    })()
  }, [articleId, form, router])

  const handleSubmit = async (values: any) => {
    pendingValuesRef.current = values
    setShowConfirm(true)
  }

  const handleConfirmUpdate = async () => {
    const values = pendingValuesRef.current
    setShowConfirm(false)
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("id", articleId)
      formData.append("title", titleContent)
      formData.append("content", contentValue)
      formData.append(
        "category_id",
        values?.categoryId ? String(values.categoryId) : ""
      )
      formData.append("tags", JSON.stringify(selectedTags))

      const result = await updateArticle(formData)

      if (result.success) {
        message.success(result.message || "Article updated successfully!")
        router.push("/articles/management")
      } else {
        message.error(result.message || "Failed to update article")
      }
    } catch (error: any) {
      console.error("Error updating article:", error)
      message.error(error?.message || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Flex vertical className="flex-1 justify-center items-center">
        <Spin size="large" tip="Loading article..." />
      </Flex>
    )
  }

  return (
    <Flex vertical className="flex-1">
      <main className="flex-1 overflow-auto px-8 py-6">
        <Card className="max-w-4xl mx-auto">
          <Title level={2} className="!mb-6">
            Edit Article
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
              <input
                ref={titleInputRef}
                type="text"
                placeholder={titleContent || "Enter article title"}
                defaultValue={titleContent}
                onChange={(e) => setTitleContent(e.target.value)}
                className="border border-gray-300 rounded p-3 w-full focus:outline-none focus:border-blue-500"
                style={{ backgroundColor: "white" }}
                maxLength={150}
              />
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {titleContent.length} / 150
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
                    popupMatchSelectWidth={false}
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
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => router.push("/articles/management")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  loading={submitting}
                >
                  Post
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Card>
      </main>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Update"
        open={showConfirm}
        onOk={handleConfirmUpdate}
        onCancel={() => setShowConfirm(false)}
        okText="Post"
        cancelText="Cancel"
        okButtonProps={{ loading: submitting }}
      >
        <Text>Are you sure you want to post this updated article?</Text>
      </Modal>
    </Flex>
  )
}
