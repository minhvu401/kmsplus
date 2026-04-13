'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Flex, Button, Tooltip } from 'antd'
import { ClearOutlined, UnorderedListOutlined, StarOutlined, SortAscendingOutlined } from '@ant-design/icons'

interface CourseCompactFiltersProps {
  categories?: Array<{ id: number; name: string }>
  onFiltersChange?: (filters: FilterValues) => void
}

export interface FilterValues {
  category: string
  rating: string
  sort: string
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'top-rated', label: 'Top Rated' },
]

const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '4plus', label: '4★ & up' },
  { value: '3plus', label: '3★ & up' },
  { value: '2plus', label: '2★ & up' },
]

export const CourseCompactFilters: React.FC<CourseCompactFiltersProps> = ({ 
  categories = [],
  onFiltersChange 
}) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [rating, setRating] = useState(searchParams.get('rating') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Check if any filter is active
  useEffect(() => {
    const active = category !== 'all' || rating !== 'all' || sort !== 'newest'
    setHasActiveFilters(active)
    
    if (onFiltersChange) {
      onFiltersChange({ category, rating, sort })
    }
  }, [category, rating, sort, onFiltersChange])

  const updateURL = (newCategory?: string, newRating?: string, newSort?: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')

    const finalCategory = newCategory !== undefined ? newCategory : category
    const finalRating = newRating !== undefined ? newRating : rating
    const finalSort = newSort !== undefined ? newSort : sort

    if (finalCategory === 'all') {
      params.delete('category')
    } else {
      params.set('category', finalCategory)
    }

    if (finalRating === 'all') {
      params.delete('rating')
    } else {
      params.set('rating', finalRating)
    }

    params.set('sort', finalSort)

    replace(`${pathname}?${params.toString()}`)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    updateURL(value, undefined, undefined)
  }

  const handleRatingChange = (value: string) => {
    setRating(value)
    updateURL(undefined, value, undefined)
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    updateURL(undefined, undefined, value)
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams()
    params.set('sort', 'newest')
    setCategory('all')
    setRating('all')
    setSort('newest')
    replace(`${pathname}?${params.toString()}`)
  }

  const selectStyle = {
    height: '36px',
    padding: '0 10px',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: '1 1 auto',
    minWidth: '180px',
  } as const

  return (
    <Flex
      wrap="wrap"
      align="center"
      gap={8}
      style={{ width: '100%' }}
    >
      {/* Category Filter - with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e5e7eb', borderRadius: '0.375rem', height: '36px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
          <UnorderedListOutlined style={{ fontSize: '14px', color: '#6b7280' }} />
        </div>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          style={{
            ...selectStyle,
            border: 'none',
            borderColor: 'transparent',
            borderRadius: '0',
            height: '36px',
            flex: '1 1 auto',
          } as React.CSSProperties}
          title="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rating Filter - with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e5e7eb', borderRadius: '0.375rem', height: '36px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
          <StarOutlined style={{ fontSize: '14px', color: '#6b7280' }} />
        </div>
        <select
          value={rating}
          onChange={(e) => handleRatingChange(e.target.value)}
          style={{
            ...selectStyle,
            border: 'none',
            borderColor: 'transparent',
            borderRadius: '0',
            height: '36px',
            flex: '1 1 auto',
          } as React.CSSProperties}
          title="Filter by rating"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort - with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e5e7eb', borderRadius: '0.375rem', height: '36px', overflow: 'hidden', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
          <SortAscendingOutlined style={{ fontSize: '14px', color: '#6b7280' }} />
        </div>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          style={{
            ...selectStyle,
            border: 'none',
            borderColor: 'transparent',
            borderRadius: '0',
            height: '36px',
            flex: '1 1 auto',
          } as React.CSSProperties}
          title="Sort results"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      <Tooltip title="Xóa tất cả filter">
        <Button
          type="text"
          size="small"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          style={{
            height: '36px',
            padding: '0 12px',
            color: hasActiveFilters ? '#ef4444' : '#d1d5db',
            opacity: hasActiveFilters ? 1 : 0.5,
            cursor: hasActiveFilters ? 'pointer' : 'not-allowed',
          }}
          icon={<ClearOutlined />}
          title="Clear filters"
        />
      </Tooltip>
    </Flex>
  )
}
