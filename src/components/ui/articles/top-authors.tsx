'use client'

import React from 'react'

interface TopAuthor {
  id: string | number
  name: string
  articleCount: number
}

interface TopAuthorsProps {
  authors: TopAuthor[]
  isLoading?: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

export const TopAuthors: React.FC<TopAuthorsProps> = ({ authors, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">TÁC GIẢ NỔI BẬT</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!authors || authors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-20">
        <h3 className="text-sm font-bold text-gray-900 mb-4">TÁC GIẢ NỔI BẬT</h3>
        <p className="text-sm text-gray-500 text-center py-6">Chưa có tác giả nào</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-20">
      <h3 className="text-sm font-bold text-gray-900 mb-4">TÁC GIẢ NỔI BẬT</h3>
      <div className="space-y-3">
        {authors.map((author, index) => {
          const medal = index < 3 ? MEDALS[index] : `${index + 1}.`
          const isTopThree = index < 3

          return (
            <div
              key={author.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isTopThree ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
              }`}
            >
              {/* Medal Badge */}
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{medal}</span>
              </div>

              {/* Author Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{author.name}</p>
                <p className="text-xs text-gray-500">
                  {author.articleCount} bài viết
                </p>
              </div>

              {/* Score Badge */}
              {isTopThree && (
                <div className={`px-2 py-1 rounded text-xs font-bold text-white ${
                  index === 0
                    ? 'bg-yellow-500'
                    : index === 1
                      ? 'bg-gray-400'
                      : 'bg-orange-600'
                }`}>
                  {author.articleCount}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
