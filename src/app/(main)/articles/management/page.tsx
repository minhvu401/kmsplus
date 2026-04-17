"use client"

import React, {
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
  Avatar,
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
  InfoCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import ImgCrop from "antd-img-crop"
import type { ColumnsType } from "antd/es/table"
import type { FormInstance } from "antd/es/form"
import { rolePermissionsMap } from "@/config/RolePermission.config"
import { Permission } from "@/enum/permission.enum"
import { Role } from "@/enum/role.enum"
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
  approveArticle,
  rejectArticle,
  resubmitArticle,
  type CurrentUserInfo,
} from "@/action/articles/articlesManagementAction"
import type { Article, Tag } from "@/service/articles.service"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import QuillEditor from "@/components/QuillEditorLazy"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

if (typeof window !== "undefined") {
  ;(window as any).React = React
}

const { Text, Title, Paragraph } = Typography

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
  const router = useRouter()
  const { language } = useLanguageStore()
  const PAGE_SIZE = 10
  const MAX_TAGS = 5
  const THUMBNAIL_MAX_SIZE_MB = 10
  const THUMBNAIL_MAX_SIZE_BYTES = THUMBNAIL_MAX_SIZE_MB * 1024 * 1024
  const THUMBNAIL_ASPECT_RATIO = 4 / 3
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | "All">(
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
  const editTitleEditorRef = useRef<HTMLDivElement>(null)

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
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(true)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isResubmitMode, setIsResubmitMode] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [loadingPreviewData, setLoadingPreviewData] = useState(false)
  const [previewArticleId, setPreviewArticleId] = useState<number | null>(null)
  const [previewArticle, setPreviewArticle] = useState<{
    title: string
    content: string
    authorName: string
    authorAvatarUrl: string
    categoryName: string
    createdAt: Date | string | null
    thumbnailUrl: string
  } | null>(null)
  const [editForm] = Form.useForm()
  const [editTitleContent, setEditTitleContent] = useState("")
  const [editContentValue, setEditContentValue] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([])
  const [editSubmitStatus, setEditSubmitStatus] = useState<
    "draft" | "published" | "pending"
  >("published")
  const editSubmitStatusRef = useRef<"draft" | "published" | "pending">(
    "published"
  )
  const [editOriginalStatus, setEditOriginalStatus] = useState<string | null>(
    null
  )
  const [editingArticle, setEditingArticle] = useState(false)
  const [loadingEditData, setLoadingEditData] = useState(false)
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("") // New
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false) // New
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>(
    undefined
  )
  const [editCategoryName, setEditCategoryName] = useState<string | undefined>(
    undefined
  )

  // Reject modal states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectingArticleId, setRejectingArticleId] = useState<number | null>(
    null
  )
  const [rejectReason, setRejectReason] = useState("")
  const [isRejectingArticle, setIsRejectingArticle] = useState(false)
  const [approvingArticleId, setApprovingArticleId] = useState<number | null>(
    null
  )

  const [isViewReasonModalOpen, setIsViewReasonModalOpen] = useState(false)
  const [viewReason, setViewReason] = useState("")

  // Approve confirmation modal states
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [approveConfirmArticleId, setApproveConfirmArticleId] = useState<
    number | null
  >(null)
  const [isApprovingArticle, setIsApprovingArticle] = useState(false)

  // Delete confirmation modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteConfirmArticleId, setDeleteConfirmArticleId] = useState<
    number | null
  >(null)
  const [deleteConfirmIsDeleted, setDeleteConfirmIsDeleted] = useState(false)

  const statusColors: Record<string, string> = {
    published: "success",
    draft: "warning",
    pending: "processing",
    rejected: "error",
    archived: "default",
  }

  const DEFAULT_ARTICLE_THUMBNAIL =
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop"

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

  const formatStatusLabel = (status: string) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const canEditArticle = (article: Article) => {
    if (!enforceCreatorOnlyEdit) return true
    if (!currentUserId) return false
    return Number(article.author_id) === Number(currentUserId)
  }

  const canApproveArticle = () => {
    if (!currentUser?.roles || currentUser.roles.length === 0) {
      return false
    }

    // Check if user has APPROVE_ARTICLE permission through any of their roles
    return currentUser.roles.some((role) => {
      const roleObj = Object.values(Role).find(
        (r) => typeof r === "string" && r.toLowerCase() === role.toLowerCase()
      )
      if (!roleObj) {
        return false
      }
      const hasPermission = (
        rolePermissionsMap[roleObj as Role] || []
      ).includes(Permission.APPROVE_ARTICLE)
      return hasPermission
    })
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
      } else if (statusFilter && statusFilter !== "All") {
        isDeletedFilter = false
      }

      const res = await filterByTagAndCategory(
        debouncedSearchQuery,
        selectedTags,
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
      selectedTags.join(","),
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
    selectedTags,
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
        let filteredCategories = (res || []).filter(
          (cat) => Number(cat.id) !== 1
        )

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
    if (selectedCategory === 1) {
      setSelectedCategory("All")
    }
    if (categoryIdFormValue === 1) {
      setCategoryIdFormValue(undefined)
    }
    if (editCategoryId === 1) {
      setEditCategoryId(undefined)
      editForm.setFieldValue("categoryId", undefined)
    }
  }, [selectedCategory, categoryIdFormValue, editCategoryId, editForm])

  // Initialize edit title ref when edit modal opens with content
  useEffect(() => {
    if (
      isEditModalOpen &&
      !loadingEditData &&
      editTitleEditorRef.current &&
      editTitleContent
    ) {
      editTitleEditorRef.current.innerText = editTitleContent
    }
  }, [isEditModalOpen, loadingEditData])

  const columns: ColumnsType<Article> = [
    {
      title: t("article.table_title", language),
      dataIndex: "title",
      key: "title",
      width: 300,
      ellipsis: true,
      render: (title: string, record: Article) => (
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={
              record.thumbnail_url ||
              record.image_url ||
              DEFAULT_ARTICLE_THUMBNAIL
            }
            alt="Thumbnail"
            className="w-20 h-14 object-cover rounded flex-shrink-0"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = DEFAULT_ARTICLE_THUMBNAIL
            }}
          />
          <button
            type="button"
            className="min-w-0 text-left"
            onClick={() => openPreviewModal(Number(record.id))}
            title={title?.trim() || t("article.no_title", language)}
          >
            <div className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate">
              {title?.trim() || t("article.no_title", language)}
            </div>
            <Text type="secondary" className="text-xs block truncate">
              {record.category_name || t("article.no_category", language)}
            </Text>
          </button>
        </div>
      ),
    },
    {
      title: t("article.table_author", language),
      dataIndex: "author_name",
      key: "author_name",
      width: 220,
      render: (_: string | null, record: Article) => {
        const authorName =
          record.author_name || t("article.unknown_author", language)
        const initials = authorName
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()

        return (
          <div className="flex items-start gap-2 min-w-0">
            <Avatar size="small" src={record.author_avatar_url || undefined}>
              {initials}
            </Avatar>
            <Text className="whitespace-normal break-words leading-5">
              {authorName}
            </Text>
          </div>
        )
      },
    },
    {
      title: t("article.table_tag", language),
      dataIndex: "article_tags",
      key: "article_tags",
      width: 130,
      render: (tagString: string) => {
        if (!tagString)
          return <Text type="secondary">{t("article.no_tags", language)}</Text>
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
      title: t("article.table_status", language),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string, record: Article) => {
        const displayStatus = record.is_deleted ? "archived" : status
        const displayText = formatStatusLabel(displayStatus)
        return (
          <div className="flex items-center gap-0.2">
            <AntTag
              color={statusColors[displayStatus] || "default"}
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              {displayText}
            </AntTag>
            {displayStatus === "rejected" && (record as any).reason && (
              <Tooltip title={t("article.view_rejection_reason", language)}>
                <InfoCircleOutlined
                  className="text-red-600 cursor-pointer hover:text-red-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    setViewReason((record as any).reason || "")
                    setIsViewReasonModalOpen(true)
                  }}
                />
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: t("article.table_created", language),
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date: Date) => <Text>{formatVietnamDateTime(date)}</Text>,
    },
    {
      title: t("article.table_action", language),
      key: "action",
      width: 120,
      render: (_, record) => {
        const showApproveButtons =
          record.status === "pending" && canApproveArticle()

        // Build the list of visible action buttons
        const actionButtons: React.ReactNode[] = []

        if (canEditArticle(record)) {
          actionButtons.push(
            <Button
              key="edit"
              type="text"
              icon={<EditOutlined />}
              size="small"
              style={{ color: "#1677ff" }}
              onClick={() => openEditModal(Number(record.id))}
              title={t("article.btn_edit", language)}
            />
          )
        }

        actionButtons.push(
          <Button
            key={record.is_deleted ? "restore" : "delete"}
            type="text"
            danger={!record.is_deleted}
            icon={record.is_deleted ? <RollbackOutlined /> : <DeleteOutlined />}
            size="small"
            loading={deletingId === Number(record.id)}
            onClick={(e) => {
              e.stopPropagation()
              handleArchiveClick(Number(record.id), !!record.is_deleted)
            }}
            title={
              record.is_deleted
                ? t("article.btn_restore", language)
                : t("article.btn_delete", language)
            }
          />
        )

        // If article is rejected, show a resubmit icon that opens the resubmit/edit modal
        if (record.status === "rejected") {
          actionButtons.push(
            <Button
              key="resubmit"
              type="text"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleResubmitClick(Number(record.id))}
              title={t("article.btn_resubmit", language)}
            />
          )
        }

        if (showApproveButtons) {
          actionButtons.push(
            <Button
              key="approve"
              type="text"
              size="small"
              style={{ color: "#52c41a" }}
              onClick={() => handleApproveClick(Number(record.id))}
              loading={
                isApprovingArticle &&
                approveConfirmArticleId === Number(record.id)
              }
              title="Approve"
            >
              ✓
            </Button>
          )

          actionButtons.push(
            <Button
              key="reject"
              type="text"
              size="small"
              danger
              onClick={() => {
                setRejectingArticleId(Number(record.id))
                setIsRejectModalOpen(true)
              }}
              title="Reject"
            >
              ✕
            </Button>
          )
        }

        // If exactly 3 visible icons, render them inline on the same line.
        if (actionButtons.length === 3) {
          return <Space size="small">{actionButtons}</Space>
        }

        // Otherwise keep the current stacked layout (two rows)
        return (
          <Flex vertical gap={2}>
            <Space size="small" wrap>
              {actionButtons.slice(0, 2)}
            </Space>
            {actionButtons.length > 2 && (
              <Space size="small" wrap>
                {actionButtons.slice(2)}
              </Space>
            )}
          </Flex>
        )
      },
    },
  ]

  const tagOptions = tags.map((tag) => ({ label: tag.name, value: tag.name }))

  const categoryOptions = [
    { label: t("article.filter_all_categories", language), value: "All" },
    ...categories.map((cat) => ({
      label: cat.name,
      value: cat.id,
    })),
  ]

  const statusOptions = [
    { label: t("article.filter_all_status", language), value: "All" },
    { label: t("article.status.draft", language), value: "draft" },
    { label: t("article.status.published", language), value: "published" },
    { label: t("article.status.pending", language), value: "pending" },
    { label: t("article.status.rejected", language), value: "rejected" },
    { label: t("article.status.archived", language), value: "archived" },
  ]

  const scopedCategoriesByUserDepartment = !isAdmin
    ? categories.filter(
        (cat) => cat.department_id === currentUser?.department_id
      )
    : categories

  const formCategoriesByDepartment = scopedCategoriesByUserDepartment

  const editFormCategoriesByDepartment = scopedCategoriesByUserDepartment

  const handleArchiveClick = (articleId: number, isDeleted: boolean) => {
    console.log("Delete button clicked:", { articleId, isDeleted })
    setDeleteConfirmArticleId(articleId)
    setDeleteConfirmIsDeleted(isDeleted)
    setIsDeleteConfirmOpen(true)
  }

  const handleResubmitClick = async (articleId: number) => {
    setIsResubmitMode(true)
    // Open edit modal with article loaded; edit submit will call resubmit when isResubmitMode === true
    await openEditModal(articleId)
    // Ensure submit status will be 'pending' when user clicks submit
    setEditSubmitStatus("pending")
    editSubmitStatusRef.current = "pending"
  }

  const handleDeleteOrRestore = async (
    articleId: number,
    isDeleted: boolean
  ) => {
    try {
      setDeletingId(articleId)
      const res = isDeleted
        ? await restoreArticle(articleId)
        : await deleteArticle(articleId)

      console.log("Response from server:", res)

      if (!res.success) {
        throw new Error(res.message || "Failed to update article")
      }

      message.success(
        isDeleted
          ? "Article restored successfully"
          : "Article deleted successfully"
      )

      // Auto-switch to Archived view after delete to show the deleted article
      if (!isDeleted) {
        setSelectedStatus("archived")
        setCurrentPage(1)
      }

      await refreshCurrentArticles(false)
    } catch (err: any) {
      console.error("Error during delete/restore:", err)
      message.error(err?.message || "Failed to update")
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
        setEditOriginalStatus(article.status || null)
        if (
          article.status === "draft" ||
          article.status === "pending" ||
          article.status === "published"
        ) {
          setEditSubmitStatus(article.status)
          editSubmitStatusRef.current = article.status
        } else {
          setEditSubmitStatus("published")
          editSubmitStatusRef.current = "published"
        }
        setEditTitleContent(article.title || "")
        setEditContentValue(article.content || "")
        setEditImageUrl(article.image_url || "")
        setEditThumbnailUrl(article.thumbnail_url || "")
        setEditSelectedTags(article.tags || [])
        setEditCategoryId(article.category_id || undefined)
        setEditCategoryName(article.category_name || undefined)

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

  const openPreviewModal = async (articleId: number) => {
    setIsPreviewModalOpen(true)
    setLoadingPreviewData(true)
    setPreviewArticleId(articleId)

    try {
      const result: any = await getArticleById(articleId)
      if (result.success && result.data) {
        const article = result.data
        setPreviewArticle({
          title: article.title || "Untitled",
          content: article.content || "",
          authorName: article.author_name || "Unknown",
          authorAvatarUrl: article.author_avatar_url || "",
          categoryName: article.category_name || "No category",
          createdAt: article.created_at || null,
          thumbnailUrl:
            article.thumbnail_url ||
            article.image_url ||
            DEFAULT_ARTICLE_THUMBNAIL,
        })
      } else {
        message.error("Failed to load article preview")
        setIsPreviewModalOpen(false)
      }
    } catch (err: any) {
      message.error("Failed to load article preview")
      setIsPreviewModalOpen(false)
      setPreviewArticleId(null)
    } finally {
      setLoadingPreviewData(false)
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
      if (isResubmitMode) {
        // Call resubmit API action
        const result = await resubmitArticle(
          editingArticleId,
          editTitleContent,
          editContentValue,
          editSelectedTags,
          editCategoryId ?? null,
          currentUser?.department_id ?? null,
          editImageUrl || null,
          editThumbnailUrl || null
        )

        if (result.success) {
          message.success(result.message || "Article resubmitted successfully")
          setIsEditModalOpen(false)
          editForm.resetFields()
          setEditTitleContent("")
          setEditContentValue("")
          setEditImageUrl("")
          setEditThumbnailUrl("")
          setEditSelectedTags([])
          setEditingArticleId(null)
          setEditSubmitStatus("published")
          editSubmitStatusRef.current = "published"
          setEditOriginalStatus(null)
          setIsResubmitMode(false)
          await refreshCurrentArticles(false)
        } else {
          message.error(result.message || "Failed to resubmit article")
        }
      } else {
        const formData = new FormData()
        formData.append("id", String(editingArticleId))
        formData.append("title", editTitleContent)
        formData.append("content", editContentValue)
        formData.append("status", editSubmitStatusRef.current)
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
          editSubmitStatusRef.current = "published"
          setEditOriginalStatus(null)
          await refreshCurrentArticles(false)
        } else {
          message.error(result.message || "Failed to update article")
        }
      }
    } catch (error: any) {
      message.error(error?.message || "An error occurred")
    } finally {
      setEditingArticle(false)
    }
  }

  const handleApproveClick = (articleId: number) => {
    setApproveConfirmArticleId(articleId)
    setIsApproveConfirmOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!approveConfirmArticleId) return
    try {
      setIsApprovingArticle(true)
      const result = await approveArticle(approveConfirmArticleId)
      if (result.success) {
        message.success("Article approved successfully")
        setIsApproveConfirmOpen(false)
        setApproveConfirmArticleId(null)
        await refreshCurrentArticles(false)
      } else {
        message.error(result.message || "Failed to approve article")
      }
    } catch (err: any) {
      message.error(err?.message || "An error occurred")
    } finally {
      setIsApprovingArticle(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectingArticleId) return
    try {
      setIsRejectingArticle(true)
      const result = await rejectArticle(rejectingArticleId, rejectReason)
      if (result.success) {
        message.success("Article rejected successfully")
        setIsRejectModalOpen(false)
        setRejectReason("")
        setRejectingArticleId(null)
        await refreshCurrentArticles(false)
      } else {
        message.error(result.message || "Failed to reject article")
      }
    } catch (err: any) {
      message.error(err?.message || "An error occurred")
    } finally {
      setIsRejectingArticle(false)
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          {t("article.management.title", language)}
        </h1>
        <div
          className="flex align-center justify-between gap-6"
          style={{ marginBottom: 16 }}
        >
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            {t("article.management.description", language)}
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
            {t("article.btn_create", language) || "Create Article"}
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
            placeholder={t("article.search_placeholder", language)}
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
                {t("article.filter_tags", language)}
              </Text>
              <Select
                mode="multiple"
                allowClear
                value={selectedTags}
                onChange={(values) => {
                  setSelectedTags(values)
                  setCurrentPage(1)
                }}
                options={tagOptions}
                loading={loadingTags}
                size="middle"
                className="w-full"
                placeholder={t("article.filter_tags", language)}
                maxTagCount="responsive"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                {t("article.filter_category", language)}
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
                {t("article.filter_status", language)}
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
                {t("article.filter_sort_by", language)}
              </Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  {
                    label: t("article.sort_newest", language),
                    value: "newest",
                  },
                  {
                    label: t("article.sort_oldest", language),
                    value: "oldest",
                  },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-end">
              <Text type="secondary" className="text-sm font-medium mb-2">
                {t("article.filter_view_mode", language)}
              </Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as "list" | "grid")}
                options={[
                  { label: t("article.view_list", language), value: "list" },
                  { label: t("article.view_grid", language), value: "grid" },
                ]}
                block
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex flex-col justify-end">
              <Text type="secondary" className="text-sm font-medium mb-2">
                {t("article.filter_actions", language)}
              </Text>
              <Tooltip title={t("article.btn_clear_filters", language)}>
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedTags([])
                    setSelectedCategory("All")
                    setSelectedStatus("All")
                    setSortOrder("newest")
                    setCurrentPage(1)
                  }}
                  disabled={
                    searchQuery === "" &&
                    selectedTags.length === 0 &&
                    selectedCategory === "All" &&
                    selectedStatus === "All" &&
                    sortOrder === "newest"
                  }
                  danger
                  size="middle"
                  block
                >
                  {t("article.btn_clear_filters", language)}
                </Button>
              </Tooltip>
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
                pagination={{
                  current: currentPage,
                  pageSize: PAGE_SIZE,
                  total: totalArticles,
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
                      const displayText = formatStatusLabel(displayStatus)
                      return (
                        <Col xs={24} sm={12} lg={8} xl={6} key={article.id}>
                          <Card
                            hoverable
                            onClick={() => openPreviewModal(Number(article.id))}
                            className="cursor-pointer"
                            title={article.title}
                            extra={
                              <AntTag
                                color={statusColors[displayStatus] || "default"}
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              >
                                {displayText}
                              </AntTag>
                            }
                            cover={
                              <img
                                src={
                                  article.thumbnail_url ||
                                  article.image_url ||
                                  DEFAULT_ARTICLE_THUMBNAIL
                                }
                                alt="Thumbnail"
                                className="h-40 w-full object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    DEFAULT_ARTICLE_THUMBNAIL
                                }}
                              />
                            }
                          >
                            <Space
                              direction="vertical"
                              size="small"
                              className="w-full"
                            >
                              <Space size="small" align="center">
                                <Avatar
                                  size="small"
                                  src={article.author_avatar_url || undefined}
                                >
                                  {(article.author_name || "Unknown")
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </Avatar>
                                <Text>{article.author_name || "Unknown"}</Text>
                              </Space>
                              <Text type="secondary">
                                {t("article.grid_created_label", language)}{" "}
                                {formatVietnamDateTime(article.created_at)}
                              </Text>
                              <div>
                                <Text type="secondary" strong>
                                  {t(
                                    "article.grid_category_label",
                                    language
                                  )}{" "}
                                </Text>
                                <Text>{article.category_name || "null"}</Text>
                              </div>
                              <Space wrap size={[4, 4]}>
                                {tagList.length === 0 && (
                                  <Text type="secondary">
                                    {t("article.no_tags", language)}
                                  </Text>
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
                              <div className="flex gap-2 w-full">
                                {canEditArticle(article) && (
                                  <span className="flex-1">
                                    <Button
                                      type="text"
                                      icon={<EditOutlined />}
                                      size="small"
                                      className="w-full text-blue-600 hover:!text-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditModal(Number(article.id))
                                      }}
                                    >
                                      {t("article.grid_edit_article", language)}
                                    </Button>
                                  </span>
                                )}
                                <span className="flex-1">
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
                                    className={
                                      article.is_deleted
                                        ? "w-full hover:bg-gray-100"
                                        : "w-full hover:bg-red-50"
                                    }
                                    loading={deletingId === Number(article.id)}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleArchiveClick(
                                        Number(article.id),
                                        !!article.is_deleted
                                      )
                                    }}
                                  >
                                    {article.is_deleted
                                      ? t(
                                          "article.grid_restore_article",
                                          language
                                        )
                                      : t(
                                          "article.grid_delete_article",
                                          language
                                        )}
                                  </Button>
                                </span>
                              </div>
                              {article.status === "pending" &&
                                canApproveArticle() &&
                                !article.is_deleted && (
                                  <div className="flex gap-2 w-full">
                                    <span className="flex-1">
                                      <Button
                                        type="primary"
                                        size="small"
                                        className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                                        loading={
                                          isApprovingArticle &&
                                          approveConfirmArticleId ===
                                            Number(article.id)
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleApproveClick(Number(article.id))
                                        }}
                                      >
                                        Approve
                                      </Button>
                                    </span>
                                    <span className="flex-1">
                                      <Button
                                        danger
                                        size="small"
                                        className="w-full"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setRejectingArticleId(
                                            Number(article.id)
                                          )
                                          setIsRejectModalOpen(true)
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    </span>
                                  </div>
                                )}
                            </Space>
                          </Card>
                        </Col>
                      )
                    })}
                    {!loadingArticles && articles.length === 0 && (
                      <Col span={24}>
                        <Alert
                          message={t("article.grid_no_articles", language)}
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
            {t("article.form_create_modal_title", language)}
          </Title>
        }
        open={isModalOpen}
        centered
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
        styles={{
          body: {
            maxHeight: "78vh",
            overflowY: "auto",
            paddingRight: 32,
          },
        }}
        getContainer={() => document.body}
      >
        <Form
          form={createForm}
          layout="vertical"
          requiredMark={false}
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
                  result.message || t("article.form_create_success", language)
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
                message.error(
                  result.message || t("article.form_create_error", language)
                )
              }
            } catch (error: any) {
              message.error(
                error?.message || t("article.form_error_generic", language)
              )
            } finally {
              setCreatingArticle(false)
            }
          }}
          validateTrigger="onBlur"
        >
          <Form.Item
            label={
              <Text strong className="text-base">
                Title <span className="text-red-500">*</span>
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
                {t("article.form_thumbnail_label", language)}
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
                      ? t("article.form_thumbnail_uploading", language)
                      : t("article.form_thumbnail_button", language)}
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
                Content <span className="text-red-500">*</span>
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
              placeholder={t("article.form_content_label", language) + " ..."}
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
                Category <span className="text-red-500">*</span>
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
            rules={[
              {
                validator: () => {
                  if (selectedTagsForCreate.length > MAX_TAGS) {
                    return Promise.reject(`Tối đa ${MAX_TAGS} thẻ`)
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Select
              mode="tags"
              maxCount={MAX_TAGS}
              options={tags.map((tag) => ({
                label: tag.name,
                value: tag.name,
              }))}
              size="large"
              loading={loadingTags}
              placeholder="Thêm hoặc chọn thẻ (tối đa 5)"
              value={selectedTagsForCreate}
              onChange={(values) => {
                if (values.length <= MAX_TAGS) {
                  setSelectedTagsForCreate(values)
                } else {
                  message.warning(`Tối đa ${MAX_TAGS} thẻ`)
                }
              }}
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
                  Publish
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

      {/* Article Preview Modal */}
      <Modal
        title={
          previewArticle?.title ||
          (language === "vi" ? "Xem trước bài viết" : "Article Preview")
        }
        open={isPreviewModalOpen}
        onCancel={() => {
          setIsPreviewModalOpen(false)
          setPreviewArticle(null)
          setPreviewArticleId(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsPreviewModalOpen(false)
              setPreviewArticle(null)
              setPreviewArticleId(null)
            }}
          >
            {language === "vi" ? "Đóng" : "Close"}
          </Button>,
          <Button
            key="view"
            type="primary"
            disabled={!previewArticleId}
            onClick={() => {
              if (previewArticleId) {
                router.push(`/articles/${previewArticleId}`)
              }
            }}
          >
            {language === "vi" ? "Xem toàn bộ bài viết" : "View Full Article"}
          </Button>,
        ]}
        width={900}
        styles={{
          body: {
            maxHeight: "78vh",
            overflowY: "auto",
          },
        }}
      >
        <Spin
          spinning={loadingPreviewData}
          tip={
            language === "vi" ? "Đang tải xem trước..." : "Loading preview..."
          }
        >
          {previewArticle && (
            <Space direction="vertical" size="middle" className="w-full">
              <img
                src={previewArticle.thumbnailUrl || DEFAULT_ARTICLE_THUMBNAIL}
                alt={previewArticle.title || "Article thumbnail"}
                className="w-full max-h-72 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    DEFAULT_ARTICLE_THUMBNAIL
                }}
              />
              <Space size="small" align="center">
                <Text type="secondary">
                  {language === "vi" ? "Tác giả:" : "Author:"}
                </Text>
                <Avatar
                  size="small"
                  src={previewArticle.authorAvatarUrl || undefined}
                >
                  {(previewArticle.authorName || "Unknown")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Avatar>
                <Text>{previewArticle.authorName}</Text>
                <Text type="secondary">|</Text>
                <Text type="secondary">
                  {language === "vi" ? "Danh mục:" : "Category:"}
                </Text>
                <Text>{previewArticle.categoryName}</Text>
              </Space>
              <Text type="secondary">
                {language === "vi" ? "Ngày tạo:" : "Created:"}{" "}
                {formatVietnamDateTime(previewArticle.createdAt)}
              </Text>
              <Divider style={{ margin: "8px 0" }} />
              {previewArticle.content ? (
                <div
                  className="article-preview-content"
                  dangerouslySetInnerHTML={{ __html: previewArticle.content }}
                />
              ) : (
                <Text type="secondary">
                  {language === "vi"
                    ? "Không có nội dung để hiển thị."
                    : "No content available."}
                </Text>
              )}
            </Space>
          )}
        </Spin>
      </Modal>

      <Modal
        title="Edit Article"
        open={isEditModalOpen}
        centered
        onCancel={() => {
          setIsEditModalOpen(false)
          editForm.resetFields()
          setEditTitleContent("")
          setEditContentValue("")
          setEditSelectedTags([])
          setEditingArticleId(null)
          setEditSubmitStatus("published")
          editSubmitStatusRef.current = "published"
          setEditOriginalStatus(null)
          setIsResubmitMode(false)
          setEditCategoryName(undefined)
        }}
        footer={null}
        width={900}
        styles={{
          body: {
            maxHeight: "78vh",
            overflowY: "auto",
            paddingRight: 20,
          },
        }}
        getContainer={() => document.body}
      >
        <Spin spinning={loadingEditData} tip="Loading article...">
          <Form
            form={editForm}
            layout="vertical"
            requiredMark={false}
            onFinish={handleEditSubmit}
            validateTrigger="onBlur"
          >
            <Form.Item
              label={
                <Text strong className="text-base">
                  Title <span className="text-red-500">*</span>
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
                ref={editTitleEditorRef}
                contentEditable
                onInput={() => {
                  if (editTitleEditorRef.current) {
                    setEditTitleContent(editTitleEditorRef.current.innerText)
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
                className="border border-gray-300 rounded p-3 min-h-[60px] focus:outline-none focus:border-blue-500 text-base font-normal"
                style={{ backgroundColor: "white" }}
                suppressContentEditableWarning
              />
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
                  Content <span className="text-red-500">*</span>
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
                  Category <span className="text-red-500">*</span>
                </Text>
              }
              name="categoryId"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                size="large"
                placeholder="Select a category"
                loading={loadingCategories}
                options={
                  // Ensure the original category name is included so the Select
                  // displays the name instead of a raw id when the options
                  // list isn't populated yet or doesn't include it.
                  (() => {
                    const base = editFormCategoriesByDepartment.map((cat) => ({
                      label: cat.name,
                      value: cat.id,
                    }))
                    if (
                      editCategoryId !== undefined &&
                      editCategoryName &&
                      !base.some((o) => o.value === editCategoryId)
                    ) {
                      base.unshift({
                        label: editCategoryName,
                        value: editCategoryId,
                      })
                    }
                    return base
                  })()
                }
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
              rules={[
                {
                  validator: () => {
                    if (editSelectedTags.length > MAX_TAGS) {
                      return Promise.reject(`Tối đa ${MAX_TAGS} thẻ`)
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <Select
                mode="tags"
                maxCount={MAX_TAGS}
                options={tags.map((tag) => ({
                  label: tag.name,
                  value: tag.name,
                }))}
                size="large"
                loading={loadingTags}
                placeholder="Thêm hoặc chọn thẻ (tối đa 5)"
                value={editSelectedTags}
                onChange={(values) => {
                  if (values.length <= MAX_TAGS) {
                    setEditSelectedTags(values)
                  } else {
                    message.warning(`Tối đa ${MAX_TAGS} thẻ`)
                  }
                }}
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

            <Flex justify="flex-end" align="center" className="mb-4">
              <span
                style={{
                  fontSize: "11px",
                  color:
                    editSelectedTags.length > MAX_TAGS ? "#dc2626" : "#6b7280",
                }}
              >
                {editSelectedTags.length} / {MAX_TAGS}
              </span>
            </Flex>

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
                    editSubmitStatusRef.current = "published"
                    setEditOriginalStatus(null)
                    setEditCategoryId(undefined)
                    setIsResubmitMode(false)
                  }}
                  disabled={editingArticle}
                >
                  Cancel
                </Button>
                {editOriginalStatus === "draft" && (
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={() => {
                      setEditSubmitStatus("pending")
                      editSubmitStatusRef.current = "pending"
                    }}
                    loading={editingArticle}
                  >
                    Submit for Review
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={() => {
                    const statusForUpdate =
                      editOriginalStatus === "draft" ||
                      editOriginalStatus === "pending" ||
                      editOriginalStatus === "published"
                        ? (editOriginalStatus as
                            | "draft"
                            | "pending"
                            | "published")
                        : "published"
                    setEditSubmitStatus(statusForUpdate)
                    editSubmitStatusRef.current = statusForUpdate
                  }}
                  loading={editingArticle}
                >
                  Update
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Article"
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false)
          setRejectReason("")
          setRejectingArticleId(null)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsRejectModalOpen(false)
              setRejectReason("")
              setRejectingArticleId(null)
            }}
            disabled={isRejectingArticle}
          >
            Cancel
          </Button>,
          <Button
            key="reject"
            danger
            htmlType="submit"
            loading={isRejectingArticle}
            onClick={handleRejectSubmit}
          >
            Reject Article
          </Button>,
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setRejectReason(e.target.value)
                }
              }}
              placeholder="Enter reason for rejection (optional)"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                rejectReason.length === 500
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              rows={4}
              disabled={isRejectingArticle}
              maxLength={500}
            />
            <Flex justify="space-between" align="center" className="mt-2">
              <Text type="secondary" className="text-xs">
                The reason will be sent to the article author
              </Text>
              <Text type="secondary" className="text-sm">
                {rejectReason.length}/500
              </Text>
            </Flex>
          </div>
        </div>
      </Modal>

      {/* View Rejection Reason Modal */}
      <Modal
        title={language === "vi" ? "Lý do từ chối" : "Rejection Reason"}
        open={isViewReasonModalOpen}
        onCancel={() => {
          setIsViewReasonModalOpen(false)
          setViewReason("")
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsViewReasonModalOpen(false)
              setViewReason("")
            }}
          >
            {language === "vi" ? "Đóng" : "Close"}
          </Button>,
        ]}
        width={600}
      >
        <div className="space-y-4">
          <Paragraph className="whitespace-pre-wrap">
            {viewReason || "-"}
          </Paragraph>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={deleteConfirmIsDeleted ? "Restore Article" : "Archive Article"}
        open={isDeleteConfirmOpen}
        onCancel={() => {
          setIsDeleteConfirmOpen(false)
          setDeleteConfirmArticleId(null)
          setDeleteConfirmIsDeleted(false)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsDeleteConfirmOpen(false)
              setDeleteConfirmArticleId(null)
              setDeleteConfirmIsDeleted(false)
            }}
            disabled={deletingId !== null}
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            danger={!deleteConfirmIsDeleted}
            htmlType="submit"
            loading={deletingId === deleteConfirmArticleId}
            onClick={() => {
              if (deleteConfirmArticleId !== null) {
                handleDeleteOrRestore(
                  deleteConfirmArticleId,
                  deleteConfirmIsDeleted
                )
                  .then(() => {
                    setIsDeleteConfirmOpen(false)
                    setDeleteConfirmArticleId(null)
                    setDeleteConfirmIsDeleted(false)
                  })
                  .catch(() => {
                    // Error is already handled in handleDeleteOrRestore
                  })
              }
            }}
          >
            {deleteConfirmIsDeleted
              ? t("article.btn_restore", language)
              : t("article.btn_delete", language)}
          </Button>,
        ]}
        width={600}
      >
        <div className="space-y-4">
          <p className="text-base">
            {deleteConfirmIsDeleted
              ? "Are you sure you want to restore this article?"
              : "Are you sure you want to archive this article? This action marks it as archived and excludes it from active views."}
          </p>
        </div>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        title="Approve Article"
        open={isApproveConfirmOpen}
        onCancel={() => {
          setIsApproveConfirmOpen(false)
          setApproveConfirmArticleId(null)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsApproveConfirmOpen(false)
              setApproveConfirmArticleId(null)
            }}
            disabled={isApprovingArticle}
          >
            Cancel
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={isApprovingArticle}
            onClick={handleApproveConfirm}
          >
            Approve Article
          </Button>,
        ]}
        width={600}
      >
        <div className="space-y-4">
          <p className="text-base">
            Are you sure you want to approve this article?
          </p>
        </div>
      </Modal>
    </div>
  )
}
