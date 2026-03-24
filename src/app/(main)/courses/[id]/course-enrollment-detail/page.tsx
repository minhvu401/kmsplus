// @/src/app/(main)/courses/[id]/course-enrollment-detail/page.tsx
// Course Enrollments Page (TRANG CHI TIẾT HIỆU SUẤT HỌC CỦA KHOÁ HỌC)

"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Table,
  Input,
  Button,
  Tag,
  Progress,
  Avatar,
  Card,
  Breadcrumb,
  Row,
  Col,
  Statistic,
} from "antd"
import {
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  HomeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StarFilled,
  ArrowUpOutlined,
} from "@ant-design/icons"

// --- CONSTANTS ---
const PRIMARY_BLUE = "#1677ff" // ✅ Mã màu yêu cầu

// --- MOCK DATA ---
const DATA_SOURCE = [
  {
    key: "1",
    id: "u1",
    name: "Sarah Jenkins",
    email: "sarah.j@company.com",
    avatar: "https://i.pravatar.cc/150?u=1",
    enrollmentDate: "Oct 24, 2023",
    progress: 92,
    status: "In Progress",
  },
  {
    key: "2",
    id: "u2",
    name: "Michael Chen",
    email: "m.chen@design.co",
    avatar: "https://i.pravatar.cc/150?u=2",
    enrollmentDate: "Oct 22, 2023",
    progress: 100,
    status: "Completed",
  },
  {
    key: "3",
    id: "u3",
    name: "James D.",
    email: "james.dev@tech.io",
    avatar: "https://i.pravatar.cc/150?u=3",
    enrollmentDate: "Nov 01, 2023",
    progress: 24,
    status: "In Progress",
  },
  {
    key: "4",
    id: "u4",
    name: "Emily Watson",
    email: "emily.w@studio.com",
    avatar: "https://i.pravatar.cc/150?u=4",
    enrollmentDate: "Oct 15, 2023",
    progress: 0,
    status: "Not Started",
  },
  {
    key: "5",
    id: "u5",
    name: "Robert K.",
    email: "rob.k@logistics.net",
    avatar: "https://i.pravatar.cc/150?u=5",
    enrollmentDate: "Oct 29, 2023",
    progress: 78,
    status: "In Progress",
  },
]

export default function CourseEnrollmentsPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string

  // --- Cấu hình cột cho bảng ---
  const columns = [
    {
      title: "LEARNER NAME",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} size={40} />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{text}</span>
            <span className="text-xs text-gray-400">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: "ENROLLMENT DATE",
      dataIndex: "enrollmentDate",
      key: "enrollmentDate",
      className: "text-gray-500",
    },
    {
      title: "OVERALL PROGRESS",
      dataIndex: "progress",
      key: "progress",
      width: 250,
      render: (percent: number) => {
        /* ✅ 1. Đổi strokeColor sang PRIMARY_BLUE */
        let strokeColor = PRIMARY_BLUE
        if (percent < 30 && percent > 0) strokeColor = "#f97316" // Orange
        if (percent === 0) strokeColor = "#e5e7eb" // Gray

        return (
          <div className="w-full">
            <span
              /* ✅ 2. Đổi text color sang mã hex cụ thể */
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
      title: "COURSE STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let icon = null

        if (status === "In Progress") {
          icon = (
            /* ✅ 3. Đổi chấm tròn sang PRIMARY_BLUE */
            <span
              className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
              style={{ backgroundColor: PRIMARY_BLUE }}
            ></span>
          )
        } else if (status === "Completed") {
          icon = <CheckCircleOutlined className="mr-1" />
        } else if (status === "Not Started") {
          icon = (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5 inline-block"></span>
          )
        }

        // Custom styling tag đồng bộ xanh dương
        const customStyle =
          status === "In Progress"
            ? {
                backgroundColor: "#eff6ff", // blue-50 (giữ nền nhạt cho đẹp)
                color: PRIMARY_BLUE, // ✅ Text màu chuẩn
                border: "1px solid #dbeafe", // blue-100
                borderRadius: "20px",
                padding: "0 12px",
              }
            : status === "Completed"
              ? {
                  backgroundColor: "#eff6ff",
                  color: PRIMARY_BLUE, // ✅ Text màu chuẩn
                  border: "1px solid #bfdbfe",
                  borderRadius: "20px",
                  padding: "0 12px",
                }
              : { borderRadius: "20px", padding: "0 12px" }

        return (
          <Tag
            style={customStyle}
            className="flex items-center w-fit border-0 py-1 font-medium"
          >
            {icon} {status}
          </Tag>
        )
      },
    },
    {
      title: "ACTION",
      key: "action",
      render: (_: any, record: any) => (
        <Button
          type="text"
          shape="circle"
          icon={<EyeOutlined />}
          /* ✅ 4. Hover text màu chuẩn */
          className="text-gray-400 hover:bg-blue-50"
          style={{ color: undefined }} // Reset inline style if any
          onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_BLUE)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
          onClick={() => {
            router.push(
              `/courses/${courseId}/course-enrollment-detail/${record.id}`
            )
          }}
        />
      ),
    },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 font-sans">
      {/* 1. Breadcrumb */}
      <Breadcrumb
        className="text-gray-500"
        items={[
          { title: <HomeOutlined />, href: "/dashboard-metrics" },
          { title: "Courses", href: "/courses/management" },
          {
            title: "Introduction to Python",
            href: `/courses/${courseId}/enrollments`,
          },
          {
            title: (
              <span className="font-semibold text-gray-800">Enrollments</span>
            ),
          },
        ]}
      />

      {/* 2. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 m-0">
            Introduction to Python
          </h1>
          <p className="text-gray-500 mt-1">
            Manage course enrollments and track learner progress.
          </p>
        </div>
        <Button
          type="primary"
          icon={<ExportOutlined />}
          /* ✅ 5. Background button màu chuẩn */
          style={{ backgroundColor: PRIMARY_BLUE }}
          className="border-none font-semibold h-10 px-6 rounded-lg shadow-sm hover:opacity-90"
        >
          Export Report
        </Button>
      </div>

      {/* 3. Statistics Cards */}
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full">
            <Statistic
              title={
                <span className="text-gray-500 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                  <UserOutlined /> Total Enrolled
                </span>
              }
              value={1245}
              valueStyle={{ fontWeight: 700, fontSize: "2rem" }}
              suffix={
                /* ✅ 6. Text growth màu chuẩn */
                <span
                  className="text-sm font-semibold ml-2 flex items-center"
                  style={{ color: PRIMARY_BLUE }}
                >
                  <ArrowUpOutlined className="text-xs mr-1" /> +12% from last
                  month
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full">
            <Statistic
              title={
                <span className="text-gray-500 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                  <CheckCircleOutlined /> Avg. Completion
                </span>
              }
              value={68}
              suffix="%"
              valueStyle={{ fontWeight: 700, fontSize: "2rem" }}
            />
            <div className="text-xs text-gray-400 mt-1">Course average</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full">
            <Statistic
              title={
                <span className="text-gray-500 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                  {/* ✅ 7. Ngôi sao màu chuẩn */}
                  <StarFilled style={{ color: PRIMARY_BLUE }} /> Course Rating
                </span>
              }
              value={4.8}
              valueStyle={{ fontWeight: 700, fontSize: "2rem" }}
            />
            <div className="text-xs text-gray-400 mt-1">
              Based on 850 reviews
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. Filter & Table Section */}
      <Card bordered={false} className="shadow-sm rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search by learner name or email..."
            className="w-full md:w-96 rounded-lg bg-gray-50 hover:bg-white focus:bg-white border-gray-200"
            size="large"
          />
          <div className="flex gap-3">
            <Button
              icon={<FilterOutlined />}
              size="large"
              className="rounded-lg text-gray-600 font-medium"
            >
              Filter
            </Button>
            <Button
              icon={<SortAscendingOutlined />}
              size="large"
              className="rounded-lg text-gray-600 font-medium"
            >
              Sort
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={DATA_SOURCE}
          pagination={{
            pageSize: 5,
            showTotal: (total, range) =>
              `Showing ${range[0]} to ${range[1]} of ${total} results`,
            className: "px-4 pb-2",
          }}
          className="ant-table-custom"
        />
      </Card>
    </div>
  )
}
