"use client"

import { useState } from "react"
import {
  Card,
  Tag,
  Avatar,
  Button,
  Pagination,
  Space,
  Typography,
  Flex,
} from "antd"
import { MessageOutlined, PlusOutlined } from "@ant-design/icons"

const { Text, Title, Paragraph } = Typography

const mockArticles = [
  {
    id: 1,
    date: "23/10/2025",
    title: "Tại sao Trái Đất hình tròn?",
    snippet:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...",
    authorName: "Nguyễn Văn A",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
    commentCount: 7,
    tag: "Funny Fact",
    imageUrl:
      "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    date: "23/10/2025",
    title: "Tại sao Trái Đất hình tròn?",
    snippet:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...",
    authorName: "Nguyễn Văn A",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
    commentCount: 7,
    tag: "Funny Fact",
    imageUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    date: "23/10/2025",
    title: "Tại sao Trái Đất hình tròn?",
    snippet:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...",
    authorName: "Nguyễn Văn A",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
    commentCount: 7,
    tag: "Funny Fact",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    date: "23/10/2025",
    title: "Tại sao Trái Đất hình tròn?",
    snippet:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...",
    authorName: "Nguyễn Văn A",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
    commentCount: 7,
    tag: "Funny Fact",
    imageUrl:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop",
  },
  {
    id: 5,
    date: "23/10/2025",
    title: "Tại sao Trái Đất hình tròn?",
    snippet:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...",
    authorName: "Nguyễn Văn A",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
    commentCount: 7,
    tag: "Funny Fact",
    imageUrl:
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&h=300&fit=crop",
  },
]

const TAGS = ["Technical", "Skills", "Funny Fact"]

export default function ViewArticlePage() {
  const [activeTag, setActiveTag] = useState("Funny Fact")
  const [currentPage, setCurrentPage] = useState(2)
  const totalPages = 50

  return (
    <div className="p-6">
      <main className="flex-1 overflow-auto">
        {/* Header with Title and Description */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Bài Viết</h1>
              <p className="text-gray-600 mt-2">
                Thư viện bài viết và tài liệu học tập
              </p>
            </div>
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Tạo Bài Viết Mới
            </Button>
          </div>

          {/* Tags Filter */}
          <Space size="middle">
            <Text type="secondary" strong className="text-xs uppercase">
              RELATED TAGS
            </Text>
            <Space>
              {TAGS.map((tag) => (
                <Tag.CheckableTag
                  key={tag}
                  checked={activeTag === tag}
                  onChange={() => setActiveTag(tag)}
                  className="px-4 py-1 rounded-full cursor-pointer"
                >
                  {tag}
                </Tag.CheckableTag>
              ))}
            </Space>
          </Space>
        </div>

        {/* Article List */}
        <Space direction="vertical" size="large" className="w-full">
          {mockArticles.map((article) => (
            <Card key={article.id} hoverable>
              <Flex gap="large" align="start">
                {/* Content */}
                <Flex vertical flex={1} gap="small">
                  <Text type="secondary" className="text-sm">
                    {article.date}
                  </Text>
                  <Title
                    level={4}
                    className="!mb-0 hover:text-blue-600 cursor-pointer"
                  >
                    {article.title}
                  </Title>
                  <Paragraph
                    ellipsis={{ rows: 3 }}
                    type="secondary"
                    className="!mb-0"
                  >
                    {article.snippet}
                  </Paragraph>

                  {/* Footer */}
                  <Flex justify="space-between" align="center" className="mt-2">
                    <Space size="large">
                      <Space size="small">
                        <Avatar size="small" src={article.authorAvatar} />
                        <Text strong className="text-sm">
                          {article.authorName}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <MessageOutlined className="text-gray-500" />
                        <Text type="secondary" className="text-sm">
                          {article.commentCount} comments
                        </Text>
                      </Space>
                    </Space>
                    <Tag color="blue">{article.tag}</Tag>
                  </Flex>
                </Flex>

                {/* Image */}
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-64 h-40 object-cover rounded-lg"
                />
              </Flex>
            </Card>
          ))}
        </Space>

        {/* Pagination */}
        <Flex justify="center" className="mt-8">
          <Pagination
            current={currentPage}
            total={totalPages * 10}
            pageSize={10}
            onChange={setCurrentPage}
            showSizeChanger={false}
          />
        </Flex>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-8 py-4">
        <Flex justify="space-between" align="center">
          <Text type="secondary" className="text-sm">
            2025 - KMSPlus. Designed by <Text strong>KMS Team</Text>. All rights
            reserved
          </Text>
          <Space size="large">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              FAQs
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Terms & Condition
            </a>
          </Space>
        </Flex>
      </footer>
    </div>
  )
}
