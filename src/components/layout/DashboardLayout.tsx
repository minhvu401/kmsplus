"use client"

import Header from "@/components/ui/logged_header"
import Sidebar from "@/components/ui/trainingmanager_sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 h-full overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
