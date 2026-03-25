"use client"

import React from "react"
import { Layout } from "antd"

const { Content } = Layout

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning>
      <Layout className="w-full h-full">
        <Content style={{ padding: "0 0px" }}>{children}</Content>
      </Layout>
    </div>
  )
}
