'use client'

import React, { useState, useCallback } from 'react'
import { SearchOutlined } from '@ant-design/icons'

interface ArticleSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export const ArticleSearch: React.FC<ArticleSearchProps> = ({
  onSearch,
  placeholder = 'Tìm kiếm bài viết...',
}) => {
  const [value, setValue] = useState('')
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Debounce search with 200ms delay (same as Q&A)
    timerRef.current = setTimeout(() => {
      onSearch(newValue)
    }, 200)
  }

  const handleClear = () => {
    setValue('')
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    onSearch('')
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <SearchOutlined
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#60a5fa',
          fontSize: '16px',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          paddingLeft: '36px',
          paddingRight: '32px',
          paddingTop: '8px',
          paddingBottom: '8px',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          fontSize: '13px',
          transition: 'all 0.2s',
          boxSizing: 'border-box',
          outline: 'none',
          backgroundColor: 'white',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#60a5fa'
          e.currentTarget.style.boxShadow = '0 0 0 1px rgba(96, 165, 250, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e5e7eb'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '14px',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#6b7280'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af'
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
