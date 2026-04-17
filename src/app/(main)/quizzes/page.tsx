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
  Pagination,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  getAllQuizzes,
  deleteQuiz,
  getQuizDeleteGuards,
} from "@/action/quiz/quizActions"
import { getCategoriesAPI } from "@/action/courses/courseAction"
import CreateQuizModal from "./components/CreateQuizModal"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface Quiz {
  id: number
  category_id?: number | null
  category_name?: string | null
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  created_at: Date
  updated_at: Date
}

export default function QuizzesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { language } = useLanguageStore()

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )
  const [selectedCategory, setSelectedCategory] = useState<number | "All">(
    "All"
  )
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [hasActiveFilters, setHasActiveFilters] = useState(false)
  const [isQueryHydrated, setIsQueryHydrated] = useState(false)
  const [deleteGuards, setDeleteGuards] = useState<
    Record<
      number,
      { canDelete: boolean; reason?: string; isUsedInCourse: boolean }
    >
  >({})

  useEffect(() => {
    const q = searchParams.get("q") || ""
    const categoryParam = searchParams.get("category")
    const sortParam = searchParams.get("sort")
    const viewParam = searchParams.get("view")
    const pageParam = Number(searchParams.get("page"))
    const limitParam = Number(searchParams.get("limit"))

    const parsedCategory =
      categoryParam && !Number.isNaN(Number(categoryParam))
        ? Number(categoryParam)
        : "All"

    setSearchText(q)
    setSelectedCategory(parsedCategory)
    setSortOrder(sortParam === "oldest" ? "oldest" : "newest")
    setViewMode(viewParam === "grid" ? "grid" : "list")
    setCurrentPage(pageParam > 0 ? pageParam : 1)
    setPageSize(limitParam > 0 ? limitParam : 10)
    setIsQueryHydrated(true)
  }, [searchParams])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (quizzes.length > 0) {
      applySorting(quizzes)
    }
  }, [sortOrder])

  useEffect(() => {
    const active = searchText !== "" || selectedCategory !== "All"
    setHasActiveFilters(active)
  }, [searchText, selectedCategory])

  useEffect(() => {
    if (!isQueryHydrated) return

    const params = new URLSearchParams()
    if (searchText) params.set("q", searchText)
    if (selectedCategory !== "All") {
      params.set("category", String(selectedCategory))
    }
    if (sortOrder !== "newest") params.set("sort", sortOrder)
    if (viewMode !== "list") params.set("view", viewMode)
    if (currentPage !== 1) params.set("page", String(currentPage))
    if (pageSize !== 10) params.set("limit", String(pageSize))

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname
    router.replace(nextUrl, { scroll: false })
  }, [
    isQueryHydrated,
    searchText,
    selectedCategory,
    sortOrder,
    viewMode,
    currentPage,
    pageSize,
    pathname,
    router,
  ])

  // Reload quizzes when search text or category changes
  useEffect(() => {
    if (!isQueryHydrated) return
    loadQuizzes()
  }, [isQueryHydrated, searchText, selectedCategory, currentPage, pageSize])

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await getCategoriesAPI()
      setCategories((res || []).filter((category) => category.id !== 1))
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
        page: currentPage,
        limit: pageSize,
        category_id:
          selectedCategory === "All" ? undefined : (selectedCategory as number),
      })
      const quizzesData = data.data || []
      setQuizzes(quizzesData)
      applySorting(quizzesData)
      setTotalQuizzes(data.total || 0)

      const guards = await getQuizDeleteGuards(
        quizzesData.map((quiz) => quiz.id)
      )
      setDeleteGuards(guards)
    } catch (error) {
      console.error("Failed to load quizzes:", error)
      message.error(t("quiz.msg_load_error", language))
      setDeleteGuards({})
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: number | "All") => {
    setSelectedCategory(value)
    setCurrentPage(1)
  }

  const handlePaginationChange = (page: number, size: number) => {
    if (size !== pageSize) {
      setPageSize(size)
      setCurrentPage(1)
      return
    }
    setCurrentPage(page)
  }

  const applySorting = (itemsToSort: Quiz[]) => {
    const sorted = [...itemsToSort].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })
    setFilteredQuizzes(sorted)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteQuiz(id)
      message.success(t("quiz.msg_delete_success", language))
      loadQuizzes()
    } catch (error) {
      console.error("Failed to delete quiz:", error)
      message.error(t("quiz.msg_delete_error", language))
    }
  }

  const handleClearFilters = () => {
    setSearchText("")
    setSelectedCategory("All")
    setCurrentPage(1)
  }

  const columns = [
    {
      title: t("quiz.table_quiz_name", language),
      dataIndex: "title",
      key: "title",
      width: "40%",
      render: (_: string, record: Quiz) => (
        <div>
          <div className="font-medium text-gray-900">{record.title}</div>
          <Typography.Text type="secondary" className="text-xs">
            {record.category_name || t("quiz.msg_no_category", language)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t("quiz.table_description", language),
      dataIndex: "description",
      key: "description",
      width: "30%",
      render: (text: string | null) => (
        <span>{text || t("quiz.msg_no_description", language)}</span>
      ),
    },
    {
      title: t("quiz.table_time_limit", language),
      dataIndex: "time_limit_minutes",
      key: "time_limit_minutes",
      width: "12%",
      render: (text: number | null) => (
        <span>{text || t("quiz.msg_unlimited", language)}</span>
      ),
    },
    {
      title: t("quiz.table_passing_score", language),
      dataIndex: "passing_score",
      key: "passing_score",
      width: "10%",
      render: (text: number) => <span>{text}%</span>,
    },
    {
      title: t("quiz.table_actions", language),
      key: "action",
      width: "8%",
      align: "center" as const,
      render: (_: any, record: Quiz) => {
        const guard = deleteGuards[record.id]
        const isUsedInCourse = guard?.isUsedInCourse ?? false
        const canDeleteLocal = !isUsedInCourse
        const deleteReason =
          guard?.reason || t("quiz.msg_cannot_delete", language)

        return (
          <Space size="middle">
            <Link href={`/quizzes/${record.id}`}>
              <EyeOutlined
                style={{ cursor: "pointer", color: "#1890ff" }}
                title={t("quiz.btn_view_edit", language)}
              />
            </Link>
            {canDeleteLocal ? (
              <Popconfirm
                title={t("quiz.modal_delete_title", language)}
                description={t("quiz.msg_delete_confirm", language)}
                onConfirm={() => handleDelete(record.id)}
                okText={t("quiz.btn_yes", language)}
                cancelText={t("quiz.btn_no", language)}
                okButtonProps={{ danger: true }}
              >
                <DeleteOutlined
                  style={{ cursor: "pointer", color: "#ff4d4f" }}
                  title={t("quiz.btn_delete", language)}
                />
              </Popconfirm>
            ) : (
              <Tooltip title={deleteReason}>
                <span>
                  <DeleteOutlined
                    style={{ cursor: "not-allowed", color: "#d1d5db" }}
                    title={t("quiz.btn_delete", language)}
                  />
                </span>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          {t("quiz.management.title", language)}
        </h1>
        <div
          className="flex align-center justify-between gap-6"
          style={{ marginBottom: 16 }}
        >
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            {t("quiz.management.description", language)}
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
            onClick={() => setIsCreateModalVisible(true)}
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
            {t("quiz.btn_create_quiz", language)}
          </Button>
        </div>
        <Divider
          style={{ borderColor: "rgba(37, 99, 235, 0.15)", margin: "16px 0" }}
        />
      </div>

      {/* Controls Widget - White Card (Compact) */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="space-y-3">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder={t("quiz.search_placeholder", language)}
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
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("quiz.label_category", language)}
              </Typography.Text>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={[
                  {
                    label: t("quiz.option_all_categories", language),
                    value: "All",
                  },
                  ...categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  })),
                ]}
                loading={loadingCategories}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("quiz.label_sort_by", language)}
              </Typography.Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  {
                    label: t("quiz.sort_newest_first", language),
                    value: "newest",
                  },
                  {
                    label: t("quiz.sort_oldest_first", language),
                    value: "oldest",
                  },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("quiz.label_view_mode", language)}
              </Typography.Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as "list" | "grid")}
                options={[
                  { label: t("quiz.view_list", language), value: "list" },
                  { label: t("quiz.view_grid", language), value: "grid" },
                ]}
                block
              />
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col justify-end">
                <Tooltip title={t("quiz.tooltip_clear_filters", language)}>
                  <Button
                    type="dashed"
                    danger
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    {t("quiz.btn_clear_filters", language)}
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
              viewMode === "list" ? (
                <Table
                  columns={columns}
                  dataSource={filteredQuizzes.map((quiz) => ({
                    ...quiz,
                    key: quiz.id,
                  }))}
                  pagination={false}
                  bordered
                  size="middle"
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredQuizzes.map((quiz) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={quiz.id}>
                      {(() => {
                        const guard = deleteGuards[quiz.id]
                        const isUsedInCourse = guard?.isUsedInCourse ?? false
                        const canDeleteLocal = !isUsedInCourse
                        const deleteReason =
                          guard?.reason || "Cannot delete this quiz"

                        return (
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
                                  {quiz.description || "Không có mô tả"}
                                </span>
                              }
                            />
                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <Typography.Text type="secondary">
                                  {t("quiz.label_category_grid", language)}
                                </Typography.Text>
                                <Typography.Text strong>
                                  {quiz.category_name || "N/A"}
                                </Typography.Text>
                              </div>
                              <div className="flex justify-between">
                                <Typography.Text type="secondary">
                                  {t("quiz.label_time_grid", language)}
                                </Typography.Text>
                                <Typography.Text strong>
                                  {quiz.time_limit_minutes
                                    ? `${quiz.time_limit_minutes} min`
                                    : t("quiz.msg_unlimited", language)}
                                </Typography.Text>
                              </div>
                              <div className="flex justify-between">
                                <Typography.Text type="secondary">
                                  {t("quiz.label_passing_grid", language)}
                                </Typography.Text>
                                <Typography.Text strong>
                                  <Tag color="blue">{quiz.passing_score}%</Tag>
                                </Typography.Text>
                              </div>
                              <div className="flex justify-between">
                                <Typography.Text type="secondary">
                                  {t("quiz.label_attempts_grid", language)}
                                </Typography.Text>
                                <Typography.Text strong>
                                  {quiz.max_attempts}
                                </Typography.Text>
                              </div>
                              <div className="flex justify-between">
                                <Typography.Text type="secondary">
                                  {t("quiz.label_created_grid", language)}
                                </Typography.Text>
                                <Typography.Text strong>
                                  {new Date(quiz.created_at).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </Typography.Text>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Link
                                href={`/quizzes/${quiz.id}`}
                                className="flex-1"
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeOutlined />}
                                  className="w-full text-blue-600 hover:!text-blue-700"
                                >
                                  {t("quiz.btn_view_edit", language)}
                                </Button>
                              </Link>
                              {canDeleteLocal ? (
                                <Popconfirm
                                  title={t("quiz.modal_delete_title", language)}
                                  description={t(
                                    "quiz.msg_delete_confirm",
                                    language
                                  )}
                                  onConfirm={() => handleDelete(quiz.id)}
                                  okText={t("quiz.btn_yes", language)}
                                  cancelText={t("quiz.btn_no", language)}
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    className="w-full"
                                  >
                                    {t("quiz.btn_delete", language)}
                                  </Button>
                                </Popconfirm>
                              ) : (
                                <Tooltip title={deleteReason}>
                                  <span className="flex-1">
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      className="w-full"
                                      disabled
                                    >
                                      {t("quiz.btn_delete", language)}
                                    </Button>
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                          </Card>
                        )
                      })()}
                    </Col>
                  ))}
                </Row>
              )
            ) : (
              <Empty
                description={t("quiz.msg_no_quizzes", language)}
                style={{ marginTop: "60px" }}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                >
                  {t("quiz.btn_create_first", language)}
                </Button>
              </Empty>
            )}
          </Spin>
          {filteredQuizzes.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalQuizzes}
                showSizeChanger
                onChange={handlePaginationChange}
                showTotal={(total) =>
                  `${t("quiz.label_total", language)} ${total} ${t("quiz.suffix_quizzes", language)}`
                }
              />
            </div>
          )}
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
