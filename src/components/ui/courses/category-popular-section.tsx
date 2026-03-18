'use client'

import React, { useState, useEffect } from 'react'
import { Spin, Empty } from 'antd'
import type { Course } from '@/service/course.service'

interface CategoryPopularSectionProps {
  courses: Course[]
  isLoading?: boolean
}

export const CategoryPopularSection: React.FC<CategoryPopularSectionProps> = ({
  courses,
  isLoading = false,
}) => {
  const [categoryGroups, setCategoryGroups] = useState<Map<string, Course[]>>(new Map())

  useEffect(() => {
    // GROUP COURSES BY CATEGORY
    // NOTE: In production, fetch from backend endpoint:
    // GET /api/courses/popular?groupBy=category&limit=3
    // This should return courses grouped by category like:
    // {
    //   "Business": [course1, course2, course3],
    //   "Data": [course4, course5, course6],
    //   "Tech": [course7, course8, course9],
    //   ...
    // }

    const groups = new Map<string, Course[]>()
    const categoryMap: Record<number | string, Course[]> = {}

    // Simulate grouping (in real app, backend does this)
    courses.forEach((course) => {
      const category = course.category_id || 'Khác'
      if (!categoryMap[category]) {
        categoryMap[category] = []
      }
      if (categoryMap[category].length < 3) {
        categoryMap[category].push(course)
      }
    })

    // Convert to Map and take first 3 categories
    const topCategories = Object.entries(categoryMap).slice(0, 3)
    topCategories.forEach(([cat, coursesInCat]) => {
      groups.set(String(cat), coursesInCat)
    })

    setCategoryGroups(groups)
  }, [courses])

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (categoryGroups.size === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Empty description="Không có khóa học nào" />
      </div>
    )
  }

  return (
    <section style={{ marginBottom: '80px' }}>
      {/* Section Header */}
      <h2
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#3366CC',
          margin: '0 0 32px 0',
        }}
      >
        Phổ biến nhất theo danh mục
      </h2>

      {/* Category Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
        }}
      >
        {Array.from(categoryGroups.entries()).map(([category, categoryCourses]) => (
          <div
            key={category}
            style={{
              backgroundColor: '#dbeafe',
              borderRadius: '12px',
              padding: '24px',
              transition: 'all 0.3s ease',
            }}
            className="hover:shadow-lg hover:-translate-y-1"
          >
            {/* Category Title */}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#1e40af',
                margin: '0 0 20px 0',
              }}
            >
              Phổ biến trong {category} →
            </h3>

            {/* Courses in Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categoryCourses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  className="hover:shadow-md hover:bg-gray-50"
                >
                  {/* Course Thumbnail */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    <img
                      src={course.thumbnail_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=80&h=80&fit=crop'}
                      alt={course.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=80&h=80&fit=crop'
                      }}
                    />
                  </div>

                  {/* Course Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Provider */}
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Khóa học
                    </p>

                    {/* Title */}
                    <h4
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {course.title}
                    </h4>

                    {/* Type & Rating */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: '#6b7280',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        Khóa học
                      </span>
                      {course.duration_hours && (
                        <>
                          <span>•</span>
                          <span>{course.duration_hours}h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>


    </section>
  )
}
