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
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar collapsed={collapsed} />
      <Layout>
        <AppHeader collapsed={collapsed} onToggle={handleToggle} />
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default PrivateLayout
