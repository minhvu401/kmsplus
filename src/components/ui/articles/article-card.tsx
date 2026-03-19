'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { EyeOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons'

interface ArticleCardProps {
  id: string | number
  title: string
  snippet: string
  authorName: string
  authorAvatar?: string
  thumbnailUrl?: string
  publishedAt: Date | string
  viewCount?: number
  readingTime?: number
  commentCount?: number
  tags?: string[]
  category?: string
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  id,
  title,
  snippet,
  authorName,
  authorAvatar,
  thumbnailUrl = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop',
  publishedAt,
  viewCount = 0,
  readingTime = 5,
  commentCount = 0,
  tags = [],
  category,
}) => {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/articles/${id}`)
  }

  const formattedDate = new Date(publishedAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-200"
    >
      {/* Hero Visual */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop'
          }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author Section */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {authorName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{authorName}</p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>

        {/* Category Badge */}
        {category && (
          <div className="inline-block mb-2 px-2 py-1 bg-blue-50 rounded text-xs font-semibold text-blue-900">
            {category}
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
          {title}
        </h3>

        {/* Snippet */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{snippet}</p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && <span className="text-xs text-gray-500">+{tags.length - 3}</span>}
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <EyeOutlined className="text-gray-400 text-xs" />
              <span className="font-semibold text-gray-700">{viewCount.toLocaleString('vi-VN')}</span>
              <span className="text-gray-500 text-xs">lượt xem</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClockCircleOutlined className="text-gray-400 text-xs" />
              <span className="font-semibold text-gray-700">{readingTime}</span>
              <span className="text-gray-500 text-xs">phút</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageOutlined className="text-gray-400 text-xs" />
            <span className="font-semibold text-gray-700">{commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
