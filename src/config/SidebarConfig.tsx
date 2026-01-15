import { useRouter } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import {
  DashboardOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { PageRoute } from "@/enum/page-route.enum"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import { hasPermission } from "@/config/RolePermission.config"
import type { MenuProps } from "antd"

export type MenuItem = Required<MenuProps>["items"][number] & {
  route?: string
  children?: MenuItem[]
}

const useNavigation = () => {
  const router = useRouter()

  const navigate = (route: string) => {
    router.push(route)
  }

  return { navigate }
}

const createMenuItems = (
  navigate: (route: string) => void,
  userRole?: Role
): MenuItem[] => {
  const baseItems: MenuItem[] = [
    {
      key: PageRoute.DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
      route: PageRoute.DASHBOARD,
      onClick: () => navigate(PageRoute.DASHBOARD),
    },
    {
      key: "operations_management",
      icon: <ThunderboltOutlined />,
      label: "Quản lý Vận hành",
      children: [
        {
          key: PageRoute.QUIZZES,
          icon: <SafetyCertificateOutlined />,
          label: "Công tác",
          route: PageRoute.QUIZZES,
          onClick: () => navigate(PageRoute.QUIZZES),
        },
      ] as MenuItem[],
    },
    {
      key: PageRoute.ARTICLES,
      icon: <SettingOutlined />,
      label: "ARTICLES",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      key: PageRoute.COURSES,
      icon: <SettingOutlined />,
      label: "COURSES",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      key: PageRoute.QUESTIONS,
      icon: <SettingOutlined />,
      label: "QUESTIONS",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      key: PageRoute.QUESTION_BANK,
      icon: <SettingOutlined />,
      label: "QUESTION_BANK",
      route: PageRoute.QUESTION_BANK,
      onClick: () => navigate(PageRoute.QUESTION_BANK),
    },
  ]

  // Add User Management menu if user has permission
  if (userRole && hasPermission(userRole, Permission.MANAGE_USERS)) {
    baseItems.push({
      key: PageRoute.USER_MANAGEMENT,
      icon: <UserOutlined />,
      label: "User Management",
      route: PageRoute.USER_MANAGEMENT,
      onClick: () => navigate(PageRoute.USER_MANAGEMENT),
    })
  }

  return baseItems as MenuItem[]
}

export const useSidebarItems = (userRole?: Role) => {
  const { navigate } = useNavigation()
  const items = useMemo(
    () => createMenuItems(navigate, userRole),
    [navigate, userRole]
  )
  return items
}

// 5. Export hàm thô (nếu cần)
export const getSidebarItems = (userRole?: Role): MenuItem[] => {
  return createMenuItems(() => {}, userRole) // Hàm không cần sử dụng navigate ở đây
}
