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
  HistoryOutlined,
  CopyOutlined,
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

/**
 * Employee Sidebar: Q&A, Articles, Courses, Learning History, View Profile
 */
const createEmployeeSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
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
    // Q&A Section - CRUD Q & A, share Q published
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title:
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    // Articles - POST comment (CRUD), View Articles
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - View & Comment (CRUD)",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      type: "divider",
    },
    // Courses - search, view list, view a course → Enroll → participate in quizzes
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: "Courses - Search, View, Enroll & Participate in Quizzes",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // Learning History - ref #
    {
      key: "learning-history",
      icon: <HistoryOutlined />,
      label: "Learning History",
      title: "Learning History - Track your progress",
      disabled: true, // UI chưa làm
      onClick: () => console.log("Learning History - ref #"),
    },
    {
      type: "divider",
    },
    // View Profile
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language),
      title: t("sidebar.profile", language),
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
  ] as MenuItem[]
}

/**
 * Contributor Sidebar: Q&A, Articles (CRUD), Contributions, Profile
 */
const createContributorSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Q&A Section - CRUD Q & A, share Q published (same as Employee)
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title:
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    // Articles - Full CRUD (Create, Update, Delete) + Comment
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - Full CRUD (Create/Update/Delete) & Comment",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      type: "divider",
    },
    // Contributions - Track contributor's content
    {
      key: "contributions",
      icon: <BulbOutlined />,
      label: "Contributions",
      title: "Contributions - Track your contributions",
      disabled: true, // UI chưa làm
      onClick: () => console.log("Contributions - ref #"),
    },
    {
      type: "divider",
    },
    // View Profile
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language),
      title: t("sidebar.profile", language),
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
  ] as MenuItem[]
}

/**
 * Training Manager Sidebar: Q&A (CRUD), Articles (view only), Courses (CRUD), Contribution, Category, Profile
 */
const createTrainingManagerSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Q&A Section - Like Employee (CRUD Q & A, Share Questions)
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title:
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    // Articles - View only
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - View Articles",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      type: "divider",
    },
    // Courses - Full CRUD (Create, Update, Delete, Approve)
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title:
        "Courses - Full CRUD (Create/Update/Delete/Approve) & Quiz Management",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // Contributions - Track contributions
    {
      key: "contributions",
      icon: <BulbOutlined />,
      label: "Contributions",
      title: "Contributions - Track your contributions",
      disabled: true, // UI chưa làm
      onClick: () => console.log("Contributions - ref #"),
    },
    {
      type: "divider",
    },
    // Category Management
    {
      key: "categories",
      icon: <FolderOpenOutlined />,
      label: "Categories",
      title: "Categories - Manage course categories",
      disabled: true, // UI chưa làm
      onClick: () => console.log("Categories - ref #"),
    },
    {
      type: "divider",
    },
    // View Profile
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language),
      title: t("sidebar.profile", language),
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
  ] as MenuItem[]
}

/**
 * System Admin Sidebar: Q&A (like Employee), Articles (CRD), Courses (CRD), User Management (CRUD), Role-Permission (RU), Profile
 */
const createSystemAdminSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Q&A Section - Like Employee (CRUD Q & A, Share Questions)
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title:
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    // Articles - CRD (Create, Read, Delete)
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - Create/Read/Delete Articles",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      type: "divider",
    },
    // Courses - CRD (Create, Read, Delete)
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: "Courses - Create/Read/Delete Courses",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // User Management - CRUD
    {
      key: PageRoute.USER_MANAGEMENT,
      icon: <TeamOutlined />,
      label: t("sidebar.user_management", language),
      title: "User Management - Create/Read/Update/Delete Users",
      route: PageRoute.USER_MANAGEMENT,
      onClick: () => navigate(PageRoute.USER_MANAGEMENT),
    },
    {
      type: "divider",
    },
    // Role-Permission - RU (Read, Update)
    {
      key: PageRoute.ROLE_PERMISSIONS,
      icon: <FolderOpenOutlined />,
      label: t("sidebar.role_permission", language),
      title: "Role-Permission - View & Manage Role Permissions Matrix",
      route: PageRoute.ROLE_PERMISSIONS,
      onClick: () => navigate(PageRoute.ROLE_PERMISSIONS),
    },
    {
      type: "divider",
    },
    // View Profile
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language),
      title: t("sidebar.profile", language),
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
  ] as MenuItem[]
}

/**
 * Director Sidebar: Q&A, Articles, Courses, Dashboard Metrics, Profile (all view only)
 */
const createDirectorSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Dashboard Metrics
    {
      key: PageRoute.DASHBOARD,
      icon: <DashboardOutlined />,
      label: t("sidebar.dashboard", language),
      title: "Dashboard Metrics - View performance analytics",
      route: PageRoute.DASHBOARD,
      onClick: () => navigate(PageRoute.DASHBOARD),
    },
    {
      type: "divider",
    },
    // Q&A Section - View only
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title: "Q&A - View Questions & Answers",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      type: "divider",
    },
    // Articles - View only
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - View Articles",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      type: "divider",
    },
    // Courses - View only
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: "Courses - View Courses",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // View Profile
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language),
      title: t("sidebar.profile", language),
      route: PageRoute.PROFILE,
      onClick: () => navigate(PageRoute.PROFILE),
    },
  ] as MenuItem[]
}

const createMenuItems = (
  navigate: (route: string) => void,
  userRole?: Role,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  // Role-specific sidebars
  if (userRole === Role.EMPLOYEE) {
    return createEmployeeSidebarItems(navigate, language)
  }

  if (userRole === Role.CONTRIBUTOR) {
    return createContributorSidebarItems(navigate, language)
  }

  if (userRole === Role.TRAINING_MANAGER) {
    return createTrainingManagerSidebarItems(navigate, language)
  }

  // System Admin/ADMIN Sidebar
  if (userRole === Role.ADMIN) {
    return createSystemAdminSidebarItems(navigate, language)
  }

  // Director Sidebar
  if (userRole === Role.DIRECTOR) {
    return createDirectorSidebarItems(navigate, language)
  }

  // Default sidebar (existing behavior)
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
  console.log(
    "📱 useSidebarItems called with userRole:",
    userRole,
    "language:",
    language
  ) // Debug log
  const items = useMemo(() => {
    console.log("💾 useMemo computing sidebar items for role:", userRole) // Debug log
    return createMenuItems(navigate, userRole, language)
  }, [navigate, userRole, language])
  return items
}

// Export hàm thô (nếu cần)
export const getSidebarItems = (language: "vi" | "en" = "vi"): MenuItem[] => {
  return createMenuItems(() => {}, undefined, language)
}
