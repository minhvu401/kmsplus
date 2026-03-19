'use client'

import React from 'react'

interface CategoryPillsProps {
  categories: { id: number; name: string }[]
  selectedCategoryId?: number | null
  onCategoryChange: (categoryId: number | null) => void
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
}) => {
  const categoryLabels: Record<string, string> = {
    'Technology': 'CÔNG NGHỆ',
    'Tech': 'CÔNG NGHỆ',
    'Product': 'SẢN PHẨM',
    'Business': 'KINH DOANH',
    'News': 'TIN CÔNG TY',
    'Company News': 'TIN CÔNG TY',
    'Education': 'GIÁO DỤC',
    'Learning': 'KINH DOANH',
  }

  const getDisplayLabel = (categoryName: string): string => {
    return categoryLabels[categoryName] || categoryName.toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%', marginBottom: 12 }}>
      <button
        onClick={() => onCategoryChange(null)}
        style={{
          padding: '6px 14px',
          borderRadius: '0.375rem',
          fontSize: '13px',
          fontWeight: '500',
          transition: 'all 0.2s',
          border: '1px solid',
          backgroundColor: selectedCategoryId === null || selectedCategoryId === undefined ? '#1e40af' : 'white',
          color: selectedCategoryId === null || selectedCategoryId === undefined ? 'white' : '#6b7280',
          borderColor: selectedCategoryId === null || selectedCategoryId === undefined ? '#1e40af' : '#e5e7eb',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
            e.currentTarget.style.borderColor = '#1e40af'
            e.currentTarget.style.color = '#1e40af'
          }
        }}
        onMouseLeave={(e) => {
          if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.color = '#6b7280'
          }
        }}
      >
        TẤT CẢ
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          style={{
            padding: '6px 14px',
            borderRadius: '0.375rem',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s',
            border: '1px solid',
            backgroundColor: selectedCategoryId === category.id ? '#1e40af' : 'white',
            color: selectedCategoryId === category.id ? 'white' : '#6b7280',
            borderColor: selectedCategoryId === category.id ? '#1e40af' : '#e5e7eb',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (selectedCategoryId !== category.id) {
              e.currentTarget.style.borderColor = '#1e40af'
              e.currentTarget.style.color = '#1e40af'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategoryId !== category.id) {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.color = '#6b7280'
            }
          }}
        >
          {getDisplayLabel(category.name)}
        </button>
      ))}
    </div>
  )
}
