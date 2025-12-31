"use client"

import { getCurrentUserInfor } from "@/action/user/userActions"
import { Dropdown, Flex, MenuProps, Typography } from "antd"
import { Bell, User } from "lucide-react"
import { useEffect, useState } from "react"
import LogoutIcon from "@/components/icon/LogoutIcon"
import { logoutAction } from "@/action/auth/authActions"
import { PageRoute } from "@/enum/page-route.enum"
import { useRouter } from "next/navigation"
import useUserStore from "@/store/useUserStore"

// interface UserType {
//   id: string
//   full_name: string | null
//   email?: string
//   department?: string
//   role?: string
//   avatar_url?: string
// }

export default function Header() {
  const { user, fetchUser } = useUserStore()
  // const [user, setUser] = useState<UserType | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  const router = useRouter()

  const navigateToProfile = () => {
    router.push(PageRoute.PROFILE)
  }

  const profileItems: MenuProps["items"] = [
    {
      label: <span className="text-red-600">Đăng xuất</span>,
      icon: <LogoutIcon className="fill-red-600" />,
      key: "logout",
      className: "text-red-600",
      onClick: async () => {
        await logoutAction()
      },
    },
  ]

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       const thisUser = await getCurrentUserInfor()
  //       if (thisUser) {
  //         setUser(thisUser)
  //       }
  //     } catch (error) {}
  //   }

  //   fetchUser()
  // }, [])

  // console.log(user)

  const handleNotificationClick = () => {
    // Handle notification click
    setNotificationCount(0)
  }

  const greeting = `Good ${getTimeOfDay()}`

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  useEffect(() => {
    if (!user) {
      fetchUser()
    }
  }, [user, fetchUser])
  console.log("user", user?.full_name)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left Section - Greeting */}
      <div>
        <p className="text-sm text-gray-500">{greeting},</p>
        <h1 className="text-lg font-semibold text-gray-800">
          {user?.full_name || "User"}
        </h1>
      </div>

      {/* Right Section - Notifications & Avatar */}
      <div className="flex items-center gap-4">
        {/* Notification Button */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* User Avatar */}
        <Dropdown
          menu={{ items: profileItems }}
          trigger={["hover"]}
          placement="bottomRight"
        >
          <Flex
            className="flex items-center gap-1"
            onClick={() => {
              navigateToProfile()
            }}
            role="button"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-sky-400 flex items-center justify-center text-white text-xs font-medium">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || "User"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getUserInitials(user?.full_name)
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user?.full_name || "User"}
            </span>
          </Flex>
        </Dropdown>
      </div>
    </header>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return "Morning"
  if (hour < 18) return "Afternoon"
  return "Evening"
}
