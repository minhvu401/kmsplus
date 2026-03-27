"use client"

import { ReactNode, useEffect, useState } from "react"
import { SessionProvider } from "next-auth/react"
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
    return <SessionProvider>{children}</SessionProvider>
  }

  return <SessionProvider>{children}</SessionProvider>
}
