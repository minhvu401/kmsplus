"use client"
import React, { useEffect, useState } from "react"
import {
  Layout,
  Badge,
  Space,
  Typography,
  theme,
  Flex,
  MenuProps,
  Dropdown,
  Spin,
} from "antd"
import { BellOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PageRoute } from "@/enum/page-route.enum"
import LogoutIcon from "@/components/icon/LogoutIcon"
import LoadingOverlay from "@/components/LoadingOverlay"
import { logoutAction } from "@/action/auth/authActions"
import useUserStore from "@/store/useUserStore"
import useLanguageStore from "@/store/useLanguageStore"
import LanguageToggle from "@/components/LanguageToggle"
import { t } from "@/lib/i18n"

const { Header } = Layout
const { Text } = Typography

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  collapsed: boolean
}

interface UserType {
  id: string
  full_name: string | null
  email?: string
  department?: string
  role?: string
  avatar_url?: string
}

type NotificationItem = {
  id: string
  title: string
  content: string
  thumbnail_url: string | null
  type: string
  redirect_url: string
  is_read: boolean
  created_at: string
  article_id: number | null
  course_id: number | null
  comment_id: number | null
}

export default function AppHeader({ collapsed }: HeaderProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const { user, clearUser, fetchUser } = useUserStore()
  const { language } = useLanguageStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // const [user, setUser] = useState<UserType | null>(null)

  const profileItems: MenuProps["items"] = [
    {
      label: "Profile",
      key: "profile",
      icon: <UserOutlined />,
      onClick: () => {
        navigateToProfile()
      },
    },
    {
      type: "divider",
    },
    {
      label: <span className="text-red-600">Đăng xuất</span>,
      icon: <LogoutIcon className="fill-red-600" />,
      key: "logout",
      className: "text-red-600",
      onClick: async () => {
        await HandleLogout()
      },
    },
  ]

  const HandleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Clear user from store FIRST (before redirecting)
      clearUser()

      // Then call logoutAction to delete cookies
      await logoutAction()

      // Finally call NextAuth signOut to clear NextAuth cookies
      await signOut({ redirect: false })

      // Redirect to login
      router.push(PageRoute.LOGIN)
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect even if error
      router.push(PageRoute.LOGIN)
    }
  }

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const router = useRouter()

  const navigateToProfile = () => {
    router.push(PageRoute.PROFILE)
  }

  const loadNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const response = await fetch("/api/notifications?limit=10", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      })

      const result = await response.json()

      if (response.ok && result?.success) {
        setNotifications(result.data || [])
        setUnreadCount(Number(result.unreadCount || 0))
      } else {
        console.error("Failed to load notifications:", {
          status: response.status,
          statusText: response.statusText,
          result,
        })
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleClickNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.is_read) {
        const response = await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: notification.id }),
        })

        if (!response.ok) {
          const result = await response.json().catch(() => null)
          console.error("Failed to mark notification as read:", {
            status: response.status,
            statusText: response.statusText,
            result,
          })
        }

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      if (notification.redirect_url) {
        router.push(notification.redirect_url)
      }
    } catch (error) {
      console.error("Error handling notification click:", error)
      if (notification.redirect_url) {
        router.push(notification.redirect_url)
      }
    }
  }

  useEffect(() => {
    if (!user) {
      fetchUser()
    }
  }, [user, fetchUser])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let eventSource: EventSource | null = null

    const connect = () => {
      eventSource = new EventSource("/api/notifications/stream", {
        withCredentials: true,
      })

      eventSource.addEventListener("notification", () => {
        loadNotifications()
      })

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }

        setTimeout(() => {
          connect()
        }, 3000)
      }
    }

    connect()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  useEffect(() => {
    const handleNotificationsRefresh = () => {
      loadNotifications()
    }

    window.addEventListener("notifications:refresh", handleNotificationsRefresh)
    return () => {
      window.removeEventListener(
        "notifications:refresh",
        handleNotificationsRefresh
      )
    }
  }, [])

  useEffect(() => {
    if (notificationOpen) {
      loadNotifications()
    }
  }, [notificationOpen])

  const notificationDropdown = (
    <div className="w-[380px] max-h-[420px] overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-lg">
      <div className="px-4 py-3 border-b border-gray-100">
        <Text strong>Notifications</Text>
      </div>

      {loadingNotifications ? (
        <div className="py-8 flex justify-center">
          <Spin size="small" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          No notifications yet
        </div>
      ) : (
        notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => handleClickNotification(notification)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
              notification.is_read
                ? "bg-white hover:bg-gray-50"
                : "bg-blue-50 hover:bg-blue-100"
            }`}
          >
            <div className="flex gap-3">
              <img
                src={
                  notification.thumbnail_url ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&h=120&fit=crop"
                }
                alt="Notification thumbnail"
                className="w-14 h-14 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&h=120&fit=crop"
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {notification.title}
                </div>
                <div className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {notification.content}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    hour12: false,
                  })}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  )

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

  return (
    <>
      <Header
        style={{
          padding: "0 24px",
          background: colorBgContainer,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Space size="middle">
          {/* <WarningOutlined style={{ fontSize: "18px", color: "#f5222d" }} /> */}
          <MessageOutlined style={{ fontSize: "18px" }} />
          <Dropdown
            trigger={["hover"]}
            placement="bottomRight"
            popupRender={() => notificationDropdown}
            open={notificationOpen}
            onOpenChange={setNotificationOpen}
          >
            <Badge count={unreadCount} size="small" overflowCount={99}>
              <BellOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
            </Badge>
          </Dropdown>
          <LanguageToggle />
          <Dropdown
            menu={{ items: profileItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Flex
              vertical={false}
              className="cursor-pointer flex items-center gap-2"
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
              <Text strong>{user?.full_name}</Text>
            </Flex>
          </Dropdown>
        </Space>
      </Header>
      <LoadingOverlay
        message={t("auth.returning_to_login", language)}
        visible={isLoggingOut}
      />
    </>
  )
}

// export default AppHeader
