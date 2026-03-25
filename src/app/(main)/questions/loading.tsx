"use client"

import { Spin } from "antd"

export default function QuestionsLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen animate-fadeIn">
      <Spin size="large" />
    </div>
  )
}
