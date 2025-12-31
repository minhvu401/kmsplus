"use client"

import React, { useState } from "react"
import { Layout, theme } from "antd"
import AppSidebar from "./AppSidebar"
import AppHeader from "./AppHeader"

const { Content } = Layout

interface LayoutProps {
  children: React.ReactNode
}

const PrivateLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleToggle = () => {
    setCollapsed(!collapsed)
  }

  return (
    // <Layout
    //   style={{
    //     // minHeight: "100vh",
    //     height: "100%",
    //   }}
    // >
    //   <AppSidebar collapsed={collapsed} />
    //   <Layout>
    //     <AppHeader collapsed={collapsed} onToggle={handleToggle} />
    //     <Content
    //       style={{
    //         margin: "24px 16px",
    //         position: "sticky",
    //         top: 0,
    //         zIndex: 1,
    //         padding: 24,
    //         background: colorBgContainer,
    //         borderRadius: borderRadiusLG,
    //       }}
    //     >
    //       {children}
    //     </Content>
    //   </Layout>
    // </Layout>
    <div
      // style={{ minHeight: "100vh", display: "flex", width: "100%" }}
      className="min-h-screen w-full flex bg-white"
    >
      <AppSidebar collapsed={collapsed} />
      <div className="flex-1">
        <AppHeader
          collapsed={collapsed}
          onToggle={handleToggle}
          className="sticky top-0 z-10 bg-white border-b border-gray-200"
        />
        <div
          className="min-h-[calc(100vh-112px)]"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default PrivateLayout
