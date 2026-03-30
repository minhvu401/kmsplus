"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  Typography,
  Divider,
  Avatar,
  Input,
  Button,
  Space,
  Spin,
  message,
  Empty,
  Modal,
  Dropdown,
  Form,
  Select,
  Upload,
  Flex,
} from "antd"
import {
  UserOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons"
import { getArticleById } from "@/action/articles/articlesManagementAction"
import {
  getAllCategories,
  resubmitArticle,
} from "@/action/articles/articlesManagementAction"
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "@/action/comments/commentsAction"
import type { Comment } from "@/service/comments.service"
import {
  getCloudinaryContentImageUrl,
  getCloudinaryThumbnailUrl,
  uploadImageToCloudinary,
} from "@/lib/cloudinary"
import RichTextEditor from "@/components/ui/RichTextEditor"
import MarkdownIt from "markdown-it"
// @ts-ignore
import markdownItUnderline from "markdown-it-underline"
import "react-markdown-editor-lite/lib/index.css"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

mdParser.use(markdownItUnderline)

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState("")
  const [updatingComment, setUpdatingComment] = useState(false)
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false)
  const [deletingComment, setDeletingComment] = useState(false)
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [resubmitForm] = Form.useForm()
  const [resubmitTitle, setResubmitTitle] = useState("")
  const [resubmitContent, setResubmitContent] = useState("")
  const [resubmitThumbnail, setResubmitThumbnail] = useState("")
  const [resubmitTags, setResubmitTags] = useState<string[]>([])
  const [resubmitCategory, setResubmitCategory] = useState<number | null>(null)
  const [resubmitting, setResubmitting] = useState(false)
  const [uploadingResubmitThumbnail, setUploadingResubmitThumbnail] =
    useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [loadingCategories, setLoadingCategories] = useState(false)
  const titleEditorRef = useRef<HTMLDivElement>(null)

  const renderedContent = useMemo(() => {
    if (!article?.content) return ""
    return mdParser.render(article.content)
  }, [article?.content])

  const threadedComments = useMemo(() => {
    const ROOT_KEY = "root"
    const map = new Map<string, Comment[]>()

    comments.forEach((comment) => {
      const key = comment.parent_id ?? ROOT_KEY
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(comment)
    })

    map.forEach((list) => {
      list.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })

    const roots = map.get(ROOT_KEY) ?? []
    roots.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return { map, roots }
  }, [comments])

  useEffect(() => {
    loadArticle()
  }, [articleId])

  useEffect(() => {
    if (!showResubmitModal || categories.length > 0) return

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
  }, [showResubmitModal, categories.length])

  useEffect(() => {
    if (showResubmitModal && titleEditorRef.current) {
      titleEditorRef.current.innerText = resubmitTitle
    }
  }, [showResubmitModal, resubmitTitle])

  useEffect(() => {
    if (showResubmitModal && resubmitContent) {
      // Ensure form field is set when modal opens
      resubmitForm.setFieldsValue({ content: resubmitContent })
    }
  }, [showResubmitModal, resubmitContent, resubmitForm])

  const loadComments = async (id: number) => {
    setLoadingComments(true)
    try {
      const commentsRes = await getComments(id)
      setComments(commentsRes || [])
    } catch (err) {
      console.error("Error loading comments:", err)
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const loadArticle = async () => {
    setLoading(true)
    try {
      const parsedId = parseInt(articleId)
      const articleRes = await getArticleById(parsedId)

      if ((articleRes as any).success && (articleRes as any).data) {
        setArticle((articleRes as any).data)
        setComments([])
        setLoading(false)
        void loadComments(parsedId)
        return
      }

      setArticle(null)
      setComments([])
    } catch (err: any) {
      console.error("Error loading article:", err)
      message.error("Failed to load article")
      setArticle(null)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      message.warning("Please enter a comment")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("article_id", articleId)
      formData.append("content", commentText)

      const result = await createComment(formData)
      if (result.success) {
        message.success("Comment posted successfully")
        setCommentText("")
        await loadComments(parseInt(articleId))
      } else {
        message.error(result.message || "Failed to post comment")
      }
    } catch (error: any) {
      message.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplyClick = (commentId: string) => {
    setReplyToId(commentId)
    setReplyText("")
  }

  const handleCancelReply = () => {
    setReplyToId(null)
    setReplyText("")
  }

  const handleSubmitReply = async () => {
    if (!replyToId) return
    if (!replyText.trim()) {
      message.warning("Please enter a reply")
      return
    }

    setReplying(true)
    try {
      const formData = new FormData()
      formData.append("article_id", articleId)
      formData.append("content", replyText)
      formData.append("parent_id", replyToId)

      const result = await createComment(formData)
      if (result.success) {
        message.success("Reply posted successfully")
        setReplyToId(null)
        setReplyText("")
        await loadComments(parseInt(articleId))
      } else {
        message.error(result.message || "Failed to post reply")
      }
    } catch (error: any) {
      message.error("An error occurred")
    } finally {
      setReplying(false)
    }
  }

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId)
    setEditingCommentText(currentContent)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingCommentText("")
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      message.warning("Comment cannot be empty")
      return
    }

    setUpdatingComment(true)
    try {
      const formData = new FormData()
      formData.append("id", commentId)
      formData.append("content", editingCommentText)

      const result = await updateComment(formData)
      if (result.success) {
        message.success("Comment updated successfully")
        setEditingCommentId(null)
        setEditingCommentText("")
        await loadComments(parseInt(articleId))
      } else {
        message.error(result.message || "Failed to update comment")
      }
    } catch (error: any) {
      message.error("An error occurred")
    } finally {
      setUpdatingComment(false)
    }
  }

  const handleDeleteComment = (commentId: string) => {
    setDeleteCommentId(commentId)
    setShowDeleteCommentModal(true)
  }

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return
    setDeletingComment(true)
    try {
      const result = await deleteComment(parseInt(deleteCommentId))
      if (result.success) {
        message.success("Comment deleted successfully")
        setShowDeleteCommentModal(false)
        setDeleteCommentId(null)
        await loadComments(parseInt(articleId))
      } else {
        message.error(result.message || "Failed to delete comment")
      }
    } catch (error: any) {
      message.error("An error occurred")
    } finally {
      setDeletingComment(false)
    }
  }

  const handleApprove = () => {
    ;("🔵 handleApprove clicked")
    setShowApproveModal(true)
  }

  const confirmApprove = async () => {
    ;("🟢 Approve confirmed, sending request...")
    setApproving(true)
    try {
      ;("📤 Sending POST to /api/articles/approve with id:", articleId)
      const response = await fetch("/api/articles/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: parseInt(articleId, 10) }),
      })

      ;("📥 Response status:", response.status, response.statusText)
      const result = await response.json()
      ;("📥 Response data:", result)

      if (response.ok && result.success) {
        message.success(result.message || "Article approved successfully")
        setShowApproveModal(false)
        window.dispatchEvent(new Event("notifications:refresh"))
        await loadArticle()
      } else {
        console.error("❌ Approve failed:", result)
        message.error(result.message || "Failed to approve article")
      }
    } catch (err: any) {
      console.error("❌ Approve error:", err)
      message.error(err?.message || "Failed to approve")
    } finally {
      setApproving(false)
    }
  }

  const handleReject = () => {
    ;("🔴 handleReject clicked")
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    // Close reject confirmation modal and open reason modal
    setShowRejectModal(false)
    setShowRejectReasonModal(true)
  }

  const confirmRejectWithReason = async () => {
    if (!rejectReason.trim()) {
      message.warning("Please enter a reason for rejection")
      return
    }

    ;("🟠 Reject confirmed with reason, sending request...")
    setRejecting(true)
    try {
      ;("📤 Sending POST to /api/articles/reject with id:",
        articleId,
        "reason:",
        rejectReason)
      const response = await fetch("/api/articles/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: parseInt(articleId, 10),
          reason: rejectReason,
        }),
      })

      ;("📥 Response status:", response.status, response.statusText)
      const result = await response.json()
      ;("📥 Response data:", result)

      if (response.ok && result.success) {
        message.success(result.message || "Article rejected successfully")
        setShowRejectReasonModal(false)
        setRejectReason("")
        window.dispatchEvent(new Event("notifications:refresh"))
        await loadArticle()
      } else {
        console.error("❌ Reject failed:", result)
        message.error(result.message || "Failed to reject article")
      }
    } catch (err: any) {
      console.error("❌ Reject error:", err)
      message.error(err?.message || "Failed to reject")
    } finally {
      setRejecting(false)
    }
  }

  const handleResubmitThumbnailUpload = async (file: File) => {
    setUploadingResubmitThumbnail(true)
    try {
      const result = await uploadImageToCloudinary(file, "article-thumbnails")
      setResubmitThumbnail(result.secure_url)
      message.success("Thumbnail uploaded successfully")
    } catch (error: any) {
      console.error("Upload error:", error)
      message.error(error?.message || "Failed to upload thumbnail")
    } finally {
      setUploadingResubmitThumbnail(false)
    }
  }

  const handleResubmit = () => {
    // Debug log to check article content
    ;("Article data:",
      {
        title: article.title,
        content: article.content?.substring(0, 100),
        contentLength: article.content?.length,
        thumbnail: article.thumbnail_url,
        category: article.category_id,
        tags: article.tags,
      })

    // Populate the form with current article data
    const tags = article.tags
      ? Array.isArray(article.tags)
        ? article.tags
        : article.tags.split(",").map((t: string) => t.trim())
      : []

    setResubmitTitle(article.title || "")
    setResubmitContent(article.content || "")
    setResubmitThumbnail(article.thumbnail_url || "")
    setResubmitCategory(article.category_id || null)
    setResubmitTags(tags)

    // Set all form fields including content
    setTimeout(() => {
      resubmitForm.setFieldsValue({
        title: article.title || "",
        content: article.content || "",
        category: article.category_id || undefined,
        tags: tags,
      })
    }, 0)

    setShowResubmitModal(true)
  }

  const confirmResubmit = async () => {
    setResubmitting(true)
    try {
      const response = await fetch("/api/articles/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: parseInt(articleId, 10),
          title: resubmitTitle,
          content: resubmitContent,
          tags: resubmitTags,
          category_id: resubmitCategory,
          image_url: article.image_url,
          thumbnail_url: resubmitThumbnail,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        message.success(result.message || "Article resubmitted successfully")
        setShowResubmitModal(false)
        setResubmitTitle("")
        setResubmitContent("")
        setResubmitTags([])
        setResubmitThumbnail("")
        setResubmitCategory(null)
        resubmitForm.resetFields()
        await loadArticle()
      } else {
        message.error(result.message || "Failed to resubmit article")
      }
    } catch (err: any) {
      console.error("Resubmit error:", err)
      message.error(err?.message || "Failed to resubmit")
    } finally {
      setResubmitting(false)
    }
  }

  const renderCommentItem = (comment: Comment, depth: number = 0) => {
    const isEditing = editingCommentId === comment.id
    const isReplying = replyToId === comment.id
    const children = threadedComments.map.get(comment.id) || []

    return (
      <div
        key={comment.id}
        className={`flex items-start space-x-3 ${depth > 0 ? "pl-4 border-l border-gray-200" : ""}`}
      >
        <Avatar icon={<UserOutlined />} className="bg-gray-400 flex-shrink-0" />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Input.TextArea
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleUpdateComment(comment.id)}
                  loading={updatingComment}
                >
                  Save
                </Button>
                <Button size="small" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </Space>
            </div>
          ) : (
            <>
              <div className="bg-gray-100 rounded-lg p-3 relative">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Text strong className="block mb-1">
                      {comment.user_name || "Anonymous User"}
                    </Text>
                    <Text>{comment.content}</Text>
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "edit",
                          label: "Edit",
                          icon: <EditOutlined />,
                          onClick: () =>
                            handleEditComment(comment.id, comment.content),
                        },
                        {
                          key: "delete",
                          label: "Delete",
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleDeleteComment(comment.id),
                        },
                      ],
                    }}
                    trigger={["click"]}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      className="ml-2"
                    />
                  </Dropdown>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <Text type="secondary" className="text-xs">
                  {new Date(comment.created_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    hour12: false,
                  })}
                </Text>
                <Button
                  type="link"
                  size="small"
                  className="!px-0"
                  onClick={() => handleReplyClick(comment.id)}
                >
                  Reply
                </Button>
              </div>
            </>
          )}

          {isReplying && (
            <div className="mt-2 space-y-2">
              <Input.TextArea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder="Write a reply..."
              />
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={handleSubmitReply}
                  loading={replying}
                >
                  Reply
                </Button>
                <Button size="small" onClick={handleCancelReply}>
                  Cancel
                </Button>
              </Space>
            </div>
          )}

          {children.length > 0 && (
            <div className="mt-4 space-y-4">
              {children.map((child) => renderCommentItem(child, depth + 1))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large">
          <div className="mt-4 text-gray-600">Loading article...</div>
        </Spin>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Empty description="Article not found" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Article Content */}
            <Card className="border border-gray-100 shadow-sm">
              {(article.status === "published" ||
                article.status === "draft" ||
                article.status === "pending" ||
                article.status === "rejected") && (
                <div className="mb-4">
                  {(() => {
                    const backToPublished = article.status === "published"
                    const targetPath = backToPublished
                      ? "/articles"
                      : "/articles/management"
                    const backLabel = backToPublished
                      ? "Back to Articles"
                      : "Back to Articles Management"

                    return (
                      <Button
                        icon={<ArrowLeftOutlined />}
                        shape="circle"
                        onClick={() => router.push(targetPath)}
                        aria-label={backLabel}
                        title={backLabel}
                      />
                    )
                  })()}
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-3">
                <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />
                <span>
                  {new Date(article.created_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    hour12: false,
                  })}
                </span>
              </div>

              {/* Title */}
              <Title
                level={1}
                className="!mb-4 !text-3xl md:!text-4xl !leading-tight"
              >
                {article.title}
              </Title>

              {/* Thumbnail */}
              <div className="mb-6 rounded-xl overflow-hidden border border-gray-100">
                <img
                  src={
                    article.thumbnail_url
                      ? article.thumbnail_url
                      : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop"
                  }
                  alt="Article thumbnail"
                  className="w-full h-72 md:h-80 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop"
                  }}
                />
              </div>

              {/* Content */}
              <div
                className="prose max-w-none article-content"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            </Card>

            {/* Approval Actions (for pending articles) */}
            {article.status === "pending" && (
              <div className="flex justify-start">
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    loading={approving}
                    onClick={handleApprove}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    size="large"
                    icon={<CloseCircleOutlined />}
                    loading={rejecting}
                    onClick={handleReject}
                  >
                    Reject
                  </Button>
                </Space>
              </div>
            )}

            {/* Rejection Reason (for rejected articles) */}
            {article.status === "rejected" && article.reason && (
              <div className="space-y-4">
                <Card className="border-l-4 border-l-red-500">
                  <Title level={4} className="!text-red-500 !mb-2">
                    Rejection Reason
                  </Title>
                  <Paragraph className="!mb-0 whitespace-pre-wrap">
                    {article.reason}
                  </Paragraph>
                </Card>
                <Button type="primary" size="large" onClick={handleResubmit}>
                  Resubmit Article
                </Button>
              </div>
            )}

            {/* Comments Section */}
            {article.status !== "pending" && article.status !== "rejected" && (
              <Card
                title={
                  <Title level={4} className="!mb-0">
                    Comments ({comments.length})
                  </Title>
                }
              >
                {/* Comment Input */}
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <Avatar
                      icon={<UserOutlined />}
                      className="bg-gray-400 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <TextArea
                        placeholder="Comment"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        className="mb-2"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={handleSubmitComment}
                          loading={submitting}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Show 1 comment text */}
                {comments.length > 0 && (
                  <Button type="link" className="!px-0 mb-4">
                    Show {comments.length} comment
                    {comments.length > 1 ? "s" : ""}
                  </Button>
                )}

                {/* Comments List */}
                {loadingComments ? (
                  <div className="py-4">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Space direction="vertical" size="large" className="w-full">
                    {threadedComments.roots.map((comment) =>
                      renderCommentItem(comment)
                    )}
                  </Space>
                )}

                {!loadingComments && comments.length === 0 && (
                  <Empty description="No comments yet. Be the first to comment!" />
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:pt-8">
            <Card className="border border-gray-100 shadow-sm">
              <Text
                type="secondary"
                className="block mb-3 text-xs uppercase tracking-wide"
              >
                Authors
              </Text>
              <div className="flex items-start space-x-4">
                <Avatar
                  size={56}
                  icon={<UserOutlined />}
                  className="bg-blue-500"
                />
                <div>
                  <Title level={5} className="!mb-1">
                    {article.author_name || "Nguyễn Văn A"}
                  </Title>
                  <Text type="secondary">Dream Jobs, Analyist</Text>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* Approve Modal */}
        <Modal
          title="Approve article"
          open={showApproveModal}
          onOk={confirmApprove}
          onCancel={() => setShowApproveModal(false)}
          okText="Approve"
          cancelText="Cancel"
          confirmLoading={approving}
        >
          <p>Are you sure you want to publish this article?</p>
        </Modal>

        {/* Reject Modal */}
        <Modal
          title="Reject article"
          open={showRejectModal}
          onOk={confirmReject}
          onCancel={() => setShowRejectModal(false)}
          okText="Reject"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          confirmLoading={rejecting}
        >
          <p>Are you sure you want to reject this article?</p>
        </Modal>

        {/* Reject Reason Modal */}
        <Modal
          title="Rejection Reason"
          open={showRejectReasonModal}
          onOk={confirmRejectWithReason}
          onCancel={() => {
            setShowRejectReasonModal(false)
            setRejectReason("")
          }}
          okText="Submit"
          cancelText="Cancel"
          confirmLoading={rejecting}
        >
          <p className="mb-4">
            Please provide a reason for rejecting this article:
          </p>
          <TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            autoSize={{ minRows: 4, maxRows: 8 }}
          />
        </Modal>

        {/* Resubmit Modal */}
        <Modal
          title={
            <Title level={3} className="!mb-0">
              Resubmit Article
            </Title>
          }
          open={showResubmitModal}
          onCancel={() => {
            setShowResubmitModal(false)
            resubmitForm.resetFields()
            setResubmitTitle("")
            setResubmitContent("")
            setResubmitTags([])
            setResubmitThumbnail("")
            setResubmitCategory(null)
          }}
          footer={null}
          width={900}
          style={{ maxHeight: "90vh", overflow: "auto" }}
          getContainer={() => document.body}
        >
          <Form
            form={resubmitForm}
            layout="vertical"
            onFinish={confirmResubmit}
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
                    const textContent = resubmitTitle.trim()
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
                    setResubmitTitle(titleEditorRef.current.innerText)
                  }
                }}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                  }
                }}
                onPaste={(e: any) => {
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
              ></div>
            </Form.Item>

            <div className="flex justify-end mb-4">
              <Text type="secondary" className="text-sm">
                {resubmitTitle.length} / 150
              </Text>
            </div>

            <Divider />

            <Form.Item
              label={
                <Text strong className="text-base">
                  Thumbnail Image
                </Text>
              }
              name="thumbnail"
            >
              <div className="space-y-3">
                {resubmitThumbnail && (
                  <img
                    src={resubmitThumbnail}
                    alt="Thumbnail preview"
                    className="w-40 h-30 object-cover rounded-lg border"
                  />
                )}
                <Upload
                  maxCount={1}
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleResubmitThumbnailUpload(file)
                    return false
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingResubmitThumbnail}
                    disabled={uploadingResubmitThumbnail}
                  >
                    {uploadingResubmitThumbnail
                      ? "Uploading..."
                      : "Click to Upload Thumbnail"}
                  </Button>
                </Upload>
              </div>
            </Form.Item>

            <Divider />

            <Form.Item
              label={
                <Text strong className="text-base">
                  Content
                </Text>
              }
              name="content"
              valuePropName="value"
              getValueFromEvent={(value) => value}
              rules={[
                {
                  required: true,
                  validator: (_, value) => {
                    const stripHtml = (html: string) => {
                      const tmp = document.createElement("DIV")
                      tmp.innerHTML = html
                      return tmp.textContent || tmp.innerText || ""
                    }
                    // Use resubmitContent from state instead of form field
                    const textContent = stripHtml(
                      resubmitContent || value || ""
                    ).trim()
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
              <RichTextEditor
                value={resubmitContent}
                onChange={(newValue) => {
                  setResubmitContent(newValue)
                  // Also update form field
                  resubmitForm.setFieldsValue({ content: newValue })
                }}
                placeholder="Write your content here..."
              />
            </Form.Item>

            <div className="flex justify-end mb-4">
              <Text type="secondary" className="text-sm">
                {resubmitContent.replace(/<[^>]*>/g, "").trim().length} / 5,000
              </Text>
            </div>

            <Divider />

            <Form.Item
              label={
                <Text strong className="text-base">
                  Category
                </Text>
              }
              name="category"
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
                value={resubmitCategory}
                onChange={setResubmitCategory}
                optionFilterProp="label"
                showSearch
                allowClear
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
                size="large"
                placeholder="Type to search or add new tags"
                value={resubmitTags}
                onChange={setResubmitTags}
                maxTagCount="responsive"
                showSearch
                tokenSeparators={[","]}
              />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Flex justify="flex-end" gap="middle">
                <Button
                  size="large"
                  onClick={() => {
                    setShowResubmitModal(false)
                    resubmitForm.resetFields()
                    setResubmitTitle("")
                    setResubmitContent("")
                    setResubmitTags([])
                    setResubmitThumbnail("")
                    setResubmitCategory(null)
                  }}
                  disabled={resubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  loading={resubmitting}
                >
                  Resubmit
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Comment Modal */}
        <Modal
          title="Delete Comment"
          open={showDeleteCommentModal}
          onOk={confirmDeleteComment}
          onCancel={() => setShowDeleteCommentModal(false)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          confirmLoading={deletingComment}
        >
          <p>Are you sure you want to delete this comment?</p>
        </Modal>

        {/* Footer */}
        <footer className="mt-8 py-6 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <Text type="secondary">
              © 2025 - KMSPlus. Designed by <Text strong>KMS Team</Text>. All
              rights reserved
            </Text>
            <Space size="large">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                FAQs
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Terms & Condition
              </a>
            </Space>
          </div>
        </footer>
        <style jsx global>{`
          .article-content img {
            display: block;
            margin: 1.5rem auto;
            max-width: 100%;
            width: 100%;
            height: auto;
          }
          @media (min-width: 768px) {
            .article-content img {
              width: 85%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
