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
    <Layout className="w-full h-full">
      <Content className="">{children}</Content>
    </Layout>
  )
}
