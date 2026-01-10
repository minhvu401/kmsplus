// components/ui/layout/Sidebar.tsx
import {
  HomeOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-60 bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between">
      {/* Navigation items */}
      <nav className="flex flex-col mt-4 space-y-2 px-3">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-700"
        >
          <HomeOutlined />
          <span>Home</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-700"
        >
          <QuestionCircleOutlined />
          <span>Q&A Forum</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-700"
        >
          <SettingOutlined />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  )
}
