// /src/app/(main)/courses/components/LearningClient.tsx - Client component for learning interface
// This component handles the interactive learning experience for enrolled courses
"use client"

import React, { useState, useEffect } from "react"
import { Layout, Progress, Button, Typography, Divider, List, Spin } from "antd"
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons"
import Link from "next/link"

// ✅ 2. Sửa lỗi: Đảm bảo import đúng service
import { getLessonByIdAction } from "@/service/lesson.service"
import CompleteButton from "./CompleteButton"

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export default function LearningClient({ course, enrollment }: any) {
  // ✅ 3. Sửa lỗi: Khai báo các trạng thái (State) cần thiết
  const [activeItem, setActiveItem] = useState(course.curriculum[0]?.items[0])
  const [lessonDetail, setLessonDetail] = useState<any>(null) // Chứa nội dung bài học từ DB
  const [loading, setLoading] = useState(false) // Trạng thái chờ tải dữ liệu
  const [collapsed, setCollapsed] = useState(false)
  // ✅ EFFECT: Fetch nội dung chi tiết mỗi khi chọn bài học mới
  useEffect(() => {
    async function fetchDetail() {
      if (!activeItem || activeItem.type !== "lesson") return

      setLoading(true)
      try {
        const detail = await getLessonByIdAction(activeItem.resource_id)
        setLessonDetail(detail)
      } catch (error) {
        console.error("Failed to fetch lesson detail:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [activeItem])

  // Hàm xử lý hiển thị Video (YouTube/Cloudinary)
  const renderVideo = (url: string) => {
    const youtubeId = url.match(
      /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/
    )
    if (youtubeId) {
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId[1]}`}
          allowFullScreen
        />
      )
    }
    return <video src={url} controls className="w-full h-full" />
  }
  return (
    <Layout className="h-full">
      {/* 1. HEADER: Thông tin khóa học và Tiến độ */}
      <Header className="bg-white border-b px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${course.id}`}>
            <Button icon={<ArrowLeftOutlined />} type="text" />
          </Link>
          <div>
            <div className="font-bold text-gray-800 leading-tight">
              {course.title}
            </div>
            <div className="text-xs text-gray-400">
              KMS PLUS Internal Learning
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-400 uppercase font-bold">
              Your Progress
            </div>
            <div className="font-bold text-blue-600">
              {Number(enrollment.progress_percentage)}%
            </div>
          </div>
          <Progress
            type="circle"
            percent={Number(enrollment.progress_percentage)}
            width={40}
            strokeColor="#22c55e"
          />
        </div>
      </Header>

      <Layout>
        {/* 2. CONTENT AREA: Trình xem nội dung bài học */}
        <Content className="overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {activeItem?.type === "lesson" ? (
              <div className="bg-black aspect-video rounded-xl overflow-hidden shadow-2xl flex items-center justify-center text-white">
                {/* Ở đây bạn tích hợp Video Player hoặc Iframe YouTube */}
                <PlayCircleOutlined style={{ fontSize: 64, opacity: 0.5 }} />
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-sm border min-h-[400px]">
                <Title level={3}>{activeItem?.title}</Title>
                <Divider />
                <Text>
                  Nội dung bài thi hoặc tài liệu PDF sẽ hiển thị ở đây...
                </Text>
              </div>
            )}

            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
              <div>
                <Title level={4} className="!m-0">
                  {activeItem?.title}
                </Title>
                <Text type="secondary">
                  Module:{" "}
                  {
                    course.curriculum.find((s: any) =>
                      s.items.some((i: any) => i.id === activeItem.id)
                    )?.title
                  }
                </Text>
              </div>

              {/* Nút Đánh dấu hoàn thành */}
              <CompleteButton
                courseId={course.id}
                itemId={activeItem?.resource_id}
                itemType={activeItem?.type}
                initialCompleted={false}
              />
            </div>
          </div>
        </Content>

        {/* 3. SIDEBAR: Danh sách bài học (Curriculum) */}
        <Sider
          width={350}
          theme="light"
          className="border-l overflow-y-auto"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
        >
          <div className="p-4 border-b font-bold flex justify-between items-center">
            {!collapsed && <span>Course Content</span>}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>

          {!collapsed && (
            <div className="p-0">
              {course.curriculum.map((section: any) => (
                <div key={section.id}>
                  <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </div>
                  <List
                    dataSource={section.items}
                    renderItem={(item: any) => (
                      <div
                        className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-blue-50 transition-colors ${activeItem?.id === item.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}
                        onClick={() => setActiveItem(item)}
                      >
                        <div className="flex items-center gap-3">
                          {item.type === "lesson" ? (
                            <PlayCircleOutlined className="text-gray-400" />
                          ) : (
                            <FileTextOutlined className="text-blue-400" />
                          )}
                          <span
                            className={`text-sm ${activeItem?.id === item.id ? "font-bold text-blue-700" : "text-gray-600"}`}
                          >
                            {item.title}
                          </span>
                        </div>
                        {/* Hiện icon tích xanh nếu bài này đã xong (Cần thêm logic data) */}
                        <CheckCircleFilled className="text-gray-200" />
                      </div>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </Sider>
      </Layout>
    </Layout>
  )
}
