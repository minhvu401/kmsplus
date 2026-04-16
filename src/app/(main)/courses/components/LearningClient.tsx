// @/src/app/(main)/courses/components/LearningClient.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Layout, Progress, Button, List, message, Spin } from "antd"
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation" // Import thêm hook điều hướng
import CompleteButton from "./CompleteButton"
import PdfViewer from "@/components/PdfViewer"
import { getLessonByIdAction } from "@/service/lesson.service"
import {
  getAttemptHistoryForCurriculumItem,
  getQuizByCurriculumItemId,
} from "@/action/quiz/quizActions"
import FeedbackBanner from "@/components/ui/reviews/feedback-banner"
import FailedBanner from "@/components/ui/reviews/failed-banner"
import QuizDetails from "@/components/ui/quizzes/quiz-details"
import AttemptHistory from "@/components/ui/quizzes/attempt-history"
import useLanguageStore from "@/store/useLanguageStore"

const { Header, Sider, Content } = Layout

const getLessonTypeLabel = (lessonType?: string) => {
  const key = (lessonType || "").toLowerCase()

  if (key === "text_media" || key === "text") return "Text"
  if (key === "video") return "Video"
  if (key === "pdf" || key === "file") return "PDF"
  return "Other"
}

export default function LearningClient({
  course,
  enrollment,
  initialCompletedIds = [],
}: any) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- STATE ---
  const [collapsed, setCollapsed] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [completedIds, setCompletedIds] =
    useState<number[]>(initialCompletedIds)
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(
    Boolean(enrollment?.has_submitted_feedback)
  )
  const [messageApi, contextHolder] = message.useMessage()
  const { language } = useLanguageStore()

  const L = {
    learningMode: language === "vi" ? "Chế độ học" : "Learning Mode",
    progress: language === "vi" ? "Tiến độ" : "Progress",
    previousLesson: language === "vi" ? "Bài trước" : "Previous Lesson",
    nextLesson: language === "vi" ? "Bài sau" : "Next Lesson",
      resetSuccess:
        language === "vi" ? 'Đã đặt lại tiến độ khóa học.' : 'Course progress has been reset.',
    quizNotAvailable: language === "vi" ? "Chi tiết bài kiểm tra không có sẵn." : "Quiz details are not available.",
    courseContent: language === "vi" ? "Nội dung khóa học" : "Course Content",
    loadingContent: language === "vi" ? "Đang tải nội dung..." : "Loading content...",
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const flag = sessionStorage.getItem('kms_reset_success')
      if (flag) {
        sessionStorage.removeItem('kms_reset_success')
        messageApi.success(L.resetSuccess)
      }
    } catch (e) {
      // ignore
    }
  }, [messageApi, language])

  // Real-time progress from database
  const currentProgressPercentage = enrollment?.progress_percentage || 0

  // --- EFFECT: Đồng bộ completedIds với Server ---
  useEffect(() => {
    if (initialCompletedIds) {
      setCompletedIds((prevLocalIds) => {
        // Logic: Lấy danh sách đang có ở Client (prevLocalIds) + Danh sách mới từ Server (initialCompletedIds)
        // Dùng Set để loại bỏ các ID trùng nhau
        const mergedIds = Array.from(
          new Set([...prevLocalIds, ...initialCompletedIds])
        )
        return mergedIds
      })
    }
  }, [initialCompletedIds])

  // Làm phẳng danh sách bài học
  const flatItems = useMemo(() => {
    return course.curriculum?.flatMap((section: any) => section.items) || []
  }, [course])

  // --- LOGIC CHỌN BÀI HỌC (Ưu tiên URL -> Bài chưa học -> Bài đầu tiên) ---
  const [activeItem, setActiveItem] = useState(() => {
    if (flatItems.length === 0) return null

    // A. Ưu tiên itemId; fallback lessonId để tương thích URL cũ
    const itemIdFromUrl = searchParams.get("itemId") ?? searchParams.get("lessonId")
    if (itemIdFromUrl) {
      const found = flatItems.find((i: any) => String(i.id) === itemIdFromUrl)
      if (found) return found
    }

    // B. Nếu không có URL, tìm bài đầu tiên chưa học
    const firstUncompleted = flatItems.find(
      (item: any) => !initialCompletedIds.includes(item.id)
    )
    return firstUncompleted || flatItems[0]
  })

  const [lessonContent, setLessonContent] = useState<any>(null)
  const [quizContent, setQuizContent] = useState<any>(null)
  const [attemptHistory, setAttemptHistory] = useState<any>(null)

  // Đồng bộ URL khi activeItem thay đổi
  useEffect(() => {
    if (activeItem) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("itemId", String(activeItem.id))
      params.delete("lessonId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [activeItem?.id])

  // --- EFFECT: Lấy nội dung bài học & Tự động sửa lỗi Link ---
  useEffect(() => {
    const fetchContent = async () => {
      if (!activeItem) return
      setLoadingContent(true)
      setLessonContent(null)
      setQuizContent(null)
      setAttemptHistory(null)

      try {
        if (activeItem.type === "lesson") {
          // Lấy dữ liệu từ DB
          const data = await getLessonByIdAction(activeItem.resource_id)

          if (data) {
            if (!data.video_url && data.content) {
              // Regex tìm link PDF hoặc Video:
              // - Link kết thúc bằng .pdf (có thể có tham số sau dấu ?)
              // Hoặc link YouTube/Vimeo/Cloudinary
              // - Dừng lại khi gặp dấu ngoặc kép " (để bắt đúng link trong href="...")
              const linkRegex =
                /(https?:\/\/[^\s"<>]+?\.pdf(?:[?#][^\s"<>]+)?|https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|cloudinary\.com)\/[^\s"<>]+)/i

              const urlMatch = data.content.match(linkRegex)

              // Nếu tìm thấy link, gán vào video_url để hiển thị Viewer
              if (urlMatch && urlMatch[0]) {
                data.video_url = urlMatch[0]
                // Giữ lại nội dung gốc để hiển thị cùng PDF
                // data.content = null
              }
            }

            setLessonContent(data)
          }
        } else if (activeItem.type === "quiz") {
          const [quiz, history] = await Promise.all([
            getQuizByCurriculumItemId(Number(activeItem.id)),
            getAttemptHistoryForCurriculumItem(Number(activeItem.id)),
          ])
          if (!quiz) {
            message.error("Failed to load quiz")
          } else {
            setQuizContent(quiz)
            setAttemptHistory(history)
          }
        }
      } catch (error) {
        console.error(error)
        message.error("Failed to load content")
      } finally {
        setLoadingContent(false)
      }
    }
    fetchContent()
  }, [activeItem])

  // --- HANDLERS ---
  const handleLessonCompleted = () => {
    if (!activeItem) return

    // Dùng curriculum item id để đồng bộ với completed_item_ids.
    const itemId = Number(activeItem?.id)

    if (!completedIds.includes(itemId)) {
      setCompletedIds((prev) => [...prev, itemId])
    }

    // Refresh trang để lấy dữ liệu progress mới nhất từ server.
    // Delay the refresh slightly so server-side revalidation (triggered by
    // the server action) has time to complete and avoid fetching stale data.
    setTimeout(() => {
      try {
        router.refresh()
      } catch (e) {
        console.error("Failed to refresh router:", e)
      }
    }, 1000)

    // Chuyển đến bài tiếp theo (nếu có)
    const currentIndex = flatItems.findIndex((i: any) => i.id === activeItem.id)
    if (currentIndex !== -1 && currentIndex < flatItems.length - 1) {
      const nextItem = flatItems[currentIndex + 1]
      setTimeout(() => {
        setActiveItem(nextItem)
      }, 500)
    }
  }

  const handlePrevLesson = () => {
    if (!activeItem) return
    const currentIndex = flatItems.findIndex((i: any) => i.id === activeItem.id)
    if (currentIndex > 0) {
      const prevItem = flatItems[currentIndex - 1]
      setActiveItem(prevItem)
    }
  }

  const handleNextLesson = () => {
    if (!activeItem) return
    const currentIndex = flatItems.findIndex((i: any) => i.id === activeItem.id)
    if (currentIndex !== -1 && currentIndex < flatItems.length - 1) {
      const nextItem = flatItems[currentIndex + 1]
      setActiveItem(nextItem)
    }
  }

  // Helper functions để kiểm tra bài đầu/cuối
  const isFirstLesson =
    flatItems.findIndex((i: any) => i.id === activeItem?.id) === 0
  const isLastLesson =
    flatItems.findIndex((i: any) => i.id === activeItem?.id) ===
    flatItems.length - 1

  // --- HELPERS ---
  const isPdf = (url: string) => {
    return (
      url.toLowerCase().split("?")[0].endsWith(".pdf") || url.includes("/pdf/")
    )
  }

  // HÀM RENDER MEDIA (Hỗ trợ Video & PDF Tối ưu)
  const renderMediaViewer = (url: string) => {
    if (!url) return null

    // 1. Xử lý PDF: sử dụng PdfViewer (react-pdf)
    if (isPdf(url)) {
      return <PdfViewer url={url} className="w-full" />
    }

    // 2. Xử lý YouTube
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(youtubeRegex)

    if (match && match[1]) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl shadow-2xl overflow-hidden border border-gray-800 relative group">
          <iframe
            className="w-full h-full object-cover"
            src={`https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`}
            title="Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: "none" }}
          />
        </div>
      )
    }

    // 3. Xử lý Video tải lên (mp4)
    return (
      <div className="aspect-video w-full bg-black rounded-xl shadow-2xl overflow-hidden border border-gray-800 relative group">
        <video
          src={url}
          controls
          className="w-full h-full object-contain bg-black"
          controlsList="nodownload"
          poster={course.thumbnail_url}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  if (!activeItem)
    return <div className="p-10 text-center">Khóa học chưa có nội dung.</div>

  // --- RENDER GIAO DIỆN ---
  return (
    <Layout className="h-screen overflow-hidden flex flex-col">
      {contextHolder}
      {/* 1. HEADER */}
      <Header className="bg-white border-b px-6 flex items-center justify-between h-16 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${course.id}`}>
            <Button icon={<ArrowLeftOutlined />} shape="circle" />
          </Link>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px] md:max-w-md">
              {course.title}
            </span>
            <span className="text-xs text-gray-500">Learning Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-xs text-gray-400 font-bold uppercase">
              Progress
            </div>
            {/* Use real-time progress from database instead of calculating */}
            <div className="text-sm font-bold text-green-600">
              {Math.round(currentProgressPercentage)}%
            </div>
          </div>
          <Progress
            type="circle"
            percent={Math.round(currentProgressPercentage)}
            size={40}
            strokeColor="#10b981"
          />
        </div>
      </Header>

      <Layout className="flex-1 overflow-hidden">
        {/* 2. MAIN CONTENT AREA */}
        <Content className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 relative">
          <div className="max-w-5xl mx-auto pb-20">
            {Math.round(currentProgressPercentage) === 100 &&
              !hasSubmittedFeedback && (
                <FeedbackBanner
                  courseId={course.id}
                  onSubmitted={() => setHasSubmittedFeedback(true)}
                  onSuccessMessage={(content) => messageApi.success(content)}
                  onErrorMessage={(content) => messageApi.error(content)}
                />
            )}
            {loadingContent ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Spin size="large" />
                <div className="text-gray-500 font-medium">
                  {L.loadingContent}
                </div>
              </div>
            ) : activeItem.type === "quiz" ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    {quizContent ? (
                      <QuizDetails
                        quiz={quizContent}
                        curriculumItemId={Number(activeItem.id)}
                        courseId={course.id}
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-10">
                        {L.quizNotAvailable}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const attempts = attemptHistory?.attempts || []
                    const hasPassed = attempts.some((a: any) => a.status === "passed")
                    const hasInProgress = attempts.some((a: any) => a.status === "in_progress")
                    const noAttemptsLeft = attemptHistory?.attempts_left === 0
                    if (noAttemptsLeft && !hasPassed && !hasInProgress) {
                      return (
                        <FailedBanner
                          courseId={course.id}
                          onSuccessMessage={(content) => messageApi.success(content)}
                          onErrorMessage={(content) => messageApi.error(content)}
                        />
                      )
                    }
                    return null
                  })()}

                  <AttemptHistory
                    courseId={course.id}
                    attempts={attemptHistory?.attempts || []}
                    attemptsLeft={attemptHistory?.attempts_left ?? null}
                    maxAttempts={attemptHistory?.max_attempts ?? null}
                  />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-gray-200 mt-8">
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    size="large"
                    className="text-gray-500 hover:text-gray-900 font-medium flex items-center"
                    onClick={handlePrevLesson}
                    disabled={isFirstLesson}
                    style={{ visibility: isFirstLesson ? "hidden" : "visible" }}
                  >
                    {L.previousLesson}
                  </Button>

                  <div className="flex-1" />

                  <Button
                    type="link"
                    size="large"
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    onClick={handleNextLesson}
                    disabled={isLastLesson}
                    style={{ visibility: isLastLesson ? "hidden" : "visible" }}
                  >
                    {L.nextLesson} <RightOutlined />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* A. KHUNG HIỂN THỊ MEDIA (VIDEO HOẶC PDF) */}
                {activeItem.type === "lesson" && (
                  (() => {
                    const mediaUrl = 
                    lessonContent?.file_path || lessonContent?.video_url || null

                    if (!mediaUrl) return null

                    return (
                      <div className="mb-8 w-full">
                        {renderMediaViewer(mediaUrl)}
                      </div>
                    )
                  })()
                )}

                {/* B. THÔNG TIN & NÚT HOÀN THÀNH */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {lessonContent?.title || activeItem?.title}
                      </h1>
                      <div className="text-gray-500 text-sm flex gap-2">
                        {activeItem.type === "lesson" ? "📚 Lesson" : "📝 Quiz"}
                        <span>•</span>
                        {lessonContent?.duration_minutes ||
                          activeItem?.duration_minutes ||
                          5}{" "}
                        min read
                      </div>
                    </div>
                  </div>

                  {/* C. NỘI DUNG VĂN BẢN (HTML) */}
                  {/* Hiển thị nếu có content (bất kể có PDF hay không) */}
                  {lessonContent?.content && (
                    <div className="mt-6 border-t pt-6 w-full overflow-hidden">
                      <div
                        // 👇 CÁC CLASS QUAN TRỌNG ĐỂ FIX LỖI:
                        className="
                          prose 
                          max-w-none 
                          text-gray-700 
                          w-full 
                          break-words 
                          prose-img:max-w-full 
                          prose-img:h-auto 
                          prose-img:rounded-lg
                          prose-video:max-w-full
                          prose-iframe:max-w-full
                          prose-a:text-blue-600
                        "
                        dangerouslySetInnerHTML={{
                          __html: lessonContent.content,
                        }}
                      />
                    </div>
                  )}

                  {/* D. NỘI DUNG PDF - Chỉ hiện khi có PDF */}
                  {lessonContent?.video_url &&
                    isPdf(lessonContent.video_url) && (
                      <div className="mt-6 border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            PDF Document
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Xem tài liệu PDF bên dưới. Bạn có thể tải xuống bằng
                          nút ở góc trên bên phải.
                        </p>
                      </div>
                    )}
                </div>

                {/* ✅ CHÈN ĐOẠN NÀY VÀO DƯỚI KHỐI 'INFO CONTENT' */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-gray-200 mt-8">
                  {/* Nút Previous */}
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    size="large"
                    className="text-gray-500 hover:text-gray-900 font-medium flex items-center"
                    onClick={handlePrevLesson}
                    disabled={isFirstLesson}
                    style={{ visibility: isFirstLesson ? "hidden" : "visible" }}
                  >
                    Previous Lesson
                  </Button>

                  {/* Nút Mark as Complete (Ở giữa) */}
                  <div className="flex-1 flex justify-center w-full md:w-auto">
                    <CompleteButton
                      courseId={course.id}
                      itemId={activeItem?.id}
                      itemType={activeItem?.type}
                      initialCompleted={completedIds.includes(Number(activeItem?.id))}
                      onCompleted={handleLessonCompleted}
                    />
                  </div>

                  {/* Nút Next */}
                  <Button
                    type="link"
                    size="large"
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    onClick={handleNextLesson}
                    disabled={isLastLesson}
                    style={{ visibility: isLastLesson ? "hidden" : "visible" }}
                  >
                    Next Lesson <RightOutlined />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Content>

        {/* 3. SIDEBAR DANH SÁCH BÀI HỌC */}
        <Sider
          width={320}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          className="border-l bg-white overflow-y-auto hidden md:block"
        >
          <div className="sticky top-0 z-10 bg-white p-4 border-b flex justify-between items-center shadow-sm">
            {!collapsed && (
              <span className="font-bold text-gray-700">{L.courseContent}</span>
            )}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>

          {!collapsed && (
            <div className="pb-20">
              {course.curriculum?.map((section: any, sIndex: number) => (
                <div key={section.id} className="border-b last:border-0">
                  <div className="bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Section {sIndex + 1}: {section.title}
                  </div>
                  <List
                    dataSource={section.items}
                    renderItem={(item: any) => {
                      // So sánh Active (có thể giữ nguyên hoặc ép chuỗi để chắc chắn)
                      const isActive =
                        String(activeItem?.id) === String(item.id)

                      const itemId = Number(item.id)
                      const isCompleted = completedIds.includes(itemId)
                      return (
                        <div
                          className={`
                            px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors border-l-4
                            ${isActive ? "bg-blue-50 border-blue-600" : "border-transparent hover:bg-gray-50"}
                          `}
                          onClick={() => setActiveItem(item)}
                        >
                          <div className="mt-1">
                            {isCompleted ? (
                              <CheckCircleFilled className="text-green-500 text-lg" />
                            ) : isActive ? (
                              <PlayCircleOutlined className="text-blue-600 text-lg" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}
                            >
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              {item.type === "lesson" ? (
                                <FileTextOutlined />
                              ) : (
                                <CheckCircleFilled />
                              )}

                              {item.type === "lesson" ? (
                                <>
                                  <span>Lesson | {getLessonTypeLabel(item.lesson_type)}</span>
                                  {item.duration_minutes ? (
                                    <span> • {item.duration_minutes} min</span>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <span>Quiz</span>
                                  {item.question_count ? (
                                    <span> • {item.question_count} questions</span>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }}
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
