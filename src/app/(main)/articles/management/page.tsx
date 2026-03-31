"use client"

import React, {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react"
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Flex,
  Typography,
  Tag as AntTag,
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
  Upload,
  Pagination,
} from "antd"
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CloseOutlined,
  SaveOutlined,
  RollbackOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import ImgCrop from "antd-img-crop"
import type { ColumnsType } from "antd/es/table"
import type { FormInstance } from "antd/es/form"
import {
  filterByTagAndCategory,
  getAllTags,
  deleteArticle,
  getAllCategories,
  createArticle,
  getArticleById,
  updateArticle,
  restoreArticle,
  getCurrentUserDetail,
  type CurrentUserInfo,
} from "@/action/articles/articlesManagementAction"
import { getAllDepartments } from "@/action/department/departmentActions"
import type { Article, Tag } from "@/service/articles.service"
import {
  uploadImageToCloudinary,
  getCloudinaryThumbnailUrl,
} from "@/lib/cloudinary"
import QuillEditor from "@/components/QuillEditor"

if (typeof window !== "undefined") {
  ;(window as any).React = React
}

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
      ;("Could not restore selection")
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
  const PAGE_SIZE = 10
  const THUMBNAIL_MAX_SIZE_MB = 10
  const THUMBNAIL_MAX_SIZE_BYTES = THUMBNAIL_MAX_SIZE_MB * 1024 * 1024
  const THUMBNAIL_ASPECT_RATIO = 4 / 3
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [selectedTag, setSelectedTag] = useState("All Tags")
  const [selectedCategory, setSelectedCategory] = useState<number | "All">(
    "All"
  )
  const [selectedDepartment, setSelectedDepartment] = useState<number | "All">(
    "All"
  )
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [titleContent, setTitleContent] = useState("")
  const [contentValue, setContentValue] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("") // New: Cloudinary thumbnail
  const [thumbnailUploadError, setThumbnailUploadError] = useState("")
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>(
    []
  )
  const [submitStatus, setSubmitStatus] = useState<
    "draft" | "published" | "pending"
  >("published")
  const [creatingArticle, setCreatingArticle] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false) // New
  const [categoryIdFormValue, setCategoryIdFormValue] = useState<
    number | undefined
  >(undefined)
  const titleEditorRef = useRef<HTMLDivElement>(null)

  const [articles, setArticles] = useState<Article[]>([])
  const [totalArticles, setTotalArticles] = useState(0)
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [articlesError, setArticlesError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [enforceCreatorOnlyEdit, setEnforceCreatorOnlyEdit] = useState(false)

  const [tags, setTags] = useState<Tag[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [categories, setCategories] = useState<
    { id: number; name: string; department_id?: number | null }[]
  >([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null)
  const [editForm] = Form.useForm()
  const [editTitleContent, setEditTitleContent] = useState("")
  const [editContentValue, setEditContentValue] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([])
  const [editSubmitStatus, setEditSubmitStatus] = useState<
    "draft" | "published" | "pending"
  >("published")
  const [editingArticle, setEditingArticle] = useState(false)
  const [loadingEditData, setLoadingEditData] = useState(false)
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("") // New
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false) // New
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>(
    undefined
  )

  const statusColors: Record<string, string> = {
    published: "green",
    draft: "blue",
    pending: "gold",
    rejected: "red",
    archived: "red",
  }

  const formatVietnamDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "-"
    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return "-"
    return parsedDate.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const canEditArticle = (article: Article) => {
    if (!enforceCreatorOnlyEdit) return true
    if (!currentUserId) return false
    return Number(article.author_id) === Number(currentUserId)
  }

  const refreshCurrentArticles = async (showLoader: boolean = true) => {
    if (loadingUserInfo) return

    setArticlesError(null)
    if (showLoader) setLoadingArticles(true)
    try {
      const catId = selectedCategory === "All" ? undefined : selectedCategory
      let statusFilter = selectedStatus === "All" ? undefined : selectedStatus
      let isDeletedFilter: "all" | boolean = "all"

      // If status filter is 'archived', set isDeletedFilter to true and reset statusFilter
      if (statusFilter === "archived") {
        isDeletedFilter = true
        statusFilter = undefined
      }

      const res = await filterByTagAndCategory(
        debouncedSearchQuery,
        selectedTag,
        catId,
        statusFilter,
        isDeletedFilter,
        sortOrder,
        currentPage,
        PAGE_SIZE
      )

      setArticles(res?.data || [])
      setTotalArticles(res?.total || 0)
      setCurrentUserId(res?.currentUserId ?? null)
      setEnforceCreatorOnlyEdit(Boolean(res?.isHeadOfDepartmentView))
    } catch (err: any) {
      setArticlesError(err?.message || String(err))
      setArticles([])
      setTotalArticles(0)
    } finally {
      if (showLoader) setLoadingArticles(false)
    }
  }

  const handleEditorChange = (value: string) => {
    setContentValue(value)

    const imgRegex = /<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>/g
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

  // New: Handle thumbnail upload
  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true)
    try {
      const result = await uploadImageToCloudinary(file, "article-thumbnails")
      setThumbnailUrl(result.secure_url)
      setThumbnailUploadError("")
      message.success("Thumbnail uploaded successfully")
    } catch (error: any) {
      console.error("Upload error:", error)
      const rawError = error?.message || "Failed to upload thumbnail"
      if (/file size too large/i.test(rawError)) {
        const tooLargeError = `Ảnh thumbnail vượt quá ${THUMBNAIL_MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`
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

  // New: Handle edit thumbnail upload
  const handleEditThumbnailUpload = async (file: File) => {
    setUploadingEditThumbnail(true)
    try {
      const result = await uploadImageToCloudinary(file, "article-thumbnails")
      setEditThumbnailUrl(result.secure_url)
      message.success("Thumbnail uploaded successfully")
    } catch (error: any) {
      console.error("Upload error:", error)
      message.error(error?.message || "Failed to upload thumbnail")
    } finally {
      setUploadingEditThumbnail(false)
    }
  }

  const filterKeyRef = useRef("")
  useEffect(() => {
    const nextFilterKey = [
      debouncedSearchQuery,
      selectedTag,
      String(selectedCategory),
      selectedStatus,
      sortOrder,
    ].join("|")

    const hasFilterChanged = filterKeyRef.current !== nextFilterKey
    filterKeyRef.current = nextFilterKey

    if (hasFilterChanged && currentPage !== 1) {
      setCurrentPage(1)
      return
    }

    if (!loadingUserInfo) {
      refreshCurrentArticles()
    }
  }, [
    debouncedSearchQuery,
    selectedTag,
    selectedCategory,
    selectedStatus,
    sortOrder,
    currentPage,
    loadingUserInfo,
  ])

  useEffect(() => {
    ;(async () => {
      try {
        setLoadingUserInfo(true)
        const user = await getCurrentUserDetail()
        if (user) {
          setCurrentUser(user)
          setUserRoles(user.roles || [])
          setIsAdmin(user.isAdmin || false)
          if (!user.isAdmin && user.department_id) {
            setSelectedDepartment(user.department_id)
          }
        }
      } catch (err) {
        console.error("Error loading user info:", err)
        setCurrentUser(null)
        setUserRoles([])
        setIsAdmin(false)
      } finally {
        setLoadingUserInfo(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoadingTags(true)
      try {
        const res = await getAllTags()
        setTags((res as Tag[]) || [])
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
        let filteredCategories = res || []

        // Nếu user không phải admin, chỉ hiển thị categories của department user đó
        if (!isAdmin && currentUser?.department_id) {
          filteredCategories = filteredCategories.filter(
            (cat) => cat.department_id === currentUser.department_id
          )
        }

        setCategories(filteredCategories)
      } catch (err) {
        console.error("Error loading categories:", err)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    })()
  }, [isAdmin, currentUser?.department_id])

  useEffect(() => {
    ;(async () => {
      if (!isAdmin) {
        setDepartments([])
        setLoadingDepartments(false)
        return
      }

      setLoadingDepartments(true)
      try {
        const res = await getAllDepartments()
        setDepartments(res || [])
      } catch (err) {
        console.error("Error loading departments:", err)
        setDepartments([])
      } finally {
        setLoadingDepartments(false)
      }
    })()
  }, [isAdmin])

  const columns: ColumnsType<Article> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      fixed: "left",
    },
    {
      title: "Article Title",
      dataIndex: "title",
      key: "title",
      width: 280,
      ellipsis: true,
      render: (title: string, record: Article) => (
        <a
          href={`/articles/${record.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          {title?.trim() || "(No title)"}
        </a>
      ),
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
              <AntTag key={tag} color="blue">
                {tag}
              </AntTag>
            ))}
            {hiddenTags.length > 0 && (
              <Tooltip title={hiddenTags.join(", ")}>
                <AntTag color="default">+{hiddenTags.length}</AntTag>
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
    // New: Thumbnail column
    {
      title: "Thumbnail",
      dataIndex: "thumbnail_url",
      key: "thumbnail_url",
      width: 120,
      render: (thumbnailUrl: string, record: Article) => {
        const src = thumbnailUrl || record.image_url
        if (!src) {
          return <Text type="secondary">No image</Text>
        }

        return (
          <img
            src={src}
            alt="Thumbnail"
            className="w-20 h-16 object-cover rounded"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                "https://via.placeholder.com/80x60?text=No+Image"
            }}
          />
        )
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string, record: Article) => {
        const displayStatus = record.is_deleted ? "archived" : status
        const displayText = record.is_deleted ? "Archived" : status
        return (
          <AntTag color={statusColors[displayStatus] || "default"}>
            {displayText}
          </AntTag>
        )
      },
    },
    {
      title: "Approved At",
      dataIndex: "approved_at",
      key: "approved_at",
      width: 170,
      render: (date: Date | null) => <Text>{formatVietnamDateTime(date)}</Text>,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (date: Date) => <Text>{formatVietnamDateTime(date)}</Text>,
    },
    {
      title: "Deleted At",
      dataIndex: "deleted_at",
      key: "deleted_at",
      width: 170,
      render: (date: Date | null) => <Text>{formatVietnamDateTime(date)}</Text>,
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 150,
      render: (date: Date) => (
        <Text type="warning">{formatVietnamDateTime(date)}</Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {canEditArticle(record) && (
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditModal(Number(record.id))}
            />
          )}
          <Button
            type="text"
            danger={!record.is_deleted}
            icon={record.is_deleted ? <RollbackOutlined /> : <DeleteOutlined />}
            size="small"
            loading={deletingId === Number(record.id)}
            onClick={() =>
              handleArchiveClick(Number(record.id), !!record.is_deleted)
            }
          />
        </Space>
      ),
    },
  ]

  const tagOptions = [
    { label: "All Tags", value: "All Tags" },
    ...tags.map((tag) => ({ label: tag.name, value: tag.name })),
  ]

  const filteredCategoriesByDepartment =
    isAdmin && selectedDepartment !== "All"
      ? categories.filter((cat) => cat.department_id === selectedDepartment)
      : categories

  const departmentOptions = isAdmin
    ? [
        { label: "All Departments", value: "All" },
        ...departments.map((dept) => ({ label: dept.name, value: dept.id })),
      ]
    : departments
        .filter((dept) => dept.id === currentUser?.department_id)
        .map((dept) => ({ label: dept.name, value: dept.id }))

  const categoryOptions = [
    { label: "All Categories", value: "All" },
    ...filteredCategoriesByDepartment.map((cat) => ({
      label: cat.name,
      value: cat.id,
    })),
  ]

  const statusOptions = [
    { label: "All Status", value: "All" },
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
    { label: "Archived", value: "archived" },
  ]

  const scopedCategoriesByUserDepartment = !isAdmin
    ? categories.filter(
        (cat) => cat.department_id === currentUser?.department_id
      )
    : categories

  const formCategoriesByDepartment = scopedCategoriesByUserDepartment

  const editFormCategoriesByDepartment = scopedCategoriesByUserDepartment

  const handleArchiveClick = async (articleId: number, isDeleted: boolean) => {
    const confirmText = isDeleted
      ? "Restore this article?"
      : "Archive this article? (This will mark it as archived)"
    const ok = window.confirm(confirmText)
    if (!ok) return
    try {
      setDeletingId(articleId)
      const res = isDeleted
        ? await restoreArticle(articleId)
        : await deleteArticle(articleId)
      if (!res.success) {
        throw new Error(res.message || "Failed to update")
      }
      await refreshCurrentArticles(false)
    } catch (err: any) {
      setArticlesError(err?.message || "Failed to update")
    } finally {
      setDeletingId(null)
    }
  }

  const openEditModal = async (articleId: number) => {
    setEditingArticleId(articleId)
    setIsEditModalOpen(true)
    setLoadingEditData(true)

    try {
      const result: any = await getArticleById(articleId)
      if (result.success && result.data) {
        const article = result.data
        setEditTitleContent(article.title || "")
        setEditContentValue(article.content || "")
        setEditImageUrl(article.image_url || "")
        setEditThumbnailUrl(article.thumbnail_url || "")
        setEditSelectedTags(article.tags || [])
        setEditCategoryId(article.category_id || undefined)

        editForm.setFieldsValue({
          title: article.title,
          content: article.content,
          categoryId: article.category_id,
          tags: article.tags,
        })
      } else {
        message.error("Failed to load article")
        setIsEditModalOpen(false)
      }
    } catch (err: any) {
      message.error("Failed to load article")
      setIsEditModalOpen(false)
    } finally {
      setLoadingEditData(false)
    }
  }

  const handleEditEditorChange = (value: string) => {
    setEditContentValue(value)

    const imgRegex = /<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>/g
    let match
    let firstImage = ""

    while ((match = imgRegex.exec(value)) !== null) {
      if (match[1]) {
        firstImage = match[1]
        break
      }
    }

    setEditImageUrl(firstImage)
  }

  const handleEditSubmit = async (values: any) => {
    if (!editingArticleId) return
    setEditingArticle(true)

    try {
      const formData = new FormData()
      formData.append("id", String(editingArticleId))
      formData.append("title", editTitleContent)
      formData.append("content", editContentValue)
      formData.append("status", editSubmitStatus)
      formData.append("tags", JSON.stringify(editSelectedTags))
      formData.append(
        "category_id",
        values?.categoryId ? String(values.categoryId) : ""
      )
      formData.append("image_url", editImageUrl)
      // New: Add thumbnail from Cloudinary
      if (editThumbnailUrl) {
        formData.append("thumbnail_url", editThumbnailUrl)
      }

      const result = await updateArticle(formData)
      if (result.success) {
        message.success(result.message || "Article updated successfully!")
        setIsEditModalOpen(false)
        editForm.resetFields()
        setEditTitleContent("")
        setEditContentValue("")
        setEditImageUrl("")
        setEditThumbnailUrl("") // Reset thumbnail
        setEditSelectedTags([])
        setEditingArticleId(null)
        setEditSubmitStatus("published")
        await refreshCurrentArticles(false)
      } else {
        message.error(result.message || "Failed to update article")
      }
    } catch (error: any) {
      message.error(error?.message || "An error occurred")
    } finally {
      setEditingArticle(false)
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          Article Management
        </h1>
        <div
          className="flex align-center justify-between gap-6"
          style={{ marginBottom: 16 }}
        >
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Manage and organize your articles
          </p>
          <Button
            style={{
              background: "#ffffff",
              borderColor: "#1e40af",
              borderWidth: "1.5px",
              borderRadius: "0.375rem",
              color: "#1e40af",
              fontSize: "12px",
              fontWeight: 500,
              height: "36px",
              paddingInline: "14px",
              boxShadow: "0 2px 8px rgba(30, 64, 175, 0.12)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            icon={<EditOutlined />}
            onClick={() => {
              createForm.resetFields()
              setTitleContent("")
              setContentValue("")
              setSelectedTagsForCreate([])
              setSubmitStatus("published")
              setImageUrl("")
              setThumbnailUrl("")
              setIsModalOpen(true)
            }}
            onMouseEnter={(e) => {
              const button = e.currentTarget as HTMLButtonElement
              button.style.background = "#f8fafc"
              button.style.boxShadow = "0 8px 20px rgba(30, 64, 175, 0.2)"
              button.style.borderColor = "#1e3a8a"
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget as HTMLButtonElement
              button.style.background = "#ffffff"
              button.style.boxShadow = "0 2px 8px rgba(30, 64, 175, 0.12)"
              button.style.borderColor = "#1e40af"
            }}
          >
            Create Article
          </Button>
        </div>
        <Divider
          style={{ borderColor: "rgba(37, 99, 235, 0.15)", margin: "16px 0" }}
        />
      </div>

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

      {/* Controls Widget - White Card (Compact) */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="space-y-3">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder="Search articles..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="middle"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ marginBottom: 12 }}
          />

          {/* Filters Grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-6" : "lg:grid-cols-5"} gap-4`}
          >
            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Tags
              </Text>
              <Select
                value={selectedTag}
                onChange={setSelectedTag}
                options={tagOptions}
                loading={loadingTags}
                size="middle"
                className="w-full"
              />
            </div>

            {isAdmin && (
              <div className="flex flex-col">
                <Text type="secondary" className="text-sm font-medium mb-2">
                  Department
                </Text>
                <Select
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  options={departmentOptions}
                  loading={loadingDepartments}
                  size="middle"
                  className="w-full"
                />
              </div>
            )}

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Category
              </Text>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
                loading={loadingCategories}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Status
              </Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={statusOptions}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Sort By
              </Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: "Newest First", value: "newest" },
                  { label: "Oldest First", value: "oldest" },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-end">
              <Text type="secondary" className="text-sm font-medium mb-2">
                View Mode
              </Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as "list" | "grid")}
                options={[
                  { label: "List", value: "list" },
                  { label: "Grid", value: "grid" },
                ]}
                block
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Widget - White Card (Full Width) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            {viewMode === "list" ? (
              <Table
                columns={columns}
                dataSource={articles}
                loading={loadingArticles}
                rowKey="id"
                scroll={{ x: 1800 }}
                pagination={{
                  current: currentPage,
                  pageSize: 10,
                  total: articles.length,
                  onChange: setCurrentPage,
                  showSizeChanger: false,
                }}
              />
            ) : (
              <div className="p-6">
                <Spin spinning={loadingArticles}>
                  <Row gutter={[16, 16]}>
                    {articles.map((article) => {
                      const tagList = (article.article_tags || "")
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                      const displayStatus = article.is_deleted
                        ? "archived"
                        : article.status
                      const displayText = article.is_deleted
                        ? "Deleted"
                        : article.status
                      return (
                        <Col xs={24} sm={12} lg={8} xl={6} key={article.id}>
                          <Card
                            hoverable
                            title={article.title}
                            extra={
                              <AntTag
                                color={statusColors[displayStatus] || "default"}
                              >
                                {displayText}
                              </AntTag>
                            }
                            cover={
                              <img
                                src={
                                  article.thumbnail_url ||
                                  article.image_url ||
                                  "https://via.placeholder.com/240x160?text=No+Image"
                                }
                                alt="Thumbnail"
                                className="h-40 w-full object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/240x160?text=No+Image"
                                }}
                              />
                            }
                          >
                            <Space
                              direction="vertical"
                              size="small"
                              className="w-full"
                            >
                              <Text type="secondary">
                                Updated:{" "}
                                {formatVietnamDateTime(article.updated_at)}
                              </Text>
                              <Text type="secondary">
                                Created:{" "}
                                {formatVietnamDateTime(article.created_at)}
                              </Text>
                              <Text type="secondary">
                                Approved At:{" "}
                                {formatVietnamDateTime(article.approved_at)}
                              </Text>
                              <Text type="secondary">
                                Deleted At:{" "}
                                {formatVietnamDateTime(article.deleted_at)}
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
                                  <AntTag
                                    key={`${article.id}-${tag}`}
                                    color="blue"
                                  >
                                    {tag}
                                  </AntTag>
                                ))}
                              </Space>
                              <Space>
                                {canEditArticle(article) && (
                                  <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    size="small"
                                    onClick={() =>
                                      openEditModal(Number(article.id))
                                    }
                                  />
                                )}
                                <Button
                                  type="text"
                                  danger={!article.is_deleted}
                                  icon={
                                    article.is_deleted ? (
                                      <RollbackOutlined />
                                    ) : (
                                      <DeleteOutlined />
                                    )
                                  }
                                  size="small"
                                  loading={deletingId === Number(article.id)}
                                  onClick={() =>
                                    handleArchiveClick(
                                      Number(article.id),
                                      !!article.is_deleted
                                    )
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
                        <Alert
                          message="No articles found"
                          type="info"
                          showIcon
                        />
                      </Col>
                    )}
                  </Row>
                  {totalArticles > 0 && (
                    <Flex justify="end" className="mt-4">
                      <Pagination
                        current={currentPage}
                        pageSize={PAGE_SIZE}
                        total={totalArticles}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                      />
                    </Flex>
                  )}
                </Spin>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Article Modals */}
      <Modal
        title={
          <Title level={3} className="!mb-0">
            Create An Article
          </Title>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          createForm.resetFields()
          setTitleContent("")
          setContentValue("")
          setThumbnailUploadError("")
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
              formData.append("image_url", imageUrl)
              // New: Add thumbnail from Cloudinary
              if (thumbnailUrl) {
                formData.append("thumbnail_url", thumbnailUrl)
              }

              const result = await createArticle(formData)
              if (result.success) {
                message.success(
                  result.message || "Article created successfully!"
                )
                setIsModalOpen(false)
                createForm.resetFields()
                setTitleContent("")
                setContentValue("")
                setImageUrl("")
                setThumbnailUrl("") // Reset thumbnail
                setThumbnailUploadError("")
                setSelectedTagsForCreate([])
                setSubmitStatus("published")
                setCategoryIdFormValue(undefined)
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
          <Form.Item
            label={
              <Text strong className="text-xl">
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
            <div
              ref={titleEditorRef}
              contentEditable
              onInput={() => {
                if (titleEditorRef.current) {
                  setTitleContent(titleEditorRef.current.innerText)
                }
              }}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                e.preventDefault()
                const text = e.clipboardData
                  .getData("text/plain")
                  .replace(/\s+/g, " ")
                  .trim()
                document.execCommand("insertText", false, text)
              }}
              className="border border-gray-300 rounded p-3 min-h-[60px] focus:outline-none focus:border-blue-500 text-lg font-medium"
              style={{ backgroundColor: "white" }}
            />
          </Form.Item>

          <Flex justify="flex-end" align="center" className="mt-2 mb-4">
            <Text type="secondary" className="text-sm">
              {titleContent.replace(/<[^>]*>/g, "").trim().length} / 150
            </Text>
          </Flex>

          {/* New: Thumbnail Upload */}
          <Form.Item
            label={
              <Text strong className="text-base">
                Thumbnail Image
              </Text>
            }
            name="thumbnail"
          >
            <Flex vertical gap="middle">
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-40 h-30 object-cover rounded-lg border"
                />
              )}
              <ImgCrop
                aspect={THUMBNAIL_ASPECT_RATIO}
                quality={1}
                modalTitle="Crop thumbnail image"
              >
                <Upload
                  maxCount={1}
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isTooLarge = file.size > THUMBNAIL_MAX_SIZE_BYTES
                    if (isTooLarge) {
                      const tooLargeError = `Ảnh thumbnail vượt quá ${THUMBNAIL_MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`
                      setThumbnailUploadError(tooLargeError)
                      message.error(tooLargeError)
                      return Upload.LIST_IGNORE
                    }

                    setThumbnailUploadError("")
                    handleThumbnailUpload(file as File)
                    return false
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingThumbnail}
                    disabled={uploadingThumbnail}
                  >
                    {uploadingThumbnail
                      ? "Uploading..."
                      : "Click to Upload Thumbnail"}
                  </Button>
                </Upload>
              </ImgCrop>
              {thumbnailUploadError && (
                <Text type="danger" className="text-sm">
                  {thumbnailUploadError}
                </Text>
              )}
            </Flex>
          </Form.Item>

          <Divider />

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
                  const stripHtml = (html: string) => {
                    const tmp = document.createElement("DIV")
                    tmp.innerHTML = html
                    return tmp.textContent || tmp.innerText || ""
                  }
                  const textContent = stripHtml(contentValue).trim()
                  if (!textContent) {
                    return Promise.reject("Please enter content")
                  }
                  if (textContent.length > 5000) {
                    return Promise.reject(
                      "Content must be less than 5000 characters"
                    )
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <QuillEditor
              value={contentValue}
              onChange={handleEditorChange}
              placeholder="Write your content here..."
              height={400}
            />
          </Form.Item>

          <Flex justify="flex-end" align="center" className="mt-2 mb-4">
            <Text type="secondary" className="text-sm">
              {contentValue.replace(/<[^>]*>/g, "").trim().length} / 5,000
            </Text>
          </Flex>

          <Divider />

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
              options={formCategoriesByDepartment.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              optionFilterProp="label"
              showSearch
              allowClear
              value={categoryIdFormValue}
              onChange={(value) => setCategoryIdFormValue(value)}
            />
          </Form.Item>

          <Divider />

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
                  setCategoryIdFormValue(undefined)
                }}
                disabled={creatingArticle}
              >
                Cancel
              </Button>
              {isAdmin ? (
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
              ) : (
                <Tooltip title="Only Admin can publish. Your article will be pending for approval.">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={() => setSubmitStatus("pending")}
                    loading={creatingArticle}
                  >
                    Submit for Review
                  </Button>
                </Tooltip>
              )}
            </Flex>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Article"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          editForm.resetFields()
          setEditTitleContent("")
          setEditContentValue("")
          setEditSelectedTags([])
          setEditingArticleId(null)
          setEditSubmitStatus("published")
        }}
        footer={null}
        width={900}
        style={{ maxHeight: "90vh", overflow: "auto" }}
        getContainer={() => document.body}
      >
        <Spin spinning={loadingEditData} tip="Loading article...">
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
            validateTrigger="onBlur"
          >
            <Form.Item
              label={
                <Text strong className="text-xl">
                  Title
                </Text>
              }
              name="title"
              rules={[
                {
                  required: true,
                  validator: (_, value) => {
                    const textContent = editTitleContent
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
              <div
                contentEditable
                onInput={() => {
                  const div = document.querySelector(
                    "[contentEditable]"
                  ) as HTMLDivElement
                  if (div) {
                    setEditTitleContent(div.innerText)
                  }
                }}
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                  }
                }}
                onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                  e.preventDefault()
                  const text = e.clipboardData
                    .getData("text/plain")
                    .replace(/\s+/g, " ")
                    .trim()
                  document.execCommand("insertText", false, text)
                }}
                className="border border-gray-300 rounded p-3 min-h-[60px] focus:outline-none focus:border-blue-500 text-lg font-medium"
                style={{ backgroundColor: "white" }}
                suppressContentEditableWarning
              >
                {editTitleContent}
              </div>
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {editTitleContent.replace(/<[^>]*>/g, "").trim().length} / 150
              </Text>
            </Flex>

            {/* New: Edit Thumbnail Upload */}
            <Form.Item
              label={
                <Text strong className="text-base">
                  Thumbnail Image
                </Text>
              }
              name="editThumbnail"
            >
              <Flex vertical gap="middle">
                {editThumbnailUrl && (
                  <img
                    src={editThumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-40 h-30 object-cover rounded-lg border"
                  />
                )}
                <ImgCrop
                  aspect={THUMBNAIL_ASPECT_RATIO}
                  quality={1}
                  modalTitle="Crop thumbnail image"
                >
                  <Upload
                    maxCount={1}
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isTooLarge = file.size > THUMBNAIL_MAX_SIZE_BYTES
                      if (isTooLarge) {
                        const tooLargeError = `Ảnh thumbnail vượt quá ${THUMBNAIL_MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`
                        message.error(tooLargeError)
                        return Upload.LIST_IGNORE
                      }

                      handleEditThumbnailUpload(file as File)
                      return false
                    }}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingEditThumbnail}
                      disabled={uploadingEditThumbnail}
                    >
                      Click to Upload Thumbnail
                    </Button>
                  </Upload>
                </ImgCrop>
              </Flex>
            </Form.Item>

            <Divider />

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
                    const textContent = editContentValue
                      .replace(/<[^>]*>/g, "")
                      .trim()
                    if (!textContent) {
                      return Promise.reject("Please enter content")
                    }
                    if (textContent.length > 5000) {
                      return Promise.reject(
                        "Content must be less than 5000 characters"
                      )
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              {loadingEditData ? (
                <Spin
                  tip="Loading content..."
                  style={{
                    height: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              ) : (
                <QuillEditor
                  value={editContentValue}
                  onChange={handleEditEditorChange}
                  placeholder="Write your content here..."
                  height={400}
                />
              )}
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {editContentValue.replace(/<[^>]*>/g, "").trim().length} / 5,000
              </Text>
            </Flex>

            <Divider />

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
                options={editFormCategoriesByDepartment.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                optionFilterProp="label"
                showSearch
                allowClear
                value={editCategoryId}
                onChange={(value) => setEditCategoryId(value)}
              />
            </Form.Item>

            <Divider />

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
                value={editSelectedTags}
                onChange={setEditSelectedTags}
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

            <Form.Item className="!mb-0">
              <Flex justify="flex-end" gap="middle" className="pt-4">
                <Button
                  size="large"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setIsEditModalOpen(false)
                    editForm.resetFields()
                    setEditTitleContent("")
                    setEditContentValue("")
                    setEditSelectedTags([])
                    setEditingArticleId(null)
                    setEditSubmitStatus("published")
                    setEditCategoryId(undefined)
                  }}
                  disabled={editingArticle}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={() => setEditSubmitStatus("published")}
                  loading={editingArticle}
                >
                  Update
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}
