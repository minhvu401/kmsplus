// @/src/app/(main)/courses/enrollments/page.tsx
// Enrollments Overview Page
// MÀN HÌNH CHUNG có thẻ chọn quản lý khóa học, quản lý ghi danh
// Displays overview of all courses with enrollment statistics
// Route: /courses/enrollments

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
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const { Title, Text } = Typography

// --- MOCK DATA GIỐNG HÌNH ẢNH ---
const COURSE_STATS = {
  id: "CS-2024-001",
  name: "Advanced Cybersecurity Compliance 2024",
  totalEnrollments: 1245,
  growth: 12, // +12%
  avgProgress: 68,
  completionRate: 82,
  completionGrowth: 5, // +5%
}

const CHART_DATA = [
  { name: "Engineering", value: 45, color: "#22c55e" }, // Green
  { name: "Sales", value: 30, color: "#10b981" }, // Emerald
  { name: "Marketing", value: 15, color: "#059669" }, // Dark Green
  { name: "Others", value: 10, color: "#e5e7eb" }, // Grey
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
      // Điều hướng sang trang chi tiết danh sách (code cũ của bạn)
      router.push(`/courses/${selectedCourseId}/course-enrollment-detail`)
    } else {
      // Demo: Nếu chưa chọn thì mặc định nhảy vào khóa ID 5
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
                  <span className="text-green-600">Enrollment & Progress</span>
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
              className="w-full bg-green-500 hover:!bg-green-600 border-none font-semibold"
              onClick={handleViewData}
            >
              View Data
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 3. Detailed Course Stats Card (Static Demo for "Advanced Cybersecurity") */}
      <Card bordered={false} className="shadow-sm rounded-xl">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag
                color="success"
                className="rounded-full px-2 border-none bg-green-100 text-green-700"
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

        {/* Stats Grid */}
        <Row gutter={24} className="divide-x divide-gray-100">
          {/* Total Enrollments */}
          <Col span={8}>
            <Text type="secondary">Total Enrollments</Text>
            <div className="flex justify-between items-start mt-2">
              <div>
                <div className="text-3xl font-bold">
                  {COURSE_STATS.totalEnrollments.toLocaleString()}
                </div>
                <div className="text-green-500 text-xs font-semibold mt-1">
                  ↗ +{COURSE_STATS.growth}%{" "}
                  <span className="text-gray-400 font-normal">
                    vs. last month
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
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
                  strokeColor="#22c55e"
                  trailColor="#f3f4f6"
                  size="small"
                />
                <div className="text-xs text-gray-400 mt-2">
                  Active learners are pacing well
                </div>
              </div>
              <div className="p-2 bg-green-50 text-green-500 rounded-lg">
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
                <div className="text-green-500 text-xs font-semibold mt-1">
                  ↗ +{COURSE_STATS.completionGrowth}%{" "}
                  <span className="text-gray-400 font-normal">
                    Higher than industry avg (75%)
                  </span>
                </div>
              </div>
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <CheckCircleFilled />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 4. Bottom Section: Charts & Activity */}
      <Row gutter={24}>
        {/* Left: Enrollment by Department (Pie Chart) */}
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
              {/* Recharts Pie Chart */}
              {/* <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CHART_DATA}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {CHART_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer> */}

              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Total</div>
                  {/* <div className="text-xl font-bold">100%</div> */}
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
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right: Recent Activity */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            className="shadow-sm rounded-xl h-full"
            title="Recent Enrollment Activity"
            extra={
              <Button type="link" className="text-green-500 font-semibold">
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
                      color={item.status === "Completed" ? "success" : "blue"}
                      className="rounded-full px-3 border-none"
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
