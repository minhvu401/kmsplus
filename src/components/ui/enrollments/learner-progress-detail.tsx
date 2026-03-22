"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  HomeOutlined,
  MailOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import { Avatar, Breadcrumb, Button, Card, Progress, Tag } from "antd"
import type { LearnerEnrollmentDetail } from "./enrollment-types"

const PRIMARY_BLUE = "#1677ff"

interface LearnerProgressDetailProps {
  courseId: string
  detail: LearnerEnrollmentDetail
}

function getStatusTag(status: LearnerEnrollmentDetail["status"]) {
  if (status === "Completed") {
    return (
      <Tag color="blue" className="rounded-full px-3 border-0">
        Completed
      </Tag>
    )
  }

  if (status === "In Progress") {
    return (
      <Tag
        className="rounded-full px-3 border-0"
        style={{ backgroundColor: "#eff6ff", color: PRIMARY_BLUE }}
      >
        In Progress
      </Tag>
    )
  }

  return <Tag className="rounded-full px-3">Not Started</Tag>
}

function getCurriculumItemStatusTag(item: LearnerEnrollmentDetail["sections"][number]["items"][number]) {
  if (item.status === "Not Started") {
    return (
      <Tag
        className="rounded-full px-3 py-1 border-0 font-semibold"
        style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}
      >
        Not Started
      </Tag>
    )
  }

  if (item.type === "quiz") {
    if (item.status === "Failed") {
      return (
        <Tag
          className="rounded-full px-3 py-1 border-0 font-semibold"
          style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
        >
          Failed
        </Tag>
      )
    }

    return (
      <Tag
        className="rounded-full px-3 py-1 border-0 font-semibold"
        style={{ backgroundColor: "#dcfce7", color: "#166534" }}
      >
        Passed
      </Tag>
    )
  }

  return (
    <Tag
      className="rounded-full px-3 py-1 border-0 font-semibold"
      style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
    >
      Completed
    </Tag>
  )
}

export default function LearnerProgressDetail({
  courseId,
  detail,
}: LearnerProgressDetailProps) {
  const router = useRouter()

  const getItemIcon = (type: "video" | "text" | "quiz") => {
    if (type === "video") return <VideoCameraOutlined />
    if (type === "quiz") return <QuestionCircleOutlined className="text-blue-500" />
    return <FileTextOutlined />
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/dashboard-metrics" },
            { title: "Enrollments", href: `/courses/${courseId}/enrollments` },
            { title: detail.name },
          ]}
        />

        <Button
          onClick={() => router.back()}
          icon={<ArrowLeftOutlined />}
          className="rounded-lg"
        >
          Back to List
        </Button>
      </div>

      <Card variant="borderless" className="shadow-sm rounded-xl">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <Avatar
            src={detail.avatar || undefined}
            size={80}
            icon={!detail.avatar ? <UserOutlined /> : undefined}
          />

          <div className="flex-1 w-full">
            <h1 className="text-2xl font-bold m-0">{detail.name}</h1>

            <div className="flex items-center gap-2 text-gray-500 mb-3 flex-wrap">
              <span className="font-medium">{detail.department || "Unknown"}</span>
              <span>•</span>
              <MailOutlined />
              <span>{detail.email}</span>
            </div>

            <div className="flex gap-6 mt-4 flex-wrap">
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Enrolled Date
                </div>
                <div className="font-semibold">
                  {new Date(detail.enrollmentDate).toLocaleDateString("en-GB")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Course Status
                </div>
                <div className="mt-1">{getStatusTag(detail.status)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Course
                </div>
                <div className="font-semibold">{detail.courseName}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-l pl-6">
            <div className="text-right">
              <div className="text-gray-500 text-xs">Overall Progress</div>
              <div className="text-xl font-bold">{detail.progress}%</div>
            </div>
            <Progress
              type="circle"
              percent={detail.progress}
              size={60}
              strokeColor={PRIMARY_BLUE}
              showInfo={false}
            />
          </div>
        </div>
      </Card>

      <Card title="Enrollment Summary" variant="borderless" className="shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Completed Items</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {detail.completedItems}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Course Items</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{detail.totalItems}</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Completed At</div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {detail.completedAt
                ? new Date(detail.completedAt).toLocaleDateString("en-GB")
                : "Not completed yet"}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Course Syllabus & Results" variant="borderless" className="shadow-sm rounded-xl">
        <div className="space-y-6">
          {detail.sections.length === 0 ? (
            <div className="text-sm text-gray-500">No sections found for this course.</div>
          ) : (
            detail.sections.map((section) => (
              <div key={section.id}>
                <div className="bg-gray-50 px-4 py-2 rounded-md font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">
                  {section.title}
                </div>

                <div className="divide-y">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3 w-2/3">
                        <div className="p-2 bg-gray-100 rounded text-gray-500">
                          {getItemIcon(item.type)}
                        </div>

                        <div>
                          <div className="font-medium text-gray-700">{item.title}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            {item.type}
                          </div>
                          {item.type === "quiz" ? (
                            <div className="text-xs text-gray-500 mt-1">
                              Highest score: {item.highestQuizScore != null ? `${Math.round(item.highestQuizScore)}%` : "No attempts"}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="w-1/3 text-right">{getCurriculumItemStatusTag(item)}</div>
                    </div>
                  ))}

                  {section.items.length === 0 ? (
                    <div className="py-4 px-2 text-sm text-gray-500">No curriculum items in this section.</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
