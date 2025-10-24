import type { Metadata } from "next"
import { ReactNode } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { AntdRegistry } from "@ant-design/nextjs-registry"
// @ts-ignore
import "./globals.css"
import Header from "@/components/ui/logged_header"
import Sidebar from "@/components/ui/trainingmanager_sidebar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "KMS Plus",
  description: "Knowledge Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* Kết hợp các thuộc tính của thẻ body từ cả 2 file:
        - className để áp dụng font
        - suppressHydrationWarning để tránh lỗi hydration
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* AntdRegistry bao bọc toàn bộ giao diện */}
        <AntdRegistry>
          {/* Cấu trúc layout chính từ file thứ hai */}
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header
                greeting="Good Morning"
                userRole="Admin"
                userName="John Doe"
                userAvatar=""
                notificationCount={3}
              />
              <main className="flex-1 p-8 overflow-y-auto">
                {/* children chính là nội dung của các trang con */}
                {children}
              </main>
            </div>
          </div>
        </AntdRegistry>
      </body>
    </html>
  )
}
