'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Input,
  Button,
  Table,
  message,
  Tag,
  Typography,
  Select,
  Row,
  Col,
  Spin,
  Segmented,
  Empty,
  Card,
  Space,
  Divider,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { QuestionType } from '@/service/questionbank.service'
import * as actions from '@/action/question-bank/questionBankActions'
import CreateQuestionModalWrapper from './create/create-question-modal-wrapper'
import { ActionCell } from './action-cell'

const { Text, Title } = Typography

interface QuestionBankClientProps {
  questions: QuestionType[]
  totalItems: number
  currentPage: number
  pageSize: number
  categories: Record<string, any>[]
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

const getTypeLabel = (type: string): string => {
  if (type === 'single_choice') return 'Single Choice'
  if (type === 'multiple_choice') return 'Multiple Choice'
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
}: QuestionBankClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [messageApi, contextHolder] = message.useMessage()

  // Search and filter states
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchInput = useDebounce(searchInput, 300)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Filtered data
  const [filteredQuestions, setFilteredQuestions] =
    useState<QuestionType[]>(initialQuestions)
  const [loading, setLoading] = useState(false)

  // Check active filters
  useEffect(() => {
    const active =
      debouncedSearchInput !== '' ||
      selectedType !== 'all' ||
      selectedCategory !== 'all'
    setHasActiveFilters(active)
  }, [debouncedSearchInput, selectedType, selectedCategory])

  // Apply filters
  useEffect(() => {
    let filtered = [...initialQuestions]

    // Filter by search
    if (debouncedSearchInput) {
      filtered = filtered.filter(
        (q) =>
          q.question_text
            .toLowerCase()
            .includes(debouncedSearchInput.toLowerCase()) ||
          q.explanation
            ?.toLowerCase()
            .includes(debouncedSearchInput.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((q) => q.type === selectedType)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((q) => q.name === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    setFilteredQuestions(filtered)
  }, [
    initialQuestions,
    debouncedSearchInput,
    selectedType,
    selectedCategory,
    sortOrder,
  ])

  const handleClearFilters = () => {
    setSearchInput('')
    setSelectedType('all')
    setSelectedCategory('all')
    setSortOrder('newest')
  }

  // Table columns
  const columns: TableProps<QuestionType>['columns'] = [
    {
      title: 'Nội dung',
      dataIndex: 'question_text',
      key: 'question_text',
      render: (text: string) => (
        <span className='font-medium text-gray-900'>{truncateText(text, 50)}</span>
      ),
    },
    {
      title: 'Chủ đề',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => <Tag color='blue'>{name}</Tag>,
    },
    {
      title: 'Thể loại',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => {
        const label = getTypeLabel(type)
        const color = type === 'multiple_choice' ? 'cyan' : 'purple'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => (
        <span className='text-gray-600'>{formatDate(date)}</span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_, record) => <ActionCell record={record} categories={categories} />,
    },
  ]

  // Render grid view
  const renderGridView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className='text-center py-12'>
          <Spin spinning={loading} />
          <p className='text-gray-500 mt-4'>Không có câu hỏi nào</p>
        </div>
      )
    }

    return (
      <Row gutter={[16, 16]}>
        {filteredQuestions.map((question) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={question.id}>
            <Card
              hoverable
              className='h-full hover:shadow-lg transition-shadow'
              extra={
                <Tag color={question.type === 'multiple_choice' ? 'cyan' : 'purple'}>
                  {getTypeLabel(question.type)}
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
                  <Text type='secondary'>Chủ đề:</Text>
                  <Text strong>{question.name}</Text>
                </div>
                <div className='flex justify-between'>
                  <Text type='secondary'>Ngày tạo:</Text>
                  <Text strong>{formatDate(question.created_at)}</Text>
                </div>
                {question.explanation && (
                  <div className='flex justify-between'>
                    <Text type='secondary'>Giải thích:</Text>
                    <Text strong>{truncateText(question.explanation, 15)}</Text>
                  </div>
                )}
              </div>
              <div className='mt-4 flex gap-2'>
                <ActionCell record={question} categories={categories} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div className='mb-8'>
        <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4'>
          Quản lý Ngân hàng câu hỏi
        </h1>
        <div
          className='flex align-center justify-between gap-6'
          style={{ marginBottom: 16 }}
        >
          <p className='text-gray-600 max-w-2xl leading-relaxed'>
            Quản lý và tổ chức các câu hỏi cho các bài quiz
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
            placeholder='Tìm kiếm câu hỏi...'
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
                Thể loại
              </Text>
              <Select
                value={selectedType}
                onChange={setSelectedType}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Single Choice', value: 'single_choice' },
                  { label: 'Multiple Choice', value: 'multiple_choice' },
                ]}
                size='middle'
                className='w-full'
              />
            </div>

            <div className='flex flex-col'>
              <Text type='secondary' className='text-sm font-medium mb-2'>
                Chủ đề
              </Text>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { label: 'Tất cả', value: 'all' },
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
                Sắp xếp
              </Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: 'Mới nhất', value: 'newest' },
                  { label: 'Cũ nhất', value: 'oldest' },
                ]}
                size='middle'
                className='w-full'
              />
            </div>

            <div className='flex flex-col'>
              <Text type='secondary' className='text-sm font-medium mb-2'>
                Chế độ xem
              </Text>
              <Segmented
                size='middle'
                value={viewMode}
                onChange={(value) => setViewMode(value as 'list' | 'grid')}
                options={[
                  { label: 'Danh sách', value: 'list' },
                  { label: 'Lưới', value: 'grid' },
                ]}
                block
              />
            </div>

            {hasActiveFilters && (
              <div className='flex flex-col justify-end col-span-1 sm:col-span-2 lg:col-span-4'>
                <Tooltip title='Xóa tất cả bộ lọc'>
                  <Button
                    type='dashed'
                    danger
                    size='small'
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    className='w-full'
                  >
                    Xóa bộ lọc
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
                dataSource={filteredQuestions}
                rowKey='id'
                pagination={{
                  pageSize: 10,
                  total: filteredQuestions.length,
                  showSizeChanger: false,
                  showTotal: (total) => `Tổng cộng ${total} câu hỏi`,
                }}
                bordered
                size='middle'
              />
            </div>
          ) : (
            <div className='p-6'>{renderGridView()}</div>
          )}
        </Spin>
      </div>
    </>
  )
}
