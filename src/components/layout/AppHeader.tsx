import React, { useEffect, useState } from "react"
import { Layout, Avatar, Badge, Space, Typography, theme, Flex } from "antd"
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  WarningOutlined,
  MessageOutlined,
} from "@ant-design/icons"
import { getCurrentUserInfor } from "@/action/user/userActions"
import { useRouter } from "next/navigation"
import { PageRoute } from "@/enum/page-route.enum"

const { Header } = Layout
const { Text } = Typography

interface HeaderProps {
  collapsed: boolean
  onToggle: () => void
}

interface UserType {
  id: string
  full_name: string | null
  email?: string
  department?: string
  role?: string
  avatar_url?: string
}

export default function AppHeader({ collapsed, onToggle }: HeaderProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const [user, setUser] = useState<UserType | null>(null)

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
    const fetchUser = async () => {
      try {
        const thisUser = await getCurrentUserInfor()
        if (thisUser) {
          setUser(thisUser)
        }
      } catch (error) {}
    }

    fetchUser()
  }, [])

  return (
    <Header
      style={{
        padding: "0 24px",
        background: colorBgContainer,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
        className: "trigger",
        onClick: onToggle,
        style: { fontSize: "18px", cursor: "pointer" },
      })}

      <Space size="middle">
        {/* <WarningOutlined style={{ fontSize: "18px", color: "#f5222d" }} /> */}
        <MessageOutlined style={{ fontSize: "18px" }} />
        <Badge count={11} dot>
          <BellOutlined style={{ fontSize: "18px" }} />
        </Badge>
        <Flex
          vertical={false}
          onClick={navigateToProfile}
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
      </Space>
    </Header>
  )
}

// export default AppHeader
