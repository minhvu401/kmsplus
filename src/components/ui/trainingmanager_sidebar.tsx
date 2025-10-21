"use client"

import React from "react"
import {
  LibraryBig,
  BookOpenText,
  ClipboardPenLine,
  Settings,
} from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

interface SidebarProps {
  activeItem?: string
  onItemClick?: (id: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  activeItem: externalActiveItem,
  onItemClick,
}) => {
  const [internalActiveItem, setInternalActiveItem] =
    React.useState("question-bank")

  const activeItem = externalActiveItem ?? internalActiveItem

  const menuItems: MenuItem[] = [
    {
      id: "course-management",
      label: "Course Management",
      icon: <LibraryBig className="w-5 h-5" />,
      href: "/courses",
    },
    {
      id: "quiz-management",
      label: "Quiz Management",
      icon: <ClipboardPenLine className="w-5 h-5" />,
      href: "/quizzes",
    },
    {
      id: "question-bank",
      label: "Question Bank",
      icon: <BookOpenText className="w-5 h-5" />,
      href: "/questions",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/settings",
    },
  ]

  const handleClick = (id: string) => {
    setInternalActiveItem(id)
    if (onItemClick) {
      onItemClick(id)
    }
  }

  return (
    <div className="w-64 h-screen bg-blue-100 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-800">KMS Plus</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeItem === item.id
                    ? "bg-sky-400 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar
