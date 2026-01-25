"use client"

import React, { useState } from "react"
import {
  Card,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import type { TableProps } from "antd"

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

// Định nghĩa kiểu dữ liệu cho bài viết
interface Article {
  key: React.Key
  id: string
  title: string
  answer: string
  tag: string
  status: string
  lastUpdated: string
}

// Mock data
const mockArticles: Article[] = Array(10)
  .fill(null)
  .map((_, idx) => ({
    key: idx,
    id: `QU00${idx + 1}`,
    title: "Tại sao Trái Đất hình tròn?",
    answer: "Nó có tròn đâu? Nó hình elipsoid.",
    tag: "Fun Fact",
    status: "Published",
    lastUpdated: "9/10/2025 14:00:00",
  }))

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("All Tags")
  const [currentPage, setCurrentPage] = useState(1)

  // Tổng số bài viết (lấy từ API trong thực tế)
  const totalArticles = 100

  // Định nghĩa các cột cho bảng
  const columns: TableProps<Article>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Article Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" ellipsis>
            {record.answer}
          </Text>
        </div>
      ),
    },
    {
      title: "Tag",
      dataIndex: "tag",
      key: "tag",
      width: 120,
      render: (tag) => <Tag color="blue">{tag}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => <Tag color="green">{status}</Tag>,
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      width: 180,
      render: (text) => <Text style={{ color: "orange" }}>{text}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Card
      className="animate-page-fade-in"
      title={
        <Title level={3} style={{ margin: 0 }}>
          Bài viết
        </Title>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          Create Article
        </Button>
      }
    >
      {/* Search and Filter Bar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Search
            placeholder="Search any ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={(value) => console.log(value)}
            enterButton
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            value={selectedTag}
            onChange={(value) => setSelectedTag(value)}
            style={{ width: "100%" }}
          >
            <Option value="All Tags">All Tags</Option>
            <Option value="Fun Fact">Fun Fact</Option>
            <Option value="Tutorial">Tutorial</Option>
            <Option value="News">News</Option>
          </Select>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={mockArticles}
        rowKey="key"
        pagination={{
          current: currentPage,
          pageSize: 10,
          total: totalArticles,
          onChange: (page) => setCurrentPage(page),
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: "max-content" }}
      />
    </Card>
  )
}
