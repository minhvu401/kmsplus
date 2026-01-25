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
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
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
  userRole?: Role,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  const baseItems: MenuItem[] = [
    {
      key: PageRoute.DASHBOARD,
      icon: <DashboardOutlined />,
      label: t("sidebar.dashboard", language),
      title: t("sidebar.dashboard", language),
      route: PageRoute.DASHBOARD,
      onClick: () => navigate(PageRoute.DASHBOARD),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: t("sidebar.courses", language),
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      key: PageRoute.QUIZZES,
      icon: <FormOutlined />,
      label: t("sidebar.quizzes", language),
      title: t("sidebar.quizzes", language),
      route: PageRoute.QUIZZES,
      onClick: () => navigate(PageRoute.QUIZZES),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: t("sidebar.articles", language),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      key: PageRoute.QUESTION_BANK,
      icon: <DatabaseOutlined />,
      label: t("sidebar.question_bank", language),
      title: t("sidebar.question_bank", language),
      route: PageRoute.QUESTION_BANK,
      onClick: () => navigate(PageRoute.QUESTION_BANK),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.questions", language),
      title: t("sidebar.questions", language),
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    {
      key: PageRoute.USER_MANAGEMENT,
      icon: <TeamOutlined />,
      label: t("sidebar.user_management", language),
      title: t("sidebar.user_management", language),
      route: PageRoute.USER_MANAGEMENT,
      onClick: () => navigate(PageRoute.USER_MANAGEMENT),
    },
    // In SidebarConfig.tsx, add this item before settings:
    {
      key: PageRoute.ROLE_PERMISSIONS,
      icon: <FolderOpenOutlined />,
      label: t("sidebar.role_permission", language),
      title: t("sidebar.role_permission", language),
      route: PageRoute.ROLE_PERMISSIONS,
      onClick: () => navigate(PageRoute.ROLE_PERMISSIONS),
    },
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language),
      title: t("sidebar.profile", language),
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: t("sidebar.settings", language),
      title: t("sidebar.settings", language),
      route: "/settings",
      onClick: () => navigate("/settings"),
    },
  ] as MenuItem[]

  return baseItems
}

export const useSidebarItems = (userRole?: Role) => {
  const { navigate } = useNavigation()
  const { language } = useLanguageStore()
  const items = useMemo(
    () => createMenuItems(navigate, userRole, language),
    [navigate, userRole, language]
  )
  return items
}

// Export hàm thô (nếu cần)
export const getSidebarItems = (language: "vi" | "en" = "vi"): MenuItem[] => {
  return createMenuItems(() => { }, undefined, language)
}
