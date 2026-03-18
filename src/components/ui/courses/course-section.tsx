'use client'

import React from 'react'
import { Button, Empty, Spin } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { CourseCard } from './course-card'
import type { Course } from '@/service/course.service'

interface CourseInstructor {
  name: string
  avatar?: string
}

interface CourseSectionProps {
  title: string
  subtitle?: string
  courses: Course[]
  instructorMap?: Map<number, CourseInstructor>
  enrollmentMap?: Map<number, { status: 'not-enrolled' | 'in-progress' | 'completed'; progress: number }>
  dueDateMap?: Map<number, string> // ISO date format
  skillTagsMap?: Map<number, string[]>
  isLoading?: boolean
  onViewMore?: () => void
  enableViewMore?: boolean
  columns?: number
}

export const CourseSection: React.FC<CourseSectionProps> = ({
  title,
  subtitle,
  courses,
  instructorMap = new Map(),
  enrollmentMap = new Map(),
  dueDateMap = new Map(),
  skillTagsMap = new Map(),
  isLoading = false,
  onViewMore,
  enableViewMore = false,
  columns = 4,
}) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Empty
          description="Không có khóa học nào"
          style={{ marginTop: '40px' }}
        />
      </div>
    )
  }

  return (
    <section style={{ marginBottom: '80px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#3366CC',
              margin: '0 0 8px 0',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {enableViewMore && (
          <Button
            type="text"
            size="large"
            onClick={onViewMore}
            style={{
              color: '#3366cc',
              fontSize: '16px',
              fontWeight: 600,
              padding: 0,
              height: 'auto',
            }}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
          >
            Xem thêm
          </Button>
        )}
      </div>

      {/* Courses Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 4 ? 'repeat(4, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            instructor={instructorMap.get(course.creator_id)}
            enrollmentStatus={enrollmentMap.get(course.id)?.status || 'not-enrolled'}
            progress={enrollmentMap.get(course.id)?.progress || 0}
            dueDate={dueDateMap.get(course.id)}
            skillTags={skillTagsMap.get(course.id) || []}
            description={course.description || ''}
            rating={4.8}
            students={course.enrollment_count}
          />
        ))}
      </div>
    </section>
  )
}
