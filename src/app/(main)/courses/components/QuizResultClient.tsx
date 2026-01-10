// @/src/app/(main)/courses/components/QuizResultClient.tsx

"use client"

import React, { useState } from "react"
import { Button, Card, Tag, Progress, Divider, Avatar, Typography } from "antd"
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  EyeOutlined,
  TrophyOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  PlayCircleFilled,
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography

// --- 1. MOCK DATA (Giả lập dữ liệu từ DB khớp với hình ảnh) ---
const MOCK_DATA = {
  summary: {
    title: "Cybersecurity Awareness 2024",
    user: "Alex",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    completed_at: "Oct 24, 2023",
    is_passed: true,
    total_score: 85, // %
    passing_threshold: 80,
    points_earned: 850,
    total_points: 1000,
    time_taken: "12m 30s",
    avg_time: "15m 00s",
    performance_vs_avg: "+5%",
  },
  questions: [
    {
      id: 1,
      text: "What is the primary goal of a phishing attack?",
      user_answer_id: "b",
      correct_answer_id: "b",
      is_correct: true,
      options: [
        { id: "a", text: "To install antivirus software" },
        {
          id: "b",
          text: "To steal sensitive information like passwords and credit card numbers",
        },
        { id: "c", text: "To speed up your internet connection" },
      ],
      feedback: {
        type: "Instructor Feedback",
        content:
          "Correct! Phishing is a social engineering attack often used to steal user data, including login credentials and credit card numbers.",
      },
    },
    {
      id: 2,
      text: "How often is it recommended to change your passwords?",
      user_answer_id: "a", // User chọn sai
      correct_answer_id: "b",
      is_correct: false,
      options: [
        { id: "a", text: "Never, unless hacked" },
        { id: "b", text: "Every 90 days" },
        { id: "c", text: "Once a year" },
      ],
      feedback: {
        type: "Explanation",
        content:
          "Regular password rotation helps limit the window of opportunity for attackers if a password is compromised. 90 days is a standard enterprise recommendation.",
      },
    },
    {
      id: 3,
      text: "Which of the following is considered a strong password?",
      user_answer_id: "c",
      correct_answer_id: "c",
      is_correct: true,
      options: [
        { id: "a", text: "Password123" },
        { id: "b", text: "MyNameIsJohn" },
        { id: "c", text: "Tr0ub4dor&3" },
      ],
    },
  ],
}

// --- 2. SUB-COMPONENT: SUMMARY VIEW (Màn hình 1) ---
const SummaryView = ({ onReviewDetails }: { onReviewDetails: () => void }) => {
  const { summary } = MOCK_DATA

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-gray-500 text-sm mb-1">
            My Courses / Cybersecurity Awareness / Results
          </div>
          <Title level={2} className="!mb-0">
            Quiz Results
          </Title>
          <Text type="secondary">{summary.title}</Text>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm flex items-center gap-2">
          📅 Completed on {summary.completed_at}
        </div>
      </div>

      {/* Hero Card (Green) */}
      <div className="bg-gradient-to-r from-[#064e3b] to-[#0f3922] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background blobs decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 max-w-2xl">
            <Tag
              color="#22c55e"
              className="border-none text-white px-3 py-1 font-bold text-sm uppercase tracking-wide"
            >
              <CheckCircleFilled /> {summary.is_passed ? "Passed" : "Failed"}
            </Tag>
            <h1 className="text-4xl font-bold text-white m-0">
              Congratulations, {summary.user}!
            </h1>
            <p className="text-green-100 text-lg opacity-90 leading-relaxed">
              You demonstrated a strong understanding of phishing attacks and
              password security. Great job!
            </p>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<EyeOutlined />}
            onClick={onReviewDetails}
            className="!bg-[#22c55e] hover:!bg-green-500 border-none h-14 px-8 text-lg font-semibold shadow-lg rounded-xl"
          >
            Review Detailed Answers
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score */}
        <Card className="shadow-sm rounded-2xl border-none text-center py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-green-50 p-2 rounded-full mb-2">
              <Progress
                type="circle"
                percent={summary.total_score}
                width={60}
                strokeColor="#22c55e"
                format={() => <span className="text-green-600 text-xl">%</span>}
              />
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Score
            </div>
            <div className="text-4xl font-extrabold text-gray-800">
              {summary.total_score}%
            </div>
            <div className="text-xs text-gray-400">
              Threshold to pass: {summary.passing_threshold}%
            </div>
          </div>
        </Card>

        {/* Points */}
        <Card className="shadow-sm rounded-2xl border-none text-center py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 text-green-600 text-2xl">
              <TrophyOutlined />
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Points Earned
            </div>
            <div className="text-4xl font-extrabold text-gray-800">
              {summary.points_earned}
            </div>
            <div className="text-xs text-gray-400">
              Out of {summary.total_points} possible points
            </div>
          </div>
        </Card>

        {/* Time */}
        <Card className="shadow-sm rounded-2xl border-none text-center py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 text-green-600 text-2xl">
              <ClockCircleOutlined />
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Time Taken
            </div>
            <div className="text-4xl font-extrabold text-gray-800">
              {summary.time_taken}
            </div>
            <div className="text-xs text-gray-400">
              Avg time: {summary.avg_time}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Graph & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Graph Placeholder */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg m-0">Performance Breakdown</h3>
            <Tag
              color="success"
              className="m-0 text-sm px-3 py-1 rounded-lg bg-green-100 text-green-700 border-none font-semibold"
            >
              📈 {summary.performance_vs_avg} VS AVG
            </Tag>
          </div>
          <p className="text-gray-500 text-sm mb-8">
            Your score compared to the class average.
          </p>

          {/* Fake Graph Visual using CSS/SVG */}
          <div className="relative h-48 w-full">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="border-b border-dashed border-gray-100 w-full h-full"
                ></div>
              ))}
            </div>
            {/* SVG Curve */}
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,150 C100,140 200,100 300,100 S500,20 600,50 S800,80 1000,120"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Points */}
              <circle
                cx="20%"
                cy="65%"
                r="6"
                fill="white"
                stroke="#22c55e"
                strokeWidth="3"
              />
              <circle
                cx="50%"
                cy="30%"
                r="6"
                fill="white"
                stroke="#22c55e"
                strokeWidth="3"
              />
              <circle
                cx="80%"
                cy="40%"
                r="6"
                fill="white"
                stroke="#22c55e"
                strokeWidth="3"
              />
            </svg>
            {/* Labels */}
            <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400 mt-2">
              <span>Module 1</span>
              <span>Module 2</span>
              <span>Module 3</span>
              <span>Module 4</span>
              <span>Final</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-lg mb-4">Recommended Next Steps</h3>
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <PlayCircleFilled />
              </div>
              <div>
                <div className="font-bold text-gray-800 text-sm">
                  Advanced Phishing
                </div>
                <div className="text-xs text-gray-500">Video • 5 mins</div>
              </div>
              <ArrowLeftOutlined className="rotate-180 ml-auto text-gray-400" />
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <DownloadOutlined />
              </div>
              <div>
                <div className="font-bold text-gray-800 text-sm">
                  Download Certificate
                </div>
                <div className="text-xs text-gray-500">PDF Document</div>
              </div>
              <DownloadOutlined className="ml-auto text-gray-400" />
            </div>
          </div>

          <Divider className="my-4" />
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            className="w-full font-semibold text-gray-600 hover:bg-gray-50 h-10"
          >
            Share Achievement
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- 3. SUB-COMPONENT: DETAILED REVIEW (Màn hình 2) ---
const DetailedReview = ({ onBack }: { onBack: () => void }) => {
  const { summary, questions } = MOCK_DATA
  const correctCount = questions.filter((q) => q.is_correct).length
  const incorrectCount = questions.length - correctCount

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Navigation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-gray-500 text-sm">
              Home / My Learning / Cybersecurity 101 / Results
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 m-0">
            Cybersecurity Basics Quiz
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <Tag
              color="success"
              className="px-2 py-0.5 rounded text-sm font-bold border-none bg-green-100 text-green-700"
            >
              Passed
            </Tag>
            <span className="font-semibold text-gray-500 text-sm">
              Score:{" "}
              <span className="text-gray-900">{summary.total_score}%</span>
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            size="large"
            className="rounded-lg font-medium"
          >
            Back to Summary
          </Button>
          <Button
            type="primary"
            size="large"
            className="bg-[#22c55e] hover:!bg-green-500 border-none rounded-lg font-bold"
          >
            Retake Quiz
          </Button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCircleFilled className="mr-1" /> Total Questions
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {questions.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCircleFilled className="mr-1" /> Correct
          </div>
          <div className="text-2xl font-bold text-green-600">
            {correctCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
            <CloseCircleFilled className="mr-1" /> Incorrect
          </div>
          <div className="text-2xl font-bold text-red-500">
            {incorrectCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-1">
            <ClockCircleOutlined className="mr-1" /> Time Taken
          </div>
          <div className="text-2xl font-bold text-blue-500">
            {summary.time_taken}
          </div>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card
            key={q.id}
            className={`shadow-sm rounded-2xl overflow-hidden border-0 ${q.is_correct ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}`}
            bodyStyle={{ padding: 0 }}
          >
            <div className="p-6">
              {/* Question Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Question {index + 1} of {questions.length}
                </span>
                {q.is_correct ? (
                  <Tag
                    color="success"
                    className="m-0 bg-green-50 text-green-600 border-transparent font-bold px-2"
                  >
                    <CheckOutlined /> Correct
                  </Tag>
                ) : (
                  <Tag
                    color="error"
                    className="m-0 bg-red-50 text-red-500 border-transparent font-bold px-2"
                  >
                    <CloseOutlined /> Incorrect
                  </Tag>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">
                {q.text}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((opt) => {
                  let styleClass = "border border-gray-100 bg-white"
                  let icon = (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>
                  )
                  let extraLabel = null

                  // Logic hiển thị màu sắc giống hình ảnh
                  if (opt.id === q.correct_answer_id) {
                    // Đáp án đúng (luôn hiển thị xanh nếu user chọn sai để sửa lỗi)
                    if (!q.is_correct) {
                      styleClass =
                        "border border-green-400 bg-green-50 border-dashed" // Đáp án đúng mà user không chọn (viền đứt)
                      icon = (
                        <div className="w-5 h-5 rounded-full border-2 border-green-500"></div>
                      )
                      extraLabel = (
                        <span className="ml-auto text-xs font-bold text-green-600 uppercase tracking-wider">
                          Correct Answer
                        </span>
                      )
                    } else {
                      styleClass = "border border-green-500 bg-green-50" // Đáp án đúng và user chọn
                      icon = (
                        <CheckCircleFilled className="text-green-500 text-xl" />
                      )
                    }
                  } else if (opt.id === q.user_answer_id && !q.is_correct) {
                    // User chọn sai
                    styleClass = "border border-red-200 bg-red-50"
                    icon = (
                      <CloseCircleFilled className="text-red-500 text-xl" />
                    )
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-xl flex items-center gap-4 transition-all ${styleClass}`}
                    >
                      {icon}
                      <span
                        className={`font-medium ${opt.id === q.correct_answer_id ? "text-green-800" : opt.id === q.user_answer_id && !q.is_correct ? "text-red-800" : "text-gray-600"}`}
                      >
                        {opt.text}
                      </span>
                      {extraLabel}
                      {opt.id === q.user_answer_id && q.is_correct && (
                        <CheckCircleFilled className="ml-auto text-green-500" />
                      )}
                      {opt.id === q.user_answer_id && !q.is_correct && (
                        <CloseCircleFilled className="ml-auto text-red-500" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Feedback / Explanation Box */}

              {/* Feedback / Explanation Box */}
              {/* 👇 THÊM DÒNG NÀY: Kiểm tra q.feedback có tồn tại không trước khi render */}
              {q.feedback && (
                <div
                  className={`mt-6 p-5 rounded-xl flex gap-3 ${q.is_correct ? "bg-green-50/50" : "bg-gray-50"}`}
                >
                  <div className="mt-0.5">
                    {q.is_correct ? (
                      <CheckCircleFilled className="text-green-600" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                        i
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      className={`font-bold text-sm mb-1 ${q.is_correct ? "text-green-700" : "text-gray-700"}`}
                    >
                      {q.feedback.type}{" "}
                      {/* Lúc này TS biết feedback chắc chắn tồn tại */}
                    </div>
                    <p className="text-sm text-gray-600 m-0 leading-relaxed">
                      {q.feedback.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// --- 4. MAIN COMPONENT (WRAPPER) ---
export default function QuizResultClient() {
  const [view, setView] = useState<"summary" | "detailed">("summary")

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 font-sans">
      {view === "summary" ? (
        <SummaryView
          onReviewDetails={() => {
            window.scrollTo({ top: 0, behavior: "smooth" })
            setView("detailed")
          }}
        />
      ) : (
        <DetailedReview
          onBack={() => {
            window.scrollTo({ top: 0, behavior: "smooth" })
            setView("summary")
          }}
        />
      )}
    </div>
  )
}
