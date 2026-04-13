"use client"

import { ReactNode, useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import useLanguageStore from "@/store/useLanguageStore"

export function RootProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguageStore()

  useEffect(() => {
    // Keep document language attributes in sync with current app language.
    document.documentElement.lang = language
    document.documentElement.dir = language === "vi" ? "ltr" : "ltr"
  }, [language])

  return <SessionProvider>{children}</SessionProvider>
}
