"use client"

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Flex,
  Typography,
  Tag,
  Card,
  Alert,
  Segmented,
  Row,
  Col,
  Spin,
  Modal,
  Form,
  Divider,
  message,
  Tooltip,
} from "antd"
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  SendOutlined,
  CloseOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import type { FormInstance } from "antd/es/form"
import {
  filterByTagAndCategory,
  getAllTags,
  deleteArticle,
  getAllCategories,
  createArticle,
} from "@/action/articles/articlesManagementAction"
import type { Article, Tag as TagType } from "@/service/articles.service"

const { Text, Title } = Typography

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Selection save/restore helpers
const saveSelection = (ref: React.MutableRefObject<Range | null>) => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    ref.current = selection.getRangeAt(0)
    return true
  }
  return false
}

const restoreSelection = (ref: React.MutableRefObject<Range | null>) => {
  const selection = window.getSelection()
  if (selection && ref.current) {
    try {
      selection.removeAllRanges()
      selection.addRange(ref.current)
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
  editorRef: React.RefObject<HTMLDivElement>,
  selectionRef: React.MutableRefObject<Range | null>
) => {
  restoreSelection(selectionRef)
  document.execCommand(command, false)
  focusEditor(editorRef)
}

const applyHeading = (
  level: string,
  editorRef: React.RefObject<HTMLDivElement>,
  selectionRef: React.MutableRefObject<Range | null>
) => {
  restoreSelection(selectionRef)
  document.execCommand("formatBlock", false, level)
  focusEditor(editorRef)
}

const applyQuote = (
  editorRef: React.RefObject<HTMLDivElement>,
  selectionRef: React.MutableRefObject<Range | null>
) => {
  restoreSelection(selectionRef)
  document.execCommand("formatBlock", false, "<blockquote>")
  focusEditor(editorRef)
}

export default function ArticleManagement() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [selectedTag, setSelectedTag] = useState("All Tags")
  const [selectedCategory, setSelectedCategory] = useState<number | "All">(
    "All"
  )
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Modal and create form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [titleContent, setTitleContent] = useState("")
  const [contentValue, setContentValue] = useState("")
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>(
    []
  )
  const [submitStatus, setSubmitStatus] = useState<"draft" | "published">(
    "published"
  )
  const [creatingArticle, setCreatingArticle] = useState(false)
  const titleEditorRef = useRef<HTMLDivElement>(null)
  const contentEditorRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)

  const [articles, setArticles] = useState<Article[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [articlesError, setArticlesError] = useState<string | null>(null)

  const [tags, setTags] = useState<TagType[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [loadingCategories, setLoadingCategories] = useState(false)

  const statusColors: Record<string, string> = {
    published: "green",
    draft: "blue",
    pending: "gold",
    archived: "default",
  }

  const refreshCurrentArticles = async (showLoader: boolean = true) => {
    setArticlesError(null)
    if (showLoader) setLoadingArticles(true)
    try {
      const catId = selectedCategory === "All" ? undefined : selectedCategory
      const statusFilter = selectedStatus === "All" ? undefined : selectedStatus
      const res = await filterByTagAndCategory(
        debouncedSearchQuery,
        selectedTag,
        catId,
        statusFilter
      )
      setArticles(res || [])
    } catch (err: any) {
      setArticlesError(err?.message || String(err))
      setArticles([])
    } finally {
      if (showLoader) setLoadingArticles(false)
    }
  }

  useEffect(() => {
    refreshCurrentArticles()
  }, [debouncedSearchQuery, selectedTag, selectedCategory, selectedStatus])

  useEffect(() => {
    ;(async () => {
      setLoadingTags(true)
      try {
        const res = await getAllTags()
        setTags((res as TagType[]) || [])
      } catch (err: any) {
        console.error("Error loading tags:", err)
        setTags([])
      } finally {
        setLoadingTags(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoadingCategories(true)
      try {
        const res = await getAllCategories()
        setCategories(res || [])
      } catch (err) {
        console.error("Error loading categories:", err)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    })()
  }, [])

  const columns: ColumnsType<Article> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Article Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Tag",
      dataIndex: "article_tags",
      key: "article_tags",
      width: 150,
      render: (tagString: string) => {
        if (!tagString) return <Text type="secondary">No tags</Text>
        const tagList = tagString
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)

        const visibleTags = tagList.slice(0, 2)
        const hiddenTags = tagList.slice(2)

        return (
          <Space size={[4, 4]} wrap>
            {visibleTags.map((tag) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
            {hiddenTags.length > 0 && (
              <Tooltip title={hiddenTags.join(", ")}>
                <Tag color="default">+{hiddenTags.length}</Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "Category",
      dataIndex: "category_name",
      key: "category_name",
      width: 150,
      render: (category: string | null) => <Text>{category || "null"}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 150,
      render: (date: Date) => (
        <Text type="warning">{new Date(date).toLocaleDateString()}</Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            loading={deletingId === Number(record.id)}
            onClick={() => handleArchiveClick(Number(record.id))}
          />
        </Space>
      ),
    },
  ]

  const tagOptions = [
    { label: "All Tags", value: "All Tags" },
    ...tags.map((tag) => ({ label: tag.name, value: tag.name })),
  ]

  const categoryOptions = [
    { label: "All Categories", value: "All" },
    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
  ]

  const statusOptions = [
    { label: "All Status", value: "All" },
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Pending", value: "pending" },
    { label: "Archived", value: "archived" },
  ]

  const handleArchiveClick = async (articleId: number) => {
    const ok = window.confirm("Archive this article?")
    if (!ok) return
    try {
      setDeletingId(articleId)
      const res = await deleteArticle(articleId)
      if (!res.success) {
        throw new Error(res.message || "Failed to archive")
      }
      await refreshCurrentArticles(false)
    } catch (err: any) {
      setArticlesError(err?.message || "Failed to archive")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Flex vertical className="flex-1 bg-gray-50">
      <main className="flex-1 overflow-auto px-8 py-6">
        <Card>
          <Flex justify="space-between" align="center" className="!mb-4">
            <Title level={3} className="!mb-0">
              Article Management
            </Title>
            <Segmented
              size="large"
              value={viewMode}
              onChange={(value) => setViewMode(value as "list" | "grid")}
              options={[
                { label: "List", value: "list" },
                { label: "Grid", value: "grid" },
              ]}
            />
          </Flex>
          {/* Search and Filter Bar */}
          <Space direction="vertical" size="middle" className="w-full mb-4">
            <Flex gap="middle" align="end">
              <Space direction="vertical" className="flex-1">
                <Text type="secondary">Search:</Text>
                <Input
                  placeholder="Search any ..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  allowClear
                />
              </Space>

              <Space direction="vertical" style={{ width: 220 }}>
                <Text type="secondary">Tags:</Text>
                <Select
                  value={selectedTag}
                  onChange={setSelectedTag}
                  options={tagOptions}
                  loading={loadingTags}
                  size="large"
                  className="w-full"
                />
              </Space>

              <Space direction="vertical" style={{ width: 220 }}>
                <Text type="secondary">Category:</Text>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categoryOptions}
                  loading={loadingCategories}
                  size="large"
                  className="w-full"
                />
              </Space>

              <Space direction="vertical" style={{ width: 180 }}>
                <Text type="secondary">Status:</Text>
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  size="large"
                  className="w-full"
                />
              </Space>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => {
                  createForm.resetFields()
                  setTitleContent("")
                  setContentValue("")
                  setSelectedTagsForCreate([])
                  setSubmitStatus("published")
                  setIsModalOpen(true)
                }}
              >
                Create Article
              </Button>
            </Flex>
          </Space>

          {/* Error Alert */}
          {articlesError && (
            <Alert
              message="Error"
              description={articlesError}
              type="error"
              showIcon
              closable
              className="mb-4"
            />
          )}

          {/* Table / Grid */}
          {viewMode === "list" ? (
            <Table
              columns={columns}
              dataSource={articles}
              loading={loadingArticles}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: 10,
                total: articles.length,
                onChange: setCurrentPage,
                showSizeChanger: false,
              }}
            />
          ) : (
            <Spin spinning={loadingArticles}>
              <Row gutter={[16, 16]}>
                {articles.map((article) => {
                  const tagList = (article.article_tags || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={article.id}>
                      <Card
                        hoverable
                        title={article.title}
                        extra={
                          <Tag
                            color={statusColors[article.status] || "default"}
                          >
                            {article.status}
                          </Tag>
                        }
                      >
                        <Space
                          direction="vertical"
                          size="small"
                          className="w-full"
                        >
                          <Text type="secondary">
                            Updated:{" "}
                            {new Date(article.updated_at).toLocaleDateString()}
                          </Text>
                          <div>
                            <Text type="secondary" strong>
                              Category:{" "}
                            </Text>
                            <Text>{article.category_name || "null"}</Text>
                          </div>
                          <Space wrap size={[4, 4]}>
                            {tagList.length === 0 && (
                              <Text type="secondary">No tags</Text>
                            )}
                            {tagList.map((tag) => (
                              <Tag key={`${article.id}-${tag}`} color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                          <Space>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              size="small"
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              loading={deletingId === Number(article.id)}
                              onClick={() =>
                                handleArchiveClick(Number(article.id))
                              }
                            />
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  )
                })}
                {!loadingArticles && articles.length === 0 && (
                  <Col span={24}>
                    <Alert message="No articles found" type="info" showIcon />
                  </Col>
                )}
              </Row>
            </Spin>
          )}
        </Card>
      </main>

      {/* Create Article Modal */}
      <Modal
        title="Create An Article"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          createForm.resetFields()
          setTitleContent("")
          setContentValue("")
          setSelectedTagsForCreate([])
          setSubmitStatus("published")
        }}
        footer={null}
        width={900}
        style={{ maxHeight: "90vh", overflow: "auto" }}
        getContainer={() => document.body}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            setCreatingArticle(true)
            try {
              const formData = new FormData()
              formData.append("title", titleContent)
              formData.append("content", contentValue)
              formData.append("status", submitStatus)
              formData.append("tags", JSON.stringify(selectedTagsForCreate))
              formData.append(
                "category_id",
                values?.categoryId ? String(values.categoryId) : ""
              )

              const result = await createArticle(formData)
              if (result.success) {
                message.success(
                  result.message || "Article created successfully!"
                )
                setIsModalOpen(false)
                createForm.resetFields()
                setTitleContent("")
                setContentValue("")
                setSelectedTagsForCreate([])
                setSubmitStatus("published")
                await refreshCurrentArticles(false)
              } else {
                message.error(result.message || "Failed to create article")
              }
            } catch (error: any) {
              message.error(error?.message || "An error occurred")
            } finally {
              setCreatingArticle(false)
            }
          }}
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
                onInput={() => {
                  if (titleEditorRef.current) {
                    setTitleContent(titleEditorRef.current.innerText)
                  }
                }}
                onMouseDown={() => saveSelection(savedSelectionRef)}
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    return
                  }
                  saveSelection(savedSelectionRef)
                }}
                onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                  e.preventDefault()
                  const text = e.clipboardData
                    .getData("text/plain")
                    .replace(/\s+/g, " ")
                    .trim()
                  document.execCommand("insertText", false, text)
                }}
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
                    applyHeading(
                      `<${value}>`,
                      contentEditorRef,
                      savedSelectionRef
                    )
                  }
                  popupMatchSelectWidth={false}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<BoldOutlined />}
                  onClick={() =>
                    applyFormat("bold", contentEditorRef, savedSelectionRef)
                  }
                  title="Bold"
                  aria-label="Bold"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ItalicOutlined />}
                  onClick={() =>
                    applyFormat("italic", contentEditorRef, savedSelectionRef)
                  }
                  title="Italic"
                  aria-label="Italic"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<UnderlineOutlined />}
                  onClick={() =>
                    applyFormat(
                      "underline",
                      contentEditorRef,
                      savedSelectionRef
                    )
                  }
                  title="Underline"
                  aria-label="Underline"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<OrderedListOutlined />}
                  onClick={() =>
                    applyFormat(
                      "insertOrderedList",
                      contentEditorRef,
                      savedSelectionRef
                    )
                  }
                  title="Numbered List"
                  aria-label="Numbered list"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={() =>
                    applyFormat(
                      "insertUnorderedList",
                      contentEditorRef,
                      savedSelectionRef
                    )
                  }
                  title="Bullet List"
                  aria-label="Bullet list"
                />
                <Button
                  type="text"
                  size="small"
                  onClick={() =>
                    applyQuote(contentEditorRef, savedSelectionRef)
                  }
                  title="Quote"
                  aria-label="Quote"
                >
                  &quot;
                </Button>
              </Space>
              <div
                ref={contentEditorRef}
                contentEditable
                onInput={() => {
                  if (contentEditorRef.current) {
                    setContentValue(contentEditorRef.current.innerHTML)
                  }
                }}
                onMouseDown={() => saveSelection(savedSelectionRef)}
                onMouseUp={() => saveSelection(savedSelectionRef)}
                onClick={() => saveSelection(savedSelectionRef)}
                onKeyDown={() => saveSelection(savedSelectionRef)}
                onKeyUp={() => saveSelection(savedSelectionRef)}
                onFocus={() => saveSelection(savedSelectionRef)}
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
              value={selectedTagsForCreate}
              onChange={setSelectedTagsForCreate}
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
                loading={creatingArticle}
              >
                Save Draft
              </Button>
              <Button
                size="large"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsModalOpen(false)
                  createForm.resetFields()
                  setTitleContent("")
                  setContentValue("")
                  setSelectedTagsForCreate([])
                  setSubmitStatus("published")
                }}
                disabled={creatingArticle}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SendOutlined />}
                onClick={() => setSubmitStatus("published")}
                loading={creatingArticle}
              >
                Post
              </Button>
            </Flex>
          </Form.Item>
        </Form>
      </Modal>

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
