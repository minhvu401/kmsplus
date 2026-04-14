'use client'

import { CreateQuestion } from '@/components/ui/questions/create-button'
import Pagination from '@/components/ui/questions/pagination'
import QuestionsList from '@/components/ui/questions/questions-list'
import PageSizeSelector from '@/components/ui/questions/page-size-selector'
import TopKnowledgeSharers from '@/components/ui/questions/top-knowledge-sharers'
import CompactFilters from '@/components/ui/questions/compact-filters'
import useLanguageStore from '@/store/useLanguageStore'
import { Flex, Divider } from 'antd'

type Category = { id: number; name: string }

type Question = {
  id: number
  user_id: number
  category_id: number | null
  title: string
  content: string
  answer_count: number
  is_closed: boolean
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
  user_name: string
  category_name: string
  user_avatar?: string | null
}

type TopSharer = {
  id: number
  name: string
  score: number
  avatar_url?: string | null
}

interface QuestionsPageContentProps {
  categories: Category[]
  userId: number
  questions: Question[]
  noSearchResults: boolean
  isEmpty: boolean
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  topSharers: TopSharer[]
}

export default function QuestionsPageContent({
  categories,
  userId,
  questions,
  noSearchResults,
  isEmpty,
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  topSharers,
}: QuestionsPageContentProps) {
  const { language } = useLanguageStore()
  const isVi = language === 'vi'

  const text = isVi
    ? {
        heading: 'Hỏi & Đáp',
        description:
          'Tạo, khám phá và chia sẻ câu hỏi - câu trả lời với đội ngũ của bạn. Mở rộng kho tri thức bằng cách đóng góp insight và tìm lời giải cho các vấn đề thường gặp.',
        showing: 'Hiển thị',
        of: 'trên',
        questions: 'câu hỏi',
      }
    : {
        heading: 'Q&A',
        description:
          'Create, explore, and share questions and answers with your team. Enhance your knowledge base by contributing insights and finding solutions to common challenges.',
        showing: 'Showing',
        of: 'of',
        questions: 'questions',
      }

  return (
    <div className='p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4'>
          {text.heading}
        </h1>
        <Flex align='center' justify='space-between' gap={24} style={{ marginBottom: 16 }}>
          <p className='text-gray-600 max-w-2xl leading-relaxed'>{text.description}</p>
          <CreateQuestion categories={categories} userId={userId} isFullWidth={false} />
        </Flex>
        <Divider style={{ borderColor: 'rgba(37, 99, 235, 0.15)', margin: '16px 0' }} />
      </div>

      <div className='bg-white rounded-lg shadow-sm p-5 mb-6'>
        <CompactFilters categories={categories} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <Flex
              style={{
                marginBottom: 24,
                width: '100%',
                minHeight: isEmpty ? undefined : 'auto',
              }}
            >
              <QuestionsList questions={questions} noSearchResults={noSearchResults} />
            </Flex>

            {!isEmpty && (
              <>
                <Divider style={{ margin: '24px 0', borderColor: '#f3f4f6' }} />

                <Flex justify='space-between' align='center' style={{ marginTop: 20 }}>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {text.showing}{' '}
                    <span style={{ fontWeight: '500' }}>
                      {questions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                      {Math.min(currentPage * pageSize, totalItems)}
                    </span>{' '}
                    {text.of} <span style={{ fontWeight: '500' }}>{totalItems}</span> {text.questions}
                  </div>
                  <Pagination totalPages={totalPages} />
                </Flex>

                <Flex justify='flex-end' style={{ marginTop: 16 }}>
                  <PageSizeSelector currentPageSize={pageSize} />
                </Flex>
              </>
            )}
          </div>
        </div>

        <div className='lg:col-span-1'>
          <TopKnowledgeSharers topSharers={topSharers} />
        </div>
      </div>
    </div>
  )
}
