"use client"

import { ReactNode, useEffect, useState } from "react"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import useLanguageStore from "@/store/useLanguageStore"

export function RootProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguageStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Update HTML lang attribute
    document.documentElement.lang = language
    document.documentElement.dir = language === "vi" ? "ltr" : "ltr"
  }, [language])

  if (!mounted) {
    return <AntdRegistry>{children}</AntdRegistry>
  }

  return <AntdRegistry>{children}</AntdRegistry>
}
