"use client"

import React from "react"
import { Spin } from "antd"

interface LoadingOverlayProps {
  message: string
  visible: boolean
}

export default function LoadingOverlay({
  message,
  visible,
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <Spin size="large" />
        <p className="text-white text-lg font-medium text-center max-w-xs">
          {message}
        </p>
      </div>
    </div>
  )
}
