"use client"

import React from "react"
import { Bell } from "lucide-react"

interface HeaderProps {
  greeting?: string
  userRole?: string
  userName?: string
  userAvatar?: string
  notificationCount?: number
  onNotificationClick?: () => void
  onAvatarClick?: () => void
}

const Header: React.FC<HeaderProps> = ({
  greeting = "Good Morning",
  userRole = "Training Manager",
  userName = "John Doe",
  userAvatar,
  notificationCount = 0,
  onNotificationClick,
  onAvatarClick,
}) => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
      {/* Left Section - Greeting */}
      <div>
        <p className="text-sm text-gray-500 mb-1">{greeting}</p>
        <h1 className="text-2xl font-bold text-gray-900">{userRole}</h1>
      </div>

      {/* Right Section - Notifications & Avatar */}
      <div className="flex items-center gap-6">
        {/* Notification Button */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-blue-500" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* User Avatar */}
        <button
          onClick={onAvatarClick}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
          aria-label="User menu"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-sky-400 flex items-center justify-center text-white font-semibold text-lg">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
