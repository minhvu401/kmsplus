import { useRouter, usePathname } from "next/navigation"
import { useMemo } from "react"
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  DatabaseOutlined,
  FormOutlined,
  TeamOutlined,
  MessageOutlined,
  SettingOutlined,
  UserOutlined,
  BulbOutlined,
  FolderOpenOutlined,
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
      label: "Tổng quan",
      title: "Tổng quan",
      route: PageRoute.DASHBOARD,
      onClick: () => navigate(PageRoute.DASHBOARD),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: "Khóa học",
      title: "Khóa học",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      key: PageRoute.QUIZZES,
      icon: <FormOutlined />,
      label: "Bài kiểm tra",
      title: "Bài kiểm tra",
      route: PageRoute.QUIZZES,
      onClick: () => navigate(PageRoute.QUIZZES),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: "Bài viết",
      title: "Bài viết",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      key: PageRoute.QUESTION_BANK,
      icon: <DatabaseOutlined />,
      label: "Ngân hàng câu hỏi",
      title: "Ngân hàng câu hỏi",
      route: PageRoute.QUESTION_BANK,
      onClick: () => navigate(PageRoute.QUESTION_BANK),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: "Hỏi đáp",
      title: "Hỏi đáp",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: "Hồ sơ cá nhân",
      title: "Hồ sơ cá nhân",
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      title: "Cài đặt",
      route: "/settings",
      onClick: () => navigate("/settings"),
    },
  ] as MenuItem[]
}

export const useSidebarItems = (userRole?: Role) => {
  const { navigate } = useNavigation()
  const items = useMemo(
    () => createMenuItems(navigate, userRole),
    [navigate, userRole]
  )
  return items
}

// Export hàm thô (nếu cần)
export const getSidebarItems = (): MenuItem[] => {
  return createMenuItems(() => {})
}
