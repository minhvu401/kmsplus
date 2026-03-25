"use client"

import { useEffect, useState } from "react"
import {
  Button,
  Table,
  Space,
  message,
  Spin,
  Empty,
  Input,
  Popconfirm,
  Divider,
  Select,
  Typography,
  Card,
  Row,
  Col,
  Segmented,
  Tag,
  Tooltip,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons"
import Link from "next/link"
import { getAllQuizzes, deleteQuiz } from "@/action/quiz/quizActions"
import { getCategoriesAPI } from "@/action/courses/courseAction"
import CreateQuizModal from "./components/CreateQuizModal"

interface Quiz {
  id: number
  course_id: number
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  created_at: Date
  updated_at: Date
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | 'All'>('All')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  useEffect(() => {
    loadQuizzes()
    loadCategories()
  }, [])

  useEffect(() => {
    if (quizzes.length > 0) {
      const filtered = quizzes.filter((quiz) =>
        quiz.title.toLowerCase().includes(searchText.toLowerCase())
      )
      applySorting(filtered)
    }
  }, [sortOrder])

  useEffect(() => {
    const active = searchText !== '' || selectedCategory !== 'All'
    setHasActiveFilters(active)
  }, [searchText, selectedCategory])

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await getCategoriesAPI()
      setCategories(res || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadQuizzes = async () => {
    setLoading(true)
    try {
      const data = await getAllQuizzes({
        query: searchText,
        page: 1,
        limit: 100,
      })
      setQuizzes(data.data || [])
      applySorting(data.data || [])
    } catch (error) {
      console.error("Failed to load quizzes:", error)
      message.error("Không thể tải danh sách bài thi")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    const filtered = quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(value.toLowerCase())
    )
    applySorting(filtered)
  }

  const applySorting = (itemsToSort: Quiz[]) => {
    const sorted = [...itemsToSort].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
    setFilteredQuizzes(sorted)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteQuiz(id)
      message.success("Đã xóa bài thi thành công")
      loadQuizzes()
    } catch (error) {
      console.error("Failed to delete quiz:", error)
      message.error("Không thể xóa bài thi")
    }
  }

  const handleClearFilters = () => {
    setSearchText('')
    setSelectedCategory('All')
  }

  const columns = [
    {
      title: "Tên Bài Thi",
      dataIndex: "title",
      key: "title",
      width: "40%",
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
      width: "30%",
      render: (text: string | null) => <span>{text || "Không có mô tả"}</span>,
    },
    {
      title: "Thời Gian (phút)",
      dataIndex: "time_limit_minutes",
      key: "time_limit_minutes",
      width: "12%",
      render: (text: number | null) => <span>{text || "Unlimited"}</span>,
    },
    {
      title: "Điểm Đạt",
      dataIndex: "passing_score",
      key: "passing_score",
      width: "10%",
      render: (text: number) => <span>{text}%</span>,
    },
    {
      title: "Hành Động",
      key: "action",
      width: "8%",
      align: "center" as const,
      render: (_: any, record: Quiz) => (
        <Space size="middle">
          <Link href={`/quizzes/${record.id}`}>
            <EditOutlined
              style={{ cursor: "pointer", color: "#1890ff" }}
              title="Chỉnh sửa"
            />
          </Link>
          <Popconfirm
            title="Xóa bài thi"
            description="Bạn có chắc chắn muốn xóa bài thi này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <DeleteOutlined
              style={{ cursor: "pointer", color: "#ff4d4f" }}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          Quiz Management
        </h1>
        <div className="flex align-center justify-between gap-6" style={{ marginBottom: 16 }}>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Manage and organize your quizzes
          </p>
          <Button
            style={{
              background: '#ffffff',
              borderColor: '#1e40af',
              borderWidth: '1.5px',
              borderRadius: '0.375rem',
              color: '#1e40af',
              fontSize: '12px',
              fontWeight: 500,
              height: '36px',
              paddingInline: '14px',
              boxShadow: '0 2px 8px rgba(30, 64, 175, 0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            icon={<EditOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
            onMouseEnter={(e) => {
              const button = e.currentTarget as HTMLButtonElement;
              button.style.background = '#f8fafc';
              button.style.boxShadow = '0 8px 20px rgba(30, 64, 175, 0.2)';
              button.style.borderColor = '#1e3a8a';
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget as HTMLButtonElement;
              button.style.background = '#ffffff';
              button.style.boxShadow = '0 2px 8px rgba(30, 64, 175, 0.12)';
              button.style.borderColor = '#1e40af';
            }}
          >
            Create Quiz
          </Button>
        </div>
        <Divider style={{ borderColor: 'rgba(37, 99, 235, 0.15)', margin: '16px 0' }} />
      </div>

      {/* Controls Widget - White Card (Compact) */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="space-y-3">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder="Search quizzes..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            size="middle"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ marginBottom: 12 }}
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <Typography.Text type="secondary" className="text-sm font-medium mb-2">
                Category
              </Typography.Text>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { label: 'All Categories', value: 'All' },
                  ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
                ]}
                loading={loadingCategories}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Typography.Text type="secondary" className="text-sm font-medium mb-2">
                Sort By
              </Typography.Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: 'Newest First', value: 'newest' },
                  { label: 'Oldest First', value: 'oldest' },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Typography.Text type="secondary" className="text-sm font-medium mb-2">
                View Mode
              </Typography.Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as 'list' | 'grid')}
                options={[
                  { label: 'List', value: 'list' },
                  { label: 'Grid', value: 'grid' },
                ]}
                block
              />
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col justify-end">
                <Tooltip title="Clear all filters">
                  <Button
                    type="dashed"
                    danger
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <Spin spinning={loading}>
            {filteredQuizzes.length > 0 ? (
              viewMode === 'list' ? (
                <Table
                  columns={columns}
                  dataSource={filteredQuizzes.map((quiz) => ({
                    ...quiz,
                    key: quiz.id,
                  }))}
                  pagination={{
                    pageSize: 10,
                    total: filteredQuizzes.length,
                    showTotal: (total) => `Tổng ${total} bài thi`,
                  }}
                  bordered
                  size="middle"
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredQuizzes.map((quiz) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={quiz.id}>
                      <Card
                        hoverable
                        className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <Card.Meta
                          title={
                            <div className="text-gray-900 hover:text-blue-600 truncate font-medium">
                              {quiz.title}
                            </div>
                          }
                          description={
                            <span className="text-gray-600 line-clamp-2">
                              {quiz.description || 'Không có mô tả'}
                            </span>
                          }
                        />
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <Typography.Text type="secondary">Time Limit:</Typography.Text>
                            <Typography.Text strong>
                              {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'Unlimited'}
                            </Typography.Text>
                          </div>
                          <div className="flex justify-between">
                            <Typography.Text type="secondary">Passing Score:</Typography.Text>
                            <Typography.Text strong>
                              <Tag color="blue">{quiz.passing_score}%</Tag>
                            </Typography.Text>
                          </div>
                          <div className="flex justify-between">
                            <Typography.Text type="secondary">Max Attempts:</Typography.Text>
                            <Typography.Text strong>{quiz.max_attempts}</Typography.Text>
                          </div>
                          <div className="flex justify-between">
                            <Typography.Text type="secondary">Created:</Typography.Text>
                            <Typography.Text strong>
                              {new Date(quiz.created_at).toLocaleDateString('vi-VN')}
                            </Typography.Text>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link href={`/quizzes/${quiz.id}`} className="flex-1">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              className="w-full text-blue-600 hover:!text-blue-700"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Popconfirm
                            title="Xóa bài thi"
                            description="Bạn có chắc chắn muốn xóa bài thi này? Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(quiz.id)}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              className="flex-1"
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )
            ) : (
              <Empty
                description="Không có bài thi nào"
                style={{ marginTop: "60px" }}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                >
                  Tạo Bài Thi Đầu Tiên
                </Button>
              </Empty>
            )}
          </Spin>
        </div>
      </div>

      {/* Create Quiz Modal */}
      <CreateQuizModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={() => {
          setIsCreateModalVisible(false)
          loadQuizzes()
        }}
      />
    </div>
  )
}
