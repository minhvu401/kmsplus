"use client"

import React from "react"
import { Empty, Spin } from "antd"
import { TeamOutlined } from "@ant-design/icons"
import { CourseCard } from "./course-card"
import type { Course } from "@/service/course.service"

interface RelevantCoursesProps {
  courses: Course[]
  departmentName?: string
  isLoading?: boolean
  enrollmentMap?: Map<
    number,
    { status: "not-enrolled" | "in-progress" | "completed"; progress: number }
  >
  dueDateMap?: Map<number, string>
}

export const RelevantCoursesSection: React.FC<RelevantCoursesProps> = ({
  courses,
  departmentName = "Phòng ban của bạn",
  isLoading = false,
  enrollmentMap = new Map(),
  dueDateMap = new Map(),
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
        <Empty
          description={`Không có khóa học liên quan cho ${departmentName}`}
        />
      </div>
    )
  }

  return (
    <section style={{ marginBottom: "80px" }}>
      {/* Section Header with Department Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "#dbeafe",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TeamOutlined
            style={{
              fontSize: "20px",
              color: "#3366cc",
            }}
          />
        </div>
        <div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#3366CC",
              margin: 0,
            }}
          >
            Phù hợp cho bạn
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "4px 0 0 0",
            }}
          >
            Những khóa học được cá nhân hóa dựa trên vị trí và kỹ năng của bạn
            trong {departmentName}
          </p>
        </div>
      </div>

      {/* Relevant Courses Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            enrollmentStatus={
              enrollmentMap.get(course.id)?.status || "not-enrolled"
            }
            progress={enrollmentMap.get(course.id)?.progress || 0}
            dueDate={dueDateMap.get(course.id)}
            skillTags={[]}
            description={course.description || ""}
            rating={course.average_rating || 0}
            students={course.rating_count || course.enrollment_count}
          />
        ))}
      </div>
    </section>
  )
}
