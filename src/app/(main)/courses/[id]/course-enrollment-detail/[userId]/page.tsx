// @/src/app/(main)/courses/[id]/course-enrollment-detail/[userId]/page.tsx
// Learner Detail Page ( TRANG CHI TIẾT HIỆU SUẤT HỌC CỦA NGƯỜI HỌC)
// Shows detailed progress for a specific learner in a course
// Route: /courses/[id]/course-enrollment-detail/[userId]

"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Button,
  Card,
  Avatar,
  Tag,
  Progress,
  Breadcrumb,
  Row,
  Col,
  List,
  Divider,
  Typography,
} from "antd"
import {
  ArrowLeftOutlined,
  MailOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  QuestionCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  HomeOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { LEARNER_DETAIL } from "@/data/mockEnrollmentData"

export default function LearnerProgressPage() {
  const router = useRouter()
  const params = useParams() as { id: string; userId: string }
  // params.id = courseId
  // params.userId = userId

  const data = LEARNER_DETAIL

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Navigation / Breadcrumb */}
      <div className="flex justify-between items-center">
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/dashboard" },
            { title: "Enrollments", href: `/courses/${params.id}/enrollments` },
            { title: data.name },
          ]}
        />
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back to List
        </Button>
      </div>

      {/* User Profile Card */}
      <Card bordered={false} className="shadow-sm rounded-xl">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <Avatar src={data.avatar} size={80} icon={<UserOutlined />} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold m-0">{data.name}</h1>
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <span className="font-medium">{data.role}</span> •{" "}
              <MailOutlined /> {data.email}
            </div>
            <div className="flex gap-6 mt-4">
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Enrolled Date
                </div>
                <div className="font-semibold">{data.enrollmentDate}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Time Spent
                </div>
                <div className="font-semibold">{data.timeSpent}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Avg Quiz Score
                </div>
                <div className="font-semibold text-green-600">
                  {data.avgQuizScore}%
                </div>
              </div>
            </div>
          </div>

          {/* Overall Progress Circle */}
          <div className="flex items-center gap-4 border-l pl-6">
            <div className="text-right">
              <div className="text-gray-500 text-xs">Overall Progress</div>
              <div className="text-xl font-bold">{data.overallProgress}%</div>
            </div>
            <Progress
              type="circle"
              percent={data.overallProgress}
              width={60}
              strokeColor="#22c55e"
              showInfo={false}
            />
          </div>
        </div>
      </Card>

      {/* Syllabus & Results */}
      <Card
        title="Course Syllabus & Results"
        bordered={false}
        className="shadow-sm rounded-xl"
      >
        <div className="space-y-6">
          {data.modules.map((module, mIndex) => (
            <div key={mIndex}>
              <div className="bg-gray-50 px-4 py-2 rounded-md font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">
                {module.title}
              </div>
              <div className="divide-y">
                {module.items.map((item, iIndex) => (
                  <div
                    key={iIndex}
                    className="py-4 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded transition-colors"
                  >
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="p-2 bg-gray-100 rounded text-gray-500">
                        {item.type === "video" && <VideoCameraOutlined />}
                        {item.type === "text" && <FileTextOutlined />}
                        {item.type === "quiz" && (
                          <QuestionCircleOutlined className="text-blue-500" />
                        )}
                      </div>
                      <span className="font-medium text-gray-700">
                        {item.title}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-1/6">
                      {item.status === "Completed" && (
                        <Tag color="success" className="rounded-full">
                          Completed
                        </Tag>
                      )}
                      {item.status === "In Progress" && (
                        <Tag color="warning" className="rounded-full">
                          In Progress
                        </Tag>
                      )}
                      {item.status === "Not Started" && (
                        <Tag className="rounded-full">Not Started</Tag>
                      )}
                      {item.status === "Passed" && (
                        <Tag color="green" className="rounded-full">
                          Submitted
                        </Tag>
                      )}
                      {item.status === "Failed" && (
                        <Tag color="volcano" className="rounded-full">
                          Submitted
                        </Tag>
                      )}
                    </div>

                    {/* Score/Result */}
                    <div className="w-1/6 text-center">
                      {item.type === "quiz" ? (
                        item.status === "Passed" ? (
                          <span className="font-bold text-green-600 flex items-center gap-1 justify-center">
                            <CheckCircleFilled /> {item.score}/100
                          </span>
                        ) : item.status === "Failed" ? (
                          <span className="font-bold text-red-500 flex items-center gap-1 justify-center">
                            <CloseCircleFilled /> {item.score}/100
                          </span>
                        ) : (
                          <span>--</span>
                        )
                      ) : (
                        <span>-</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="w-1/6 text-right text-gray-500 text-sm">
                      {item.date || "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
