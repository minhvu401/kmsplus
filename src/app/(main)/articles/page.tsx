'use client';

import React, { useState, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  Card,
  Tag,
  Avatar,
  Button,
  Pagination,
  Space,
  Typography,
  Flex,
  Spin,
  Empty,
  message,
  Input,
  Select,
  Modal,
  Form,
  Divider,
  Tooltip,
  Upload,
} from "antd"
import {
  MessageOutlined,
  PlusOutlined,
  UserOutlined,
  SendOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import {
  getAllArticles,
  getAllTags,
  getAllCategories,
  createArticle,
} from "@/action/articles/articlesManagementAction"
import { getComments } from "@/action/comments/commentsAction"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import QuillEditor from "@/components/QuillEditor"
import type { Article } from "@/service/articles.service"

if (typeof window !== "undefined") {
  ;(window as any).React = React
}

const { Text, Title, Paragraph } = Typography

export default function ViewArticlePage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [titleContent, setTitleContent] = useState("")
  const [contentValue, setContentValue] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("") // New: Cloudinary thumbnail
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false) // New
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>([])
  const [submitStatus, setSubmitStatus] = useState<"draft" | "published" | "pending">("published")
  const [creatingArticle, setCreatingArticle] = useState(false)
  const titleEditorRef = useRef<HTMLDivElement>(null)
  const pageSize = 10

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [articlesRes, tagsRes] = await Promise.all([
        getAllArticles(),
        getAllTags(),
      ])

      // Keep only articles that are not deleted
      const filteredArticles = (articlesRes || []).filter(
        (a: any) => !a.is_deleted
      )
      setArticles(filteredArticles)

      const tagNames = (tagsRes || []).map((t: any) => t.name)
      setTags(tagNames)

      // Load comment counts for all articles
      const counts: Record<string, number> = {}
      await Promise.all(
        filteredArticles.map(async (article: Article) => {
          try {
            const comments = await getComments(parseInt(article.id))
            counts[article.id] = comments?.length || 0
          } catch {
            counts[article.id] = 0
          }
        })
      )
      setCommentCounts(counts)
    } catch (err: any) {
      message.error('Failed to load articles')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true)
      try {
        const res = await getAllCategories()
        setCategories(res || [])
      } catch (err) {
        console.error("Failed to load categories", err)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  const resetCreateForm = () => {
    createForm.resetFields()
    setTitleContent("")
    setContentValue("")
    setImageUrl("")
    setThumbnailUrl("") // Reset thumbnail
    setSelectedTagsForCreate([])
    setSubmitStatus("published")
    if (titleEditorRef.current) {
      titleEditorRef.current.innerText = ""
    }
  }

  // New: Handle thumbnail upload
  const handleThumbnailUpload = async (file: File) => {
    console.log('Starting thumbnail upload...', file.name, file.type, file.size);
    setUploadingThumbnail(true);
    try {
      const result = await uploadImageToCloudinary(file, 'article-thumbnails');
      console.log('Upload successful:', result);
      setThumbnailUrl(result.secure_url);
      message.success('Thumbnail uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error?.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

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
    setCreatingArticle(true)
    try {
      const formData = new FormData()
      formData.append("title", titleContent)
      formData.append("content", contentValue)
      formData.append("status", submitStatus)
      formData.append("tags", JSON.stringify(selectedTagsForCreate))
      formData.append("category_id", values?.categoryId ? String(values.categoryId) : "")
      formData.append("image_url", imageUrl)
      // New: Add thumbnail from Cloudinary
      if (thumbnailUrl) {
        formData.append('thumbnail_url', thumbnailUrl);
      }

      const result = await createArticle(formData)
      if (result.success) {
        message.success(result.message || "Article created successfully!")
        setIsModalOpen(false)
        resetCreateForm()
        await loadData()
      } else {
        message.error(result.message || "Failed to create article")
      }
    } catch (error: any) {
      message.error(error?.message || "An error occurred")
    } finally {
      setCreatingArticle(false)
    }
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const filteredArticles = articles.filter((a) => {
    if (a.is_deleted) return false
    if (a.status !== 'published') return false

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      const haystack = `${a.title} ${stripHtml((a as any).content || '')}`.toLowerCase()
      if (!haystack.includes(query)) {
        return false
      }
    }

    if (selectedTags.length > 0) {
      const articleTags = (a.article_tags || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
      const selectedLower = selectedTags.map((t) => t.toLowerCase())
      const matchesAll = selectedLower.every((tag) => articleTags.includes(tag))
      if (!matchesAll) return false
    }

    return true
  })

  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading articles..." />
      </div>
    )
  }

  return (
    <div className="p-6">
      <main className="flex-1">
        {/* Header with Title and Description */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Bài Viết</h1>
              <p className="text-gray-600 mt-2">
                Thư viện bài viết và tài liệu học tập
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                resetCreateForm()
                setIsModalOpen(true)
              }}
            >
              Tạo Bài Viết Mới
            </Button>
          </div>
          {/* Filters */}
          <Card size="small" className="bg-gray-50 border border-gray-100">
            <Space direction="vertical" className="w-full" size="small">
              <div className="text-sm text-gray-700 font-semibold">Tìm kiếm</div>
              <Input.Search
                allowClear
                size="large"
                placeholder="Nhập tiêu đề hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <div className="text-sm text-gray-700 font-semibold">Tags</div>
              <Select
                mode="multiple"
                allowClear
                size="large"
                style={{ width: '100%' }}
                placeholder="Chọn một hoặc nhiều tags"
                value={selectedTags}
                onChange={(values) => {
                  setSelectedTags(values)
                  setCurrentPage(1)
                }}
                options={tags.map((tag) => ({ label: tag, value: tag }))}
                showSearch
                optionFilterProp="label"
              />
            </Space>
          </Card>
        </div>

        {/* Article List */}
        {paginatedArticles.length === 0 ? (
          <Empty description="No articles found" />
        ) : (
          <>
            <Space direction="vertical" size="large" className="w-full">
              {paginatedArticles.map((article) => {
                const tagList = (article.article_tags || '')
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                const snippet = stripHtml((article as any).content || '').slice(0, 200) + '...'
                
                return (
                  <Card 
                    key={article.id} 
                    hoverable
                    onClick={() => router.push(`/articles/${article.id}`)}
                    className="cursor-pointer"
                  >
                    <Flex gap="large" align="start">
                      {/* Content */}
                      <Flex vertical flex={1} gap="small">
                        <Text type="secondary" className="text-sm">
                          {new Date(article.updated_at).toLocaleDateString('vi-VN')}
                        </Text>
                        <Title
                          level={4}
                          className="!mb-0 hover:text-blue-600"
                        >
                          {article.title}
                        </Title>
                        <Paragraph
                          ellipsis={{ rows: 3 }}
                          type="secondary"
                          className="!mb-0"
                        >
                          {snippet}
                        </Paragraph>

                        {/* Footer */}
                        <Flex justify="space-between" align="center" className="mt-2">
                          <Space size="large">
                            <Space size="small">
                              <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
                              <Text strong className="text-sm">
                                {article.author_name || 'Author'}
                              </Text>
                            </Space>
                            <Space size={4}>
                              <MessageOutlined className="text-gray-500" />
                              <Text type="secondary" className="text-sm">
                                {commentCounts[article.id] || 0} comments
                              </Text>
                            </Space>
                          </Space>
                          <Space wrap size={[4, 4]}>
                            {tagList.length === 0 ? (
                              <Tag color="default">No tag</Tag>
                            ) : (
                              tagList.map((tag) => (
                                <Tag key={`${article.id}-${tag}`} color="blue">{tag}</Tag>
                              ))
                            )}
                          </Space>
                        </Flex>
                      </Flex>

                      {/* Image */}
                      <img
                        src={
                          article.thumbnail_url 
                            ? article.thumbnail_url 
                            : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop"
                        }
                        alt={article.title}
                        className="w-64 h-40 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop"
                        }}
                      />
                    </Flex>
                  </Card>
                )
              })}
            </Space>

            {/* Pagination */}
            <Flex justify="center" className="mt-8">
              <Pagination
                current={currentPage}
                total={filteredArticles.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </Flex>
          </>
        )}
      </main>

      <Modal
        title={<Title level={3} className="!mb-0">Create An Article</Title>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          resetCreateForm()
        }}
        footer={null}
        width={900}
        style={{ maxHeight: "90vh", overflow: "auto" }}
        getContainer={() => document.body}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          validateTrigger="onBlur"
        >
          <Form.Item
            label={<Text strong className="text-xl">Title</Text>}
            name="title"
            rules={[
              {
                required: true,
                validator: () => {
                  const textContent = titleContent.replace(/<[^>]*>/g, "").trim()
                  if (!textContent) {
                    return Promise.reject("Please enter a title")
                  }
                  if (textContent.length > 150) {
                    return Promise.reject("Title must be less than 150 characters")
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
                const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ").trim()
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
            label={<Text strong className="text-base">Thumbnail Image</Text>}
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
              <Upload
                maxCount={1}
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleThumbnailUpload(file);
                  return false;
                }}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploadingThumbnail}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? 'Uploading...' : 'Click to Upload Thumbnail'}
                </Button>
              </Upload>
            </Flex>
          </Form.Item>

          <Divider />

          <Form.Item
            label={<Text strong className="text-base">Content</Text>}
            name="content"
            rules={[
              {
                required: true,
                validator: () => {
                  const stripHtml = (html: string) => {
                    const tmp = document.createElement('DIV')
                    tmp.innerHTML = html
                    return tmp.textContent || tmp.innerText || ''
                  }
                  const textContent = stripHtml(contentValue).trim()
                  if (!textContent) {
                    return Promise.reject("Please enter content")
                  }
                  if (textContent.length > 5000) {
                    return Promise.reject("Content must be less than 5000 characters")
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <QuillEditor
              value={contentValue}
              onChange={handleContentChange}
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
            label={<Text strong className="text-base">Category</Text>}
            name="categoryId"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              size="large"
              placeholder="Select a category"
              loading={loadingCategories}
              options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
              optionFilterProp="label"
              showSearch
              allowClear
            />
          </Form.Item>

          <Divider />

          <Form.Item
            label={<Text strong className="text-base">Tags</Text>}
            name="tags"
          >
            <Select
              mode="tags"
              options={tags.map((tag) => ({ label: tag, value: tag }))}
              size="large"
              placeholder="Type to search or add new tags"
              value={selectedTagsForCreate}
              onChange={setSelectedTagsForCreate}
              maxTagCount="responsive"
              showSearch
              tokenSeparators={[","]}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
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
                  resetCreateForm()
                }}
                disabled={creatingArticle}
              >
                Cancel
              </Button>
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
            </Flex>
          </Form.Item>
        </Form>
      </Modal>

    
    </div>
  )
}