'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Tag, Button, Tooltip } from 'antd'
import { PlayCircleOutlined, ClockCircleOutlined, TrophyOutlined, StarFilled, ArrowRightOutlined } from '@ant-design/icons'
import type { Course } from '@/service/course.service'

interface CourseCardProps {
  course: Course
  instructor?: {
    name: string
    avatar?: string
  }
  enrollmentStatus?: 'not-enrolled' | 'in-progress' | 'completed'
  progress?: number
  dueDate?: string // ISO date format or null
  skillTags?: string[]
  rating?: number // e.g., 4.8
  students?: number // enrollment count
  description?: string // short description
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  instructor,
  enrollmentStatus = 'not-enrolled',
  progress = 0,
  dueDate,
  skillTags = [],
  rating = 4.8,
  students = 0,
  description,
}) => {
  const router = useRouter()
  
  // Get today's date in Vietnamese format
  const today = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
  const formattedDate = today.toLocaleDateString('vi-VN', dateOptions)

  // Format due date
  const formatDueDate = (dateStr?: string | null): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return ''
    }
  }

  // Calculate days remaining
  const getDaysRemaining = (dateStr?: string | null): number | null => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      const diff = date.getTime() - today.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return days
    } catch {
      return null
    }
  }

  // Ensure progress is between 0-100
  const normalizedProgress = Math.min(Math.max(progress || 0, 0), 100)

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/courses/${course.id}`)
  }

  const getDifficultyColor = (duration?: number | null): string => {
    if (!duration) return 'default'
    if (duration <= 2) return 'blue'
    if (duration <= 5) return 'orange'
    return 'red'
  }

  const getDifficultyLabel = (duration?: number | null): string => {
    if (!duration) return 'Beginner'
    if (duration <= 2) return 'Beginner'
    if (duration <= 5) return 'Intermediate'
    return 'Advanced'
  }

  const formatDuration = (hours?: number | null): string => {
    if (!hours) return '0h'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours === Math.floor(hours)) return `${hours}h`
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  const difficultyColor = getDifficultyColor(course.duration_hours)
  const difficultyLabel = getDifficultyLabel(course.duration_hours)
  const isResuming = enrollmentStatus === 'in-progress'

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="hover:shadow-xl hover:-translate-y-2"
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      {/* Image Container with Floating Badges */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          overflow: 'hidden',
          backgroundColor: '#f3f4f6',
        }}
      >
        {/* Course Thumbnail */}
        <img
          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'}
          alt={course.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease-in-out',
          }}
          className="hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
          }}
        />

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Progress Bar (if in progress) */}
        {isResuming && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '6px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              zIndex: 5,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${normalizedProgress}%`,
                backgroundColor: '#10b981',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}

        {/* Floating Badges (Top-right) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
            zIndex: 10,
          }}
        >
          {/* Duration Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}
          >
            <ClockCircleOutlined style={{ fontSize: '11px' }} />
            {formatDuration(course.duration_hours)}
          </div>

          {/* Difficulty Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}
          >
            <TrophyOutlined style={{ fontSize: '11px' }} />
            {difficultyLabel}
          </div>

          {/* Resume Badge */}
          {isResuming && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#3366cc',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <PlayCircleOutlined style={{ fontSize: '14px' }} />
              Tiếp tục
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div style={{ padding: '12px' }}>
        {/* Progress & Due Date Info (if in progress) */}
        {isResuming && (
          <div
            style={{
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            {/* Progress Bar with Percentage */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                  Tiến độ
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#10b981',
                  }}
                >
                  {normalizedProgress}%
                </span>
              </div>
              {/* Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${normalizedProgress}%`,
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Due Date */}
            {dueDate && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <span style={{ fontWeight: 600 }}>Hạn:</span>{' '}
                <span style={{ fontWeight: 500 }}>
                  {formatDueDate(dueDate)}
                </span>
                {getDaysRemaining(dueDate) !== null && (
                  <span
                    style={{
                      marginLeft: '6px',
                      color: getDaysRemaining(dueDate)! <= 3 ? '#ef4444' : '#6b7280',
                      fontWeight: 500,
                    }}
                  >
                    ({getDaysRemaining(dueDate)} ngày)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {/* Course Title with Tooltip */}
        <Tooltip title={course.title} placement="top">
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#3366CC',
              margin: '0 0 6px 0',
              lineHeight: '1.3',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              transition: 'color 0.2s',
              minHeight: '2.6em',
            }}
            className="hover:text-blue-900"
          >
            {course.title}
          </h3>
        </Tooltip>

        {/* Course Description */}
        {description && (
          <p
            style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '0 0 8px 0',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        )}

        {/* Skill Tags */}
        {skillTags.length > 0 && (
          <div style={{ marginBottom: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {skillTags.slice(0, 2).map((tag, idx) => (
              <Tag
                key={idx}
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                {tag}
              </Tag>
            ))}
            {skillTags.length > 2 && (
              <Tag
                style={{
                  backgroundColor: '#e5e7eb',
                  color: '#6b7280',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                +{skillTags.length - 2}
              </Tag>
            )}
          </div>
        )}

        {/* Instructor Info */}
        {instructor && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <Avatar
              size={32}
              style={{
                backgroundColor: '#3366cc',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {instructor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Avatar>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                {instructor.name}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Instructor</p>
            </div>
          </div>
        )}

        {/* Enrollment Count */}
        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>
          {course.enrollment_count} {course.enrollment_count === 1 ? 'người' : 'người'} đã đăng ký
        </div>

        {/* Rating and Students */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          {/* Rating Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <div style={{ display: 'flex', gap: '1px' }}>
              {[...Array(5)].map((_, i) => (
                <StarFilled
                  key={i}
                  style={{
                    fontSize: '12px',
                    color: i < Math.floor(rating) ? '#fbbf24' : '#e5e7eb',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
              {rating.toFixed(1)}
            </span>
          </div>

          {/* Students Count */}
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            ({students})
          </span>
        </div>

        {/* Action Button */}
        <Button
          type="primary"
          onClick={handleEnroll}
          style={{
            width: '100%',
            backgroundColor: '#3366cc',
            borderColor: '#3366cc',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            height: '36px',
            borderRadius: '6px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(51, 102, 204, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          className="hover:!bg-blue-700 hover:!border-blue-700 hover:!shadow-lg"
          icon={<ArrowRightOutlined style={{ fontSize: '12px' }} />}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  )
}
