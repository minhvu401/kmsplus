"use client"

import React, { useState, useEffect } from "react"
import { Layout, theme } from "antd"
import dynamic from "next/dynamic"

// Dynamic imports to avoid hydration mismatch caused by browser extensions
const AppSidebar = dynamic(() => import("./AppSidebar"), { ssr: false })
const AppHeader = dynamic(() => import("./AppHeader"), { ssr: false })
const FloatingChatBubble = dynamic(() => import("../FloatingChatBubble"), {
  ssr: false,
})

const { Content } = Layout

// Sidebar width constants
const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 80

interface LayoutProps {
  children: React.ReactNode
}

const PrivateLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    setCollapsed(!collapsed)
  }

  // Dynamic margin based on sidebar state
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  // Show loading skeleton until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex">
        <div className="w-[260px] h-screen bg-white border-r border-gray-200" />
        <div className="flex-1">
          <div className="h-16 bg-white border-b border-gray-200" />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gray-50" suppressHydrationWarning>
      {/* Sidebar - Fixed position */}
      <AppSidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* Main content area - with dynamic margin */}
      <div
        style={{
          marginLeft: sidebarWidth + 12, // Extra 12px for toggle button
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
        suppressHydrationWarning
      >
        {/* Header - Sticky */}
        <AppHeader
          collapsed={collapsed}
          className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm"
        />

        {/* Content area */}
        <div
          className="p-6"
          style={{
            minHeight: "calc(100vh - 64px)",
          }}
          suppressHydrationWarning
        >
          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 64px - 48px)",
            }}
            suppressHydrationWarning
          >
            {children}
          </div>
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <FloatingChatBubble />
    </div>
  )
}

export default PrivateLayout
