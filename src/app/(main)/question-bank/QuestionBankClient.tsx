'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Input,
  Button,
  Table,
  Tag,
  Typography,
  Select,
  Row,
  Col,
  Spin,
  Segmented,
  Card,
  Divider,
  Tooltip,
  Modal,
  Pagination,
} from 'antd'
import {
  SearchOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { FullQuestionType, QuestionType } from '@/service/questionbank.service'
import * as actions from '@/action/question-bank/questionBankActions'
import CreateQuestionModalWrapper from './create/create-question-modal-wrapper'
import { ActionCell } from './action-cell'
import useLanguageStore from '@/store/useLanguageStore'

const { Text, Title } = Typography

interface QuestionBankClientProps {
  questions: QuestionType[]
  totalItems: number
  currentPage: number
  pageSize: number
  categories: Record<string, any>[]
  query: string
  selectedType: string
  selectedCategory: string
  sortOrder: 'newest' | 'oldest'
  currentUserId: number | null
  isSystemAdmin: boolean
}

// Utility functions
const truncateText = (text: string, maxLength: number = 50): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const getTypeLabel = (type: string, language: 'vi' | 'en'): string => {
  if (type === 'single_choice') return language === 'vi' ? 'Một đáp án' : 'Single Choice'
  if (type === 'multiple_choice') return language === 'vi' ? 'Nhiều đáp án' : 'Multiple Choice'
  return type
}

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

export default function QuestionBankClient({
  questions: initialQuestions,
  totalItems,
  currentPage,
  pageSize,
  categories,
  query,
  selectedType: initialSelectedType,
  selectedCategory: initialSelectedCategory,
  sortOrder: initialSortOrder,
  currentUserId,
  isSystemAdmin,
}: QuestionBankClientProps) {
  const { language } = useLanguageStore()
  const isVi = language === 'vi'
  const text = {
    typeSingle: isVi ? 'Một đáp án' : 'Single Choice',
    typeMultiple: isVi ? 'Nhiều đáp án' : 'Multiple Choice',
    cannotManageActiveQuiz: isVi
      ? 'Câu hỏi này đang được sử dụng trong một quiz đang hoạt động nên không thể chỉnh sửa hoặc xóa.'
      : 'This question is used in an active quiz and cannot be edited or deleted.',
    cannotVerifyUser: isVi
      ? 'Không thể xác minh người dùng hiện tại để chỉnh sửa/xóa câu hỏi này.'
      : 'Unable to verify current user to edit/delete this question.',
    creatorOnly: isVi
      ? 'Bạn chỉ có thể chỉnh sửa hoặc xóa câu hỏi do bạn tạo.'
      : 'You can only edit or delete questions you created.',
    columnContent: isVi ? 'Nội dung' : 'Content',
    columnTopic: isVi ? 'Chủ đề' : 'Topic',
    columnType: isVi ? 'Thể loại' : 'Type',
    columnCreatedAt: isVi ? 'Ngày tạo' : 'Created At',
    columnAction: isVi ? 'Hành động' : 'Action',
    noQuestions: isVi ? 'Không có câu hỏi nào' : 'No questions found',
    topicLabel: isVi ? 'Chủ đề:' : 'Topic:',
    createdAtLabel: isVi ? 'Ngày tạo:' : 'Created:',
    explanationLabel: isVi ? 'Giải thích:' : 'Explanation:',
    pageTitle: isVi ? 'Quản lý Ngân hàng câu hỏi' : 'Question Bank Management',
    pageSubtitle: isVi
      ? 'Quản lý và tổ chức các câu hỏi cho các bài quiz'
      : 'Manage and organize questions for quizzes',
    searchPlaceholder: isVi ? 'Tìm kiếm câu hỏi...' : 'Search questions...',
    filterType: isVi ? 'Thể loại' : 'Type',
    filterTopic: isVi ? 'Chủ đề' : 'Topic',
    filterSort: isVi ? 'Sắp xếp' : 'Sort',
    filterView: isVi ? 'Chế độ xem' : 'View mode',
    all: isVi ? 'Tất cả' : 'All',
    newest: isVi ? 'Mới nhất' : 'Newest',
    oldest: isVi ? 'Cũ nhất' : 'Oldest',
    viewList: isVi ? 'Danh sách' : 'List',
    viewGrid: isVi ? 'Lưới' : 'Grid',
    clearAllFilters: isVi ? 'Xóa tất cả bộ lọc' : 'Clear all filters',
    clearFilters: isVi ? 'Xóa bộ lọc' : 'Clear Filters',
    totalQuestions: (total: number) =>
      isVi ? `Tổng cộng ${total} câu hỏi` : `Total ${total} questions`,
    previewTitle: isVi ? 'Chi tiết câu hỏi' : 'Question Details',
    previewContent: isVi ? 'Nội dung' : 'Content',
    previewExplanation: isVi ? 'Giải thích' : 'Explanation',
    previewAnswers: isVi ? 'Đáp án' : 'Answers',
    noAnswerData: isVi
      ? 'Không có dữ liệu đáp án để hiển thị.'
      : 'No answer data available.',
    correctAnswer: isVi ? 'Đáp án đúng' : 'Correct answer',
  }
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Search and filter states
  const [searchInput, setSearchInput] = useState(query)
  const debouncedSearchInput = useDebounce(searchInput, 300)
  const selectedType = initialSelectedType
  const selectedCategory = initialSelectedCategory
  const sortOrder = initialSortOrder

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const [loading, setLoading] = useState(false)
  const [modalCategories, setModalCategories] = useState<Record<string, any>[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<QuestionType | null>(null)
  const [previewDetail, setPreviewDetail] = useState<FullQuestionType | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const setOrDeleteParam = (
    params: URLSearchParams,
    key: string,
    value: string,
    defaultValue: string
  ) => {
    if (value === defaultValue || value === '') {
      params.delete(key)
      return
    }
    params.set(key, value)
  }

  const pushParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    updater(params)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleTablePaginationChange = (page: number, nextPageSize: number) => {
    pushParams((params) => {
      params.set('page', page.toString())
      params.set('limit', nextPageSize.toString())
    })
  }

  const hasActiveFilters =
    query !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    sortOrder !== 'newest'

  useEffect(() => {
    // Ignore stale debounced value when query changed externally via URL updates.
    if (debouncedSearchInput !== searchInput) {
      return
    }

    if (debouncedSearchInput === query) {
      return
    }

    pushParams((params) => {
      setOrDeleteParam(params, 'query', debouncedSearchInput, '')
      params.set('page', '1')
    })
  }, [debouncedSearchInput, searchInput, query])

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    const loadModalCategories = async () => {
      try {
        const cats = await actions.getCategoriesForQuestionModal()
        setModalCategories(cats || [])
      } catch (error) {
        console.error('Error loading modal categories:', error)
        setModalCategories([])
      }
    }

    loadModalCategories()
  }, [])

  const handleTypeChange = (value: string) => {
    pushParams((params) => {
      setOrDeleteParam(params, 'type', value, 'all')
      params.set('page', '1')
    })
  }

  const handleCategoryChange = (value: string) => {
    pushParams((params) => {
      setOrDeleteParam(params, 'category', value, 'all')
      params.set('page', '1')
    })
  }

  const handleSortChange = (value: 'newest' | 'oldest') => {
    pushParams((params) => {
      setOrDeleteParam(params, 'sort', value, 'newest')
      params.set('page', '1')
    })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    pushParams((params) => {
      params.delete('query')
      params.delete('type')
      params.delete('category')
      params.delete('sort')
      params.set('page', '1')
    })
  }

  const parseOptions = (raw: unknown): string[] => {
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item))
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
      } catch {
        return []
      }
    }

    return []
  }

  const parseCorrectAnswers = (raw: unknown): number[] => {
    if (typeof raw === 'number') {
      return [raw]
    }

    if (Array.isArray(raw)) {
      return raw
        .map((item) => Number(item))
        .filter((value) => Number.isFinite(value))
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return parseCorrectAnswers(parsed)
      } catch {
        const numeric = Number(raw)
        return Number.isFinite(numeric) ? [numeric] : []
      }
    }

    return []
  }

  const openPreview = async (question: QuestionType) => {
    setPreviewQuestion(question)
    setIsPreviewOpen(true)
    setIsPreviewLoading(true)

    try {
      const detail = await actions.getQuestionById(question.id)
      setPreviewDetail((detail as FullQuestionType) || null)
    } catch (error) {
      console.error('Error loading question preview detail:', error)
      setPreviewDetail(null)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const getManagePermission = (question: QuestionType) => {
    if (question.is_in_active_quiz) {
      return {
        canManage: false,
        reason: text.cannotManageActiveQuiz,
      }
    }

    if (isSystemAdmin) {
      return { canManage: true, reason: '' }
    }

    if (currentUserId == null) {
      return {
        canManage: false,
        reason: text.cannotVerifyUser,
      }
    }

    if (Number(question.creator_id) === Number(currentUserId)) {
      return { canManage: true, reason: '' }
    }

    return {
      canManage: false,
      reason: text.creatorOnly,
    }
  }

  // Table columns
  const columns: TableProps<QuestionType>['columns'] = [
    {
      title: text.columnContent,
      dataIndex: 'question_text',
      key: 'question_text',
      render: (text: string, record: QuestionType) => (
        <button
          type='button'
          className='font-medium text-gray-900 hover:text-blue-700 hover:underline text-left'
          onClick={() => openPreview(record)}
        >
          {truncateText(text, 50)}
        </button>
      ),
    },
    {
      title: text.columnTopic,
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => <Tag color='blue'>{name}</Tag>,
    },
    {
      title: text.columnType,
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => {
        const label = getTypeLabel(type, language)
        const color = type === 'multiple_choice' ? 'cyan' : 'purple'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: text.columnCreatedAt,
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => (
        <span className='text-gray-600'>{formatDate(date)}</span>
      ),
    },
    {
      title: text.columnAction,
      key: 'action',
      width: 100,
      render: (_, record) => {
        const permission = getManagePermission(record)
        return (
          <ActionCell
            record={record}
            categories={modalCategories}
            canManage={permission.canManage}
            disabledReason={permission.reason}
          />
        )
      },
    },
  ]

  // Render grid view
  const renderGridView = () => {
    if (initialQuestions.length === 0) {
      return (
        <div className='text-center py-12'>
          <Spin spinning={loading} />
          <p className='text-gray-500 mt-4'>{text.noQuestions}</p>
        </div>
      )
    }

    return (
      <Row gutter={[16, 16]}>
        {initialQuestions.map((question) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={question.id}>
            <Card
              hoverable
              className='h-full hover:shadow-lg transition-shadow'
              onClick={() => openPreview(question)}
              extra={
                <Tag color={question.type === 'multiple_choice' ? 'cyan' : 'purple'}>
                  {getTypeLabel(question.type, language)}
                </Tag>
              }
            >
              <Card.Meta
                title={
                  <div className='text-blue-600 hover:text-blue-800 truncate font-medium'>
                    {truncateText(question.question_text, 40)}
                  </div>
                }
              />
              <div className='mt-4 space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <Text type='secondary'>{text.topicLabel}</Text>
                  <Text strong>{question.name}</Text>
                </div>
                <div className='flex justify-between'>
                  <Text type='secondary'>{text.createdAtLabel}</Text>
                  <Text strong>{formatDate(question.created_at)}</Text>
                </div>
                {question.explanation && (
                  <div className='flex justify-between'>
                    <Text type='secondary'>{text.explanationLabel}</Text>
                    <Text strong>{truncateText(question.explanation, 15)}</Text>
                  </div>
                )}
              </div>
              <div className='mt-4 flex gap-2' onClick={(e) => e.stopPropagation()}>
                {(() => {
                  const permission = getManagePermission(question)
                  return (
                    <ActionCell
                      record={question}
                      categories={modalCategories}
                      canManage={permission.canManage}
                      disabledReason={permission.reason}
                    />
                  )
                })()}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4'>
          {text.pageTitle}
        </h1>
        <div
          className='flex align-center justify-between gap-6'
          style={{ marginBottom: 16 }}
        >
          <p className='text-gray-600 max-w-2xl leading-relaxed'>
            {text.pageSubtitle}
          </p>
          <CreateQuestionModalWrapper />
        </div>
        <Divider
          style={{ borderColor: 'rgba(37, 99, 235, 0.15)', margin: '16px 0' }}
        />
      </div>

      {/* Filter Card */}
      <div className='bg-white rounded-lg shadow-sm p-5 mb-6'>
        <div className='space-y-3'>
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder={text.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size='middle'
            allowClear
            enterButton={<SearchOutlined />}
            style={{ marginBottom: 12 }}
          />

          {/* Filters Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='flex flex-col'>
              <Text type='secondary' className='text-sm font-medium mb-2'>
                {text.filterType}
              </Text>
              <Select
                value={selectedType}
                onChange={handleTypeChange}
                options={[
                  { label: text.all, value: 'all' },
                  { label: text.typeSingle, value: 'single_choice' },
                  { label: text.typeMultiple, value: 'multiple_choice' },
                ]}
                size='middle'
                className='w-full'
              />
            </div>

            <div className='flex flex-col'>
              <Text type='secondary' className='text-sm font-medium mb-2'>
                {text.filterTopic}
              </Text>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={[
                  { label: text.all, value: 'all' },
                  ...categories.map((cat) => ({
                    value: cat.name,
                    label: cat.name,
                  })),
                ]}
                size='middle'
                className='w-full'
              />
            </div>

            <div className='flex flex-col'>
              <Text type='secondary' className='text-sm font-medium mb-2'>
                {text.filterSort}
              </Text>
              <Select
                value={sortOrder}
                onChange={handleSortChange}
                options={[
                  { label: text.newest, value: 'newest' },
                  { label: text.oldest, value: 'oldest' },
                ]}
                size='middle'
                className='w-full'
              />
            </div>

            <div className='flex flex-col'>
              <Text type='secondary' className='text-sm font-medium mb-2'>
                {text.filterView}
              </Text>
              <Segmented
                size='middle'
                value={viewMode}
                onChange={(value) => setViewMode(value as 'list' | 'grid')}
                options={[
                  { label: text.viewList, value: 'list' },
                  { label: text.viewGrid, value: 'grid' },
                ]}
                block
              />
            </div>

            {hasActiveFilters && (
              <div className='flex flex-col justify-end col-span-1 sm:col-span-2 lg:col-span-4'>
                <Tooltip title={text.clearAllFilters}>
                  <Button
                    type='dashed'
                    danger
                    size='small'
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    className='w-full'
                  >
                    {text.clearFilters}
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table/Grid View */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        <Spin spinning={loading}>
          {viewMode === 'list' ? (
            <div className='p-6'>
              <Table
                columns={columns}
                dataSource={initialQuestions}
                rowKey='id'
                pagination={{
                  current: currentPage,
                  pageSize,
                  total: totalItems,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onChange: handleTablePaginationChange,
                  onShowSizeChange: handleTablePaginationChange,
                  showTotal: (total) => text.totalQuestions(total),
                }}
                bordered
                size='middle'
              />
            </div>
          ) : (
            <div className='p-6'>
              {renderGridView()}
              {totalItems > 0 && (
                <div className='mt-6 flex justify-end'>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalItems}
                    showSizeChanger
                    pageSizeOptions={['10', '20', '50', '100']}
                    onChange={handleTablePaginationChange}
                    onShowSizeChange={handleTablePaginationChange}
                    showTotal={(total) => text.totalQuestions(total)}
                  />
                </div>
              )}
            </div>
          )}
        </Spin>
      </div>

      <Modal
        title={text.previewTitle}
        open={isPreviewOpen}
        onCancel={() => {
          setIsPreviewOpen(false)
          setPreviewQuestion(null)
          setPreviewDetail(null)
        }}
        footer={null}
        width={720}
        centered
      >
        {previewQuestion && (
          <div className='space-y-4'>
            <div>
              <Text type='secondary'>{text.previewContent}</Text>
              <p className='mt-1 whitespace-pre-wrap text-gray-900'>
                {previewQuestion.question_text}
              </p>
            </div>
            <div className='flex gap-2'>
              <Tag color='blue'>{previewQuestion.name}</Tag>
              <Tag
                color={
                  previewQuestion.type === 'multiple_choice' ? 'cyan' : 'purple'
                }
              >
                {getTypeLabel(previewQuestion.type, language)}
              </Tag>
            </div>
            {previewQuestion.explanation && (
              <div>
                <Text type='secondary'>{text.previewExplanation}</Text>
                <p className='mt-1 whitespace-pre-wrap text-gray-800'>
                  {previewQuestion.explanation}
                </p>
              </div>
            )}

            <div>
              <Text type='secondary'>{text.previewAnswers}</Text>
              <Spin spinning={isPreviewLoading}>
                {(() => {
                  const options = parseOptions(previewDetail?.options)
                  const correctAnswers = parseCorrectAnswers(
                    previewDetail?.correct_answer
                  )

                  if (options.length === 0) {
                    return (
                      <p className='mt-1 text-gray-500'>
                        {text.noAnswerData}
                      </p>
                    )
                  }

                  return (
                    <div className='mt-2 space-y-2'>
                      {options.map((option, index) => {
                        const isCorrect = correctAnswers.includes(index)
                        const optionLabel = String.fromCharCode(65 + index)

                        return (
                          <div
                            key={`${previewQuestion.id}-${index}`}
                            className={`rounded border px-3 py-2 ${
                              isCorrect
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <span className='font-medium text-gray-700'>
                                {optionLabel}.
                              </span>
                              {isCorrect && <Tag color='green'>{text.correctAnswer}</Tag>}
                            </div>
                            <p className='mt-1 whitespace-pre-wrap text-gray-900'>
                              {option}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </Spin>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
