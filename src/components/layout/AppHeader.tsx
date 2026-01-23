"use client"
import React, { useEffect, useState } from "react"
import {
  Layout,
  Avatar,
  Badge,
  Space,
  Typography,
  theme,
  Flex,
  MenuProps,
  Dropdown,
  Divider,
} from "antd"
import {
  BellOutlined,
  UserOutlined,
  WarningOutlined,
  MessageOutlined,
} from "@ant-design/icons"
import { getCurrentUserInfor } from "@/action/user/userActions"
import { useRouter } from "next/navigation"
import { PageRoute } from "@/enum/page-route.enum"
import LogoutIcon from "@/components/icon/LogoutIcon"
import { logoutAction } from "@/action/auth/authActions"
import useUserStore from "@/store/useUserStore"
import LanguageToggle from "@/components/LanguageToggle"

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

export default function AppHeader({ collapsed }: HeaderProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const { user, clearUser, fetchUser } = useUserStore()

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
    await logoutAction()
    clearUser()
    router.push(PageRoute.LOGIN)
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

  useEffect(() => {
    if (!user) {
      fetchUser()
    }
  }, [user, fetchUser])

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
        <Badge count={11} dot>
          <BellOutlined style={{ fontSize: "18px" }} />
        </Badge>
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
  )
}

// export default AppHeader
