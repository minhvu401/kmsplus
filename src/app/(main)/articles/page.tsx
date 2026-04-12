"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Modal,
  Form,
  Spin,
  Empty,
  message,
  Input,
  Select,
  Upload,
  Grid,
  Pagination,
  Card,
  Space,
  Typography,
  Flex,
  Divider,
  Tooltip,
  Tag,
  Avatar,
} from "antd"
import {
  EditOutlined,
  UploadOutlined,
  SendOutlined,
  CloseOutlined,
  UserOutlined,
  MessageOutlined,
  ClearOutlined,
} from "@ant-design/icons"
import {
  getPublishedArticles,
  getAllTags,
  getAllCategories,
  createArticle,
  getTopAuthors,
} from "@/action/articles/articlesManagementAction"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import QuillEditor from "@/components/QuillEditor"
import { ArticleCard } from "@/components/ui/articles/article-card"
import { TopAuthors } from "@/components/ui/articles/top-authors"
import { ArticleSearch } from "@/components/ui/articles/article-search"
import { stripHtml } from "@/utils/sanitize"
import type { Article, TopAuthor } from "@/service/articles.service"

// Memoized Title Input Component - Using native input
const TitleInput = React.memo(
  React.forwardRef<
    HTMLInputElement,
    { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }
  >(({ onChange }, ref) => (
    <input
      ref={ref}
      type="text"
      placeholder="Nhập tiêu đề bài viết"
      onChange={onChange}
      autoComplete="off"
      style={{
        width: "100%",
        padding: "6px 11px",
        fontSize: "14px",
        lineHeight: "1.5",
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        boxSizing: "border-box",
        transition: "border-color 0.3s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#40a9ff"
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(24, 144, 255, 0.2)"
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#d9d9d9"
        e.currentTarget.style.boxShadow = "none"
      }}
    />
  ))
)

// Title Section Component - Isolated with memo
const TitleSection = React.memo(
  ({
    inputRef,
    onInputChange,
  }: {
    inputRef: React.Ref<any>
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }) => {
    const [charCount, setCharCount] = useState(0)

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCharCount(e.target.value.replace(/<[^>]*>/g, "").trim().length)
        onInputChange(e)
      },
      [onInputChange]
    )

    return (
      <>
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#111827",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Tiêu đề
          </span>
          <TitleInput ref={inputRef} onChange={handleChange} />
        </div>
        <Flex justify="flex-end" align="center" className="mb-4">
          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            {charCount} / 150
          </span>
        </Flex>
      </>
    )
  }
)

const { Text, Title, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function ViewArticlePage() {
  const THUMBNAIL_MAX_SIZE_MB = 10
  const THUMBNAIL_MAX_SIZE_BYTES = THUMBNAIL_MAX_SIZE_MB * 1024 * 1024
  const router = useRouter()
  const screens = useBreakpoint()
  const [articles, setArticles] = useState<Article[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingAuthors, setLoadingAuthors] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [titleContent, setTitleContent] = useState("")
  const [contentValue, setContentValue] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [thumbnailUploadError, setThumbnailUploadError] = useState("")
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>(
    []
  )
  const [selectedCategoryForCreate, setSelectedCategoryForCreate] = useState<
    number | undefined
  >()
  const [submitStatus, setSubmitStatus] = useState<
    "draft" | "published" | "pending"
  >("published")
  const [creatingArticle, setCreatingArticle] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const titleEditorRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<any>(null)
  const pageSize = 10
  const MAX_TAGS = 5

  const loadArticles = async () => {
    setLoading(true)
    try {
      const result = await getPublishedArticles({
        searchQuery,
        selectedTags,
        categoryId: selectedCategory,
        sortOrder,
        page: currentPage,
        pageSize,
      })

      setArticles(result?.data || [])
      setTotalArticles(result?.total || 0)
    } catch (err: any) {
      message.error("Lỗi tải bài viết")
      console.error(err)
      setArticles([])
      setTotalArticles(0)
    } finally {
      setLoading(false)
    }
  }

  const loadFilterData = async () => {
    setLoadingCategories(true)
    try {
      const { getCurrentUserDetail } =
        await import("@/action/articles/articlesManagementAction")
      const [tagsRes, categoriesRes, userRes] = await Promise.all([
        getAllTags(),
        getAllCategories(),
        getCurrentUserDetail(),
      ])

      const tagNames = (tagsRes || []).map((t: any) => t.name)
      setCurrentUser(userRes)

      // Filter categories based on user type
      let normalizedCategoriesTemp = Array.isArray(categoriesRes)
        ? categoriesRes
            .filter(
              (c: any) =>
                c?.id !== undefined &&
                c?.id !== null &&
                typeof c?.name === "string" &&
                c.name.trim().length > 0
            )
            .map((c: any) => ({
              id: Number(c.id),
              name: c.name.trim(),
              department_id: c.department_id,
            }))
            .filter(
              (c: any, index: number, arr: any[]) =>
                arr.findIndex((x) => x.id === c.id) === index
            )
        : []

      // For non-admin users, filter by department
      if (userRes && !userRes.isAdmin && userRes.department_id) {
        normalizedCategoriesTemp = normalizedCategoriesTemp.filter(
          (c) =>
            c.department_id === null ||
            c.department_id === userRes.department_id
        )
      }

      // Remove department_id before setting state
      const normalizedCategories = normalizedCategoriesTemp.map((c) => ({
        id: c.id,
        name: c.name,
      }))

      setTags(tagNames)
      setCategories(normalizedCategories)
    } catch (err) {
      console.error("Lỗi tải bộ lọc bài viết", err)
      setTags([])
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    loadFilterData()
    loadTopAuthors()
  }, [])

  useEffect(() => {
    loadArticles()
  }, [searchQuery, selectedTags, selectedCategory, sortOrder, currentPage])

  const loadTopAuthors = async () => {
    setLoadingAuthors(true)
    try {
      const authors = await getTopAuthors(5)
      setTopAuthors(authors)
    } catch (err) {
      console.error("Lỗi tải tác giả nổi bật", err)
    } finally {
      setLoadingAuthors(false)
    }
  }

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Don't update state - keep it in TitleSection only to prevent parent re-render
    },
    []
  )

  const resetCreateForm = () => {
    createForm.resetFields()
    setTitleContent("")
    setContentValue("")
    setImageUrl("")
    setThumbnailUrl("")
    setThumbnailUploadError("")
    setSelectedTagsForCreate([])
    setSelectedCategoryForCreate(undefined)
    setSubmitStatus("published")
    if (titleEditorRef.current) {
      titleEditorRef.current.innerText = ""
    }
    if (titleInputRef.current?.input) {
      titleInputRef.current.input.value = ""
    }
  }

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true)
    try {
      const result = await uploadImageToCloudinary(file, "article-thumbnails")
      setThumbnailUrl(result.secure_url)
      setThumbnailUploadError("")
      message.success("Ảnh bìa đã được tải lên")
    } catch (error: any) {
      const rawError = error?.message || "Lỗi tải ảnh bìa"
      if (/file size too large/i.test(rawError)) {
        const tooLargeError = `Ảnh bìa vượt quá ${THUMBNAIL_MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`
        setThumbnailUploadError(tooLargeError)
        message.error(tooLargeError)
      } else {
        setThumbnailUploadError(rawError)
        message.error(rawError)
      }
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleContentChange = (value: string) => {
    setContentValue(value)

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g
    let match
    let firstImage = ""

    while ((match = imgRegex.exec(value)) !== null) {
      if (match[1]) {
        firstImage = match[1]
        break
      }
    }

    setImageUrl(firstImage)
  }

  const handleCreateSubmit = async (values: any) => {
    const titleValue = titleInputRef.current?.input?.value || ""
    if (!titleValue.trim() || !contentValue.trim()) {
      message.error("Vui lòng nhập tiêu đề và nội dung")
      return
    }

    try {
      await createForm.validateFields(["tags"])
    } catch (err) {
      return
    }

    setCreatingArticle(true)
    try {
      const formData = new FormData()
      formData.append("title", titleValue)
      formData.append("content", contentValue)
      formData.append("status", submitStatus)
      formData.append("tags", JSON.stringify(selectedTagsForCreate))
      formData.append(
        "category_id",
        selectedCategoryForCreate ? String(selectedCategoryForCreate) : ""
      )
      formData.append("image_url", imageUrl)
      formData.append("thumbnail_url", thumbnailUrl)

      const result = await createArticle(formData)
      if (result.success) {
        message.success("Bài viết đã được tạo thành công!")
        setIsModalOpen(false)
        resetCreateForm()
        setCurrentPage(1)
        await loadArticles()
      } else {
        message.error(result.message || "Lỗi tạo bài viết")
      }
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra")
    } finally {
      setCreatingArticle(false)
    }
  }

  const titleSectionElement = useMemo(
    () => (
      <>
        <TitleSection
          inputRef={titleInputRef}
          onInputChange={handleTitleChange}
        />
        <Divider style={{ margin: "12px 0", borderColor: "#f3f4f6" }} />
      </>
    ),
    [titleInputRef, handleTitleChange]
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          Bài Viết
        </h1>
        <p className="text-gray-600 max-w-2xl leading-relaxed">
          Kho tàng tri thức & chia sẻ kinh nghiệm từ cộng đồng KMSPlus.
        </p>
        <Divider
          style={{ borderColor: "rgba(37, 99, 235, 0.15)", margin: "16px 0" }}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Search & Filters Widget - White Card (Compact) - Matches Q&A Design */}
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <Flex wrap="wrap" align="center" gap={8} style={{ width: "100%" }}>
              {/* Search - Full width on first row */}
              <div
                style={{
                  flex: "1 1 100%",
                  minWidth: "200px",
                  marginBottom: 12,
                }}
              >
                <ArticleSearch
                  value={searchQuery}
                  onSearch={(query) => {
                    setSearchQuery(query)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* Category Filter - Native Select like Q&A */}
              <select
                value={String(selectedCategory || "any")}
                onChange={(e) => {
                  const val =
                    e.target.value === "any" ? null : parseInt(e.target.value)
                  setSelectedCategory(val)
                  setCurrentPage(1)
                }}
                style={{
                  height: "36px",
                  padding: "0 10px",
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  fontSize: "13px",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderColor:
                    selectedCategory !== null ? "#2563eb" : "#e5e7eb",
                  flex: "1 1 auto",
                  minWidth: "140px",
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory === null) {
                    e.currentTarget.style.borderColor = "#60a5fa"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    selectedCategory !== null ? "#2563eb" : "#e5e7eb"
                }}
                title="Lọc theo danh mục"
              >
                <option value="any">Tất Cả Danh Mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Tags Filter - Ant Design Select Dropdown */}
              <Select
                mode="multiple"
                allowClear
                placeholder="Tất Cả Thẻ"
                value={selectedTags}
                onChange={(values) => {
                  setSelectedTags(values)
                  setCurrentPage(1)
                }}
                options={tags.map((tag) => ({ label: tag, value: tag }))}
                style={{
                  flex: "1 1 auto",
                  minWidth: "140px",
                }}
                optionFilterProp="label"
                showSearch
                maxTagCount="responsive"
              />

              {/* Sort */}
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as "newest" | "oldest")
                  setCurrentPage(1)
                }}
                style={{
                  height: "36px",
                  padding: "0 10px",
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  fontSize: "13px",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flex: "1 1 auto",
                  minWidth: "110px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#60a5fa"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb"
                }}
                title="Sắp xếp"
              >
                <option value="newest">Mới Nhất</option>
                <option value="oldest">Cũ Nhất</option>
              </select>

              {/* Clear Filters Button */}
              <Tooltip title="Xóa tất cả bộ lọc">
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setSelectedTags([])
                    setSelectedCategory(null)
                    setSortOrder("newest")
                    setSearchQuery("")
                    setCurrentPage(1)
                  }}
                  disabled={
                    selectedTags.length === 0 &&
                    selectedCategory === null &&
                    sortOrder === "newest" &&
                    searchQuery === ""
                  }
                  style={{
                    height: "36px",
                    padding: "0 12px",
                    color: !(
                      selectedTags.length === 0 &&
                      selectedCategory === null &&
                      sortOrder === "newest" &&
                      searchQuery === ""
                    )
                      ? "#ef4444"
                      : "#d1d5db",
                    opacity: !(
                      selectedTags.length === 0 &&
                      selectedCategory === null &&
                      sortOrder === "newest" &&
                      searchQuery === ""
                    )
                      ? 1
                      : 0.5,
                    cursor: !(
                      selectedTags.length === 0 &&
                      selectedCategory === null &&
                      sortOrder === "newest" &&
                      searchQuery === ""
                    )
                      ? "pointer"
                      : "not-allowed",
                  }}
                  icon={<ClearOutlined />}
                  title="Xóa bộ lọc"
                />
              </Tooltip>
            </Flex>
          </div>

          {/* Articles Grid - White Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {articles.length === 0 ? (
              <Empty
                description="Không tìm thấy bài viết nào"
                style={{ padding: "48px 0" }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {articles.map((article) => {
                    const snippet = stripHtml(
                      (article as any).content || ""
                    ).slice(0, 150)
                    const tagList = (article.article_tags || "")
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)

                    // Calculate reading time (estimate: 200 words per minute)
                    const wordCount = stripHtml(
                      (article as any).content || ""
                    ).split(/\s+/).length
                    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

                    return (
                      <ArticleCard
                        key={article.id}
                        id={article.id}
                        title={article.title}
                        snippet={snippet}
                        authorName={article.author_name || "Anonymous"}
                        authorAvatar={
                          (article as any).author_avatar_url || undefined
                        }
                        thumbnailUrl={article.thumbnail_url || undefined}
                        publishedAt={article.created_at}
                        readingTime={readingTime}
                        commentCount={Number(article.comment_count || 0)}
                        tags={tagList}
                        category={article.category_name || undefined}
                      />
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalArticles > pageSize && (
                  <>
                    <Divider
                      style={{ margin: "24px 0", borderColor: "#f3f4f6" }}
                    />
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ marginTop: 20 }}
                    >
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        Hiển thị{" "}
                        <span style={{ fontWeight: "500" }}>
                          {articles.length > 0
                            ? (currentPage - 1) * pageSize + 1
                            : 0}
                          -{Math.min(currentPage * pageSize, totalArticles)}
                        </span>{" "}
                        trên{" "}
                        <span style={{ fontWeight: "500" }}>
                          {totalArticles}
                        </span>{" "}
                        bài viết
                      </div>
                      <Pagination
                        current={currentPage}
                        total={totalArticles}
                        pageSize={pageSize}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                      />
                    </Flex>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar - Top Authors */}
        <div className="lg:col-span-1">
          <TopAuthors authors={topAuthors} isLoading={loadingAuthors} />
        </div>
      </div>

      {/* Create Article Modal */}
      <Modal
        key={isModalOpen ? "open" : "closed"}
        title="Tạo Bài Viết Mới"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          resetCreateForm()
        }}
        footer={null}
        width={900}
        style={{ maxHeight: "90vh", overflow: "auto" }}
        destroyOnClose
      >
        {/* Title - OUTSIDE Form to prevent re-render */}
        {titleSectionElement}

        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
          {/* Thumbnail Upload */}
          <Form.Item
            label={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Ảnh bìa
              </span>
            }
            extra={
              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                Tối đa {THUMBNAIL_MAX_SIZE_MB}MB
              </span>
            }
          >
            <Flex vertical gap="middle">
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  style={{
                    width: "160px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e7eb",
                  }}
                />
              )}
              <Upload
                maxCount={1}
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  const isTooLarge = file.size > THUMBNAIL_MAX_SIZE_BYTES
                  if (isTooLarge) {
                    const tooLargeError = `Ảnh bìa vượt quá ${THUMBNAIL_MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`
                    setThumbnailUploadError(tooLargeError)
                    message.error(tooLargeError)
                    return Upload.LIST_IGNORE
                  }

                  setThumbnailUploadError("")
                  handleThumbnailUpload(file)
                  return false
                }}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploadingThumbnail}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? "Đang tải lên..." : "Tải lên ảnh bìa"}
                </Button>
              </Upload>
              {thumbnailUploadError && (
                <Text type="danger" style={{ fontSize: "12px" }}>
                  {thumbnailUploadError}
                </Text>
              )}
            </Flex>
          </Form.Item>

          <Divider style={{ margin: "12px 0", borderColor: "#f3f4f6" }} />

          {/* Content */}
          <Form.Item
            label={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Nội dung
              </span>
            }
            rules={[
              {
                required: true,
                validator: () => {
                  const textContent = stripHtml(contentValue).trim()
                  if (!textContent) {
                    return Promise.reject("Vui lòng nhập nội dung")
                  }
                  if (textContent.length > 5000) {
                    return Promise.reject("Nội dung phải dưới 5000 ký tự")
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <QuillEditor
              value={contentValue}
              onChange={handleContentChange}
              placeholder="Viết nội dung bài viết..."
              height={400}
            />
          </Form.Item>

          <Flex justify="flex-end" align="center" className="mb-4">
            <span style={{ fontSize: "11px", color: "#6b7280" }}>
              {
                stripHtml(contentValue)
                  .replace(/<[^>]*>/g, "")
                  .trim().length
              }{" "}
              / 5,000
            </span>
          </Flex>

          <Divider style={{ margin: "12px 0", borderColor: "#f3f4f6" }} />

          {/* Category */}
          <Form.Item
            label={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Danh mục <span style={{ color: "#dc2626" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
            extra={
              categories.length === 0 && !loadingCategories ? (
                <span style={{ color: "#ef4444", fontSize: "11px" }}>
                  Không có danh mục nào có sẵn
                </span>
              ) : null
            }
          >
            <Select
              placeholder="Chọn danh mục"
              value={selectedCategoryForCreate}
              onChange={setSelectedCategoryForCreate}
              loading={loadingCategories}
              disabled={loadingCategories}
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              allowClear
            />
          </Form.Item>

          <Divider style={{ margin: "12px 0", borderColor: "#f3f4f6" }} />

          {/* Tags */}
          <Form.Item
            name="tags"
            label={
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Thẻ
              </span>
            }
            rules={[
              {
                validator: (_, value) => {
                  if (value && value.length > MAX_TAGS) {
                    return Promise.reject(`Tối đa ${MAX_TAGS} thẻ`)
                  }
                  return Promise.resolve()
                },
              },
            ]}
            validateTrigger="onChange"
          >
            <Select
              mode="tags"
              placeholder="Thêm hoặc chọn thẻ (tối đa 5)"
              value={selectedTagsForCreate}
              onChange={(values) => {
                if (values.length <= MAX_TAGS) {
                  setSelectedTagsForCreate(values)
                  createForm.setFieldsValue({ tags: values })
                  createForm.validateFields(["tags"])
                } else {
                  message.warning(`Tối đa ${MAX_TAGS} thẻ`)
                  setTimeout(() => {
                    createForm.setFieldsValue({ tags: selectedTagsForCreate })
                  }, 0)
                }
              }}
              options={
                selectedTagsForCreate.length >= MAX_TAGS
                  ? [...selectedTagsForCreate].map((tag) => ({
                      label: tag,
                      value: tag,
                    }))
                  : tags.map((tag) => ({ label: tag, value: tag }))
              }
            />
          </Form.Item>

          <Flex justify="flex-end" align="center" className="mb-4">
            <span
              style={{
                fontSize: "11px",
                color:
                  selectedTagsForCreate.length > MAX_TAGS
                    ? "#dc2626"
                    : "#6b7280",
              }}
            >
              {selectedTagsForCreate.length} / {MAX_TAGS}
            </span>
          </Flex>

          <Divider style={{ margin: "12px 0", borderColor: "#f3f4f6" }} />
          <Form.Item className="!mb-0">
            <Flex justify="flex-end" gap="middle" className="pt-4">
              <Button
                size="large"
                icon={<SendOutlined />}
                onClick={() => setSubmitStatus("draft")}
                htmlType="submit"
                loading={creatingArticle}
                disabled={selectedTagsForCreate.length > MAX_TAGS}
              >
                Lưu nháp
              </Button>
              <Button
                size="large"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsModalOpen(false)
                  resetCreateForm()
                }}
                disabled={creatingArticle}
              >
                Hủy
              </Button>
              <Tooltip
                title={
                  selectedTagsForCreate.length > MAX_TAGS
                    ? `Tối đa ${MAX_TAGS} thẻ`
                    : "Bài viết sẽ chờ phê duyệt từ Admin"
                }
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => setSubmitStatus("pending")}
                  loading={creatingArticle}
                  disabled={selectedTagsForCreate.length > MAX_TAGS}
                >
                  Gửi để phê duyệt
                </Button>
              </Tooltip>
            </Flex>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
