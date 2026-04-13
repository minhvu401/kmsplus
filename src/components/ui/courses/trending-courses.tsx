"use client"

import React from "react"
import { Empty, Spin } from "antd"
import { FireOutlined } from "@ant-design/icons"
import { CourseCard } from "./course-card"
import type { Course } from "@/service/course.service"

interface TrendingCoursesProps {
  courses: Course[]
  isLoading?: boolean
  onViewAll?: () => void
}

export const TrendingCourses: React.FC<TrendingCoursesProps> = ({
  courses,
  isLoading = false,
  onViewAll,
}) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Spin size="large" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Empty description="Không có khóa học phổ biến nào" />
      </div>
    )
  }

  return (
    <section style={{ marginBottom: "80px" }}>
      {/* Section Header with Trending Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#3366CC",
              margin: 0,
            }}
          >
            Đang thịnh hành
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "4px 0 0 0",
            }}
          >
            Những khóa học được nhiều người đăng ký trong 7 ngày qua
          </p>
        </div>
      </div>

      {/* Trending Courses Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {courses.map((course) => (
          <div
            key={course.id}
            style={{
              position: "relative",
            }}
          >
            {/* Trending Badge */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "0",
                backgroundColor: "#fa7501",
                color: "#ffffff",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FireOutlined style={{ fontSize: "10px" }} />
              Trending
            </div>
            <CourseCard
              course={course}
              enrollmentStatus="not-enrolled"
              progress={0}
              skillTags={[]}
              description={course.description || ""}
              rating={course.average_rating || 0}
              students={course.rating_count ?? 0}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
