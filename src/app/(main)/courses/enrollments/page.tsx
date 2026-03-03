// @/src/app/(main)/courses/enrollments/page.tsx
// Enrollments Overview Page

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  Input,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Progress,
  List,
  Avatar,
  Breadcrumb,
  Typography,
} from "antd"
import {
  SearchOutlined,
  ExportOutlined,
  MoreOutlined,
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  HomeOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography

// --- MÃ MÀU CHUẨN ---
const PRIMARY_BLUE = "#1677ff"

// --- MOCK DATA ---
const COURSE_STATS = {
  id: "CS-2024-001",
  name: "Advanced Cybersecurity Compliance 2024",
  totalEnrollments: 1245,
  growth: 12,
  avgProgress: 68,
  completionRate: 82,
  completionGrowth: 5,
}

const CHART_DATA = [
  { name: "Engineering", value: 45, color: PRIMARY_BLUE }, // ✅ Đã cập nhật
  { name: "Sales", value: 30, color: "#4096ff" }, // Blue 5 (Ant Design)
  { name: "Marketing", value: 15, color: "#69b1ff" }, // Blue 4 (Ant Design)
  { name: "Others", value: 10, color: "#e5e7eb" },
]

const ACTIVITY_DATA = [
  {
    user: "Alex Morgan",
    role: "Engineering Dept",
    action: "enrolled in the course",
    time: "2 hours ago",
    status: "New",
    avatar: "https://i.pravatar.cc/150?u=1",
  },
  {
    user: "Sarah Chen",
    role: "Product Design",
    action: "completed the final assessment",
    time: "5 hours ago",
    status: "Completed",
    avatar: "https://i.pravatar.cc/150?u=2",
  },
  {
    user: "John Doe",
    role: "Sales",
    action: "reached 50% progress",
    time: "1 day ago",
    status: null,
    avatar: "https://i.pravatar.cc/150?u=3",
  },
]

export default function EnrollmentOverviewPage() {
  const router = useRouter()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const handleViewData = () => {
    if (selectedCourseId) {
      router.push(`/courses/${selectedCourseId}/course-enrollment-detail`)
    } else {
      router.push(`/courses/5/course-enrollment-detail`)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="flex justify-between items-start">
        <div>
          <Breadcrumb
            className="mb-2"
            items={[
              { title: <HomeOutlined />, href: "/dashboard" },
              {
                title: (
                  /* ✅ Đã cập nhật màu text */
                  <span style={{ color: PRIMARY_BLUE }} className="font-medium">
                    Enrollment & Progress
                  </span>
                ),
              },
            ]}
          />
          <Title level={2} className="!mb-2 !mt-0">
            Enrollment & Progress
          </Title>
          <Text type="secondary">
            Analyze course performance, track learner progress, and manage
            enrollments efficiently.
            <br />
            Select a course below to get started.
          </Text>
        </div>
        <Button icon={<ExportOutlined />}>Export Report</Button>
      </div>

      {/* 2. Filter Section */}
      <Card bordered={false} className="shadow-sm rounded-xl">
        <Row gutter={16} align="bottom">
          <Col xs={24} md={8}>
            <div className="mb-2 font-semibold">Select Course</div>
            <Select
              placeholder="Choose a published course..."
              className="w-full"
              size="large"
              onChange={(val) => setSelectedCourseId(val)}
              options={[
                { value: "5", label: "Advanced Cybersecurity Compliance 2024" },
                { value: "10", label: "UX Design Masterclass" },
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="mb-2 font-semibold">Search Filter</div>
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search course by name, ID or instructor..."
              size="large"
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              type="primary"
              size="large"
              className="w-full border-none font-semibold"
              /* ✅ Đã cập nhật màu nền nút */
              style={{ backgroundColor: PRIMARY_BLUE }}
              onClick={handleViewData}
            >
              View Data
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 3. Detailed Course Stats Card */}
      <Card bordered={false} className="shadow-sm rounded-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag
                /* Đã cập nhật màu Tag */
                color="blue"
                className="rounded-full px-2 border-none bg-blue-50"
                style={{ color: PRIMARY_BLUE }}
              >
                Published
              </Tag>
              <Text type="secondary" className="text-xs">
                ID: {COURSE_STATS.id}
              </Text>
            </div>
            <Title level={4} className="!m-0">
              {COURSE_STATS.name}
            </Title>
          </div>
          <div className="flex gap-2">
            <Button type="text" icon={<EditOutlined />} />
            <Button type="text" icon={<MoreOutlined />} />
          </div>
        </div>

        <Row gutter={24} className="divide-x divide-gray-100">
          {/* Total Enrollments */}
          <Col span={8}>
            <Text type="secondary">Total Enrollments</Text>
            <div className="flex justify-between items-start mt-2">
              <div>
                <div className="text-3xl font-bold">
                  {COURSE_STATS.totalEnrollments.toLocaleString()}
                </div>
                {/* ✅ Đã cập nhật màu text growth */}
                <div
                  className="text-xs font-semibold mt-1"
                  style={{ color: PRIMARY_BLUE }}
                >
                  <span className="mr-1">↗</span> +{COURSE_STATS.growth}%{" "}
                  <span className="text-gray-400 font-normal">
                    vs. last month
                  </span>
                </div>
              </div>
              {/* ✅ Đã cập nhật màu icon box */}
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "#e6f4ff", color: PRIMARY_BLUE }}
              >
                <UserOutlined />
              </div>
            </div>
          </Col>

          {/* Average Progress */}
          <Col span={8} className="pl-6">
            <Text type="secondary">Average Progress</Text>
            <div className="flex justify-between items-start mt-2">
              <div className="w-full pr-4">
                <div className="text-3xl font-bold mb-2">
                  {COURSE_STATS.avgProgress}%
                </div>
                <Progress
                  percent={COURSE_STATS.avgProgress}
                  showInfo={false}
                  /* ✅ Đã cập nhật màu thanh progress */
                  strokeColor={PRIMARY_BLUE}
                  trailColor="#f3f4f6"
                  size="small"
                />
                <div className="text-xs text-gray-400 mt-2">
                  Active learners are pacing well
                </div>
              </div>
              {/* ✅ Đã cập nhật màu icon box */}
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "#e6f4ff", color: PRIMARY_BLUE }}
              >
                <ClockCircleOutlined />
              </div>
            </div>
          </Col>

          {/* Completion Rate */}
          <Col span={8} className="pl-6">
            <Text type="secondary">Completion Rate</Text>
            <div className="flex justify-between items-start mt-2">
              <div>
                <div className="text-3xl font-bold">
                  {COURSE_STATS.completionRate}%
                </div>
                {/* ✅ Đã cập nhật màu text growth */}
                <div
                  className="text-xs font-semibold mt-1"
                  style={{ color: PRIMARY_BLUE }}
                >
                  <span className="mr-1">↗</span> +
                  {COURSE_STATS.completionGrowth}%{" "}
                  <span className="text-gray-400 font-normal">
                    Higher than industry avg (75%)
                  </span>
                </div>
              </div>
              {/* Màu tím giữ nguyên để phân biệt */}
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <CheckCircleFilled />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 4. Bottom Section: Charts & Activity */}
      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full">
            <div className="mb-4">
              <Title level={5} className="!mb-0">
                Enrollment by Department
              </Title>
              <Text type="secondary" className="text-xs">
                Distribution of active learners
              </Text>
            </div>

            <div className="h-64 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Total</div>
                  {/* ✅ Đã cập nhật màu số liệu trung tâm */}
                  <div
                    className="text-xl font-bold"
                    style={{ color: PRIMARY_BLUE }}
                  >
                    100%
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {CHART_DATA.slice(0, 3).map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  {/* ✅ Cập nhật màu số liệu */}
                  <span className="font-bold" style={{ color: PRIMARY_BLUE }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            className="shadow-sm rounded-xl h-full"
            title="Recent Enrollment Activity"
            extra={
              /* ✅ Đã cập nhật màu nút View All */
              <Button
                type="link"
                className="font-semibold"
                style={{ color: PRIMARY_BLUE }}
              >
                View All
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={ACTIVITY_DATA}
              renderItem={(item) => (
                <List.Item className="border-b-0 !py-4">
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} size="large" />}
                    title={
                      <span className="text-sm">
                        <span className="font-bold">{item.user}</span>{" "}
                        <span className="text-gray-600 font-normal">
                          {item.action}
                        </span>
                      </span>
                    }
                    description={
                      <div className="flex gap-2 text-xs text-gray-400 mt-1">
                        <span>{item.role}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    }
                  />
                  {item.status && (
                    <Tag
                      color={
                        item.status === "Completed" ? "blue" : "processing"
                      }
                      className="rounded-full px-3 border-none"
                      /* ✅ Nếu là completed thì dùng màu chuẩn */
                      style={
                        item.status === "Completed"
                          ? {
                              backgroundColor: "#e6f4ff",
                              color: PRIMARY_BLUE,
                            }
                          : {}
                      }
                    >
                      {item.status}
                    </Tag>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
