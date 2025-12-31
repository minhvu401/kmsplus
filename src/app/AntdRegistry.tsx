"use client"

import React from "react"
import { AntdRegistry } from "@ant-design/nextjs-registry"

export default function AntdRegistryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <AntdRegistry>{children}</AntdRegistry>
}
