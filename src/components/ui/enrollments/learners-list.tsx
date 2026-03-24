"use client"

import React from "react"
import { Avatar, Button, Progress, Table, Tag } from "antd"
import { EyeOutlined, CheckCircleOutlined, UserOutlined } from "@ant-design/icons"
import { useRouter } from "next/navigation"
import type { ColumnsType } from "antd/es/table"
import type { LearnerEnrollment } from "./enrollment-types"

const PRIMARY_BLUE = "#1677ff"

interface LearnersListProps {
  learners: LearnerEnrollment[]
  courseId: string
}

function getStatusTag(status: LearnerEnrollment["status"]) {
  if (status === "Completed") {
    return (
      <Tag color="blue" className="rounded-full px-3 border-0">
        <CheckCircleOutlined className="mr-1" />
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

export default function LearnersList({ learners, courseId }: LearnersListProps) {
  const router = useRouter()

  const columns: ColumnsType<LearnerEnrollment> = [
    {
      title: "Learner",
      dataIndex: "name",
      key: "name",
      render: (_: string, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.avatar || undefined}
            size={40}
            icon={!record.avatar ? <UserOutlined /> : undefined}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{record.name}</span>
            <span className="text-xs text-gray-400">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      className: "text-gray-600",
    },
    {
      title: "Enrollment Date",
      dataIndex: "enrollmentDate",
      key: "enrollmentDate",
      className: "text-gray-500",
      render: (value: string) => new Date(value).toLocaleDateString("en-GB"),
    },
    {
      title: "Overall Progress",
      dataIndex: "progress",
      key: "progress",
      width: 240,
      render: (percent: number) => {
        let strokeColor = PRIMARY_BLUE
        if (percent < 30 && percent > 0) strokeColor = "#f97316"
        if (percent === 0) strokeColor = "#e5e7eb"

        return (
          <div className="w-full">
            <span
              className={`text-xs font-bold ${percent < 30 ? "text-orange-500" : "text-[#1677ff]"}`}
              style={percent >= 30 ? { color: PRIMARY_BLUE } : {}}
            >
              {percent}%
            </span>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={strokeColor}
              trailColor="#f3f4f6"
              size="small"
            />
          </div>
        )
      },
    },
    {
      title: "Course Status",
      dataIndex: "status",
      key: "status",
      render: (status: LearnerEnrollment["status"]) => getStatusTag(status),
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record) => (
        <Button
          type="text"
          shape="circle"
          icon={<EyeOutlined />}
          className="text-gray-400 hover:bg-blue-50"
          onMouseEnter={(event) => {
            event.currentTarget.style.color = PRIMARY_BLUE
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = ""
          }}
          onClick={() => {
            router.push(`/courses/management/${courseId}/enrollments/${record.id}`)
          }}
        />
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={learners}
      pagination={false}
      className="ant-table-custom"
    />
  )
}
