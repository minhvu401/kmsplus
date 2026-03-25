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
      route: "/history",
      onClick: () => navigate("/history"),
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
    // Article Management
    {
      key: PageRoute.ARTICLE_MANAGEMENT,
      icon: <FileTextOutlined />,
      label: t("sidebar.article_management", language),
      title: "Articles - Manage Articles",
      route: PageRoute.ARTICLE_MANAGEMENT,
      onClick: () => navigate(PageRoute.ARTICLE_MANAGEMENT),
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
 * Training Manager Sidebar: Dashboard, Knowledge, Management sections with all items visible
 */
const createTrainingManagerSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Dashboard Section Header
    {
      key: "dashboard-header",
      label: "DASHBOARD",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Dashboard Metrics
    {
      key: PageRoute.DASHBOARD_METRICS,
      icon: <DashboardOutlined />,
      label: "Dashboard Metrics",
      title: "Dashboard Metrics - View performance analytics",
      route: PageRoute.DASHBOARD_METRICS,
      onClick: () => navigate(PageRoute.DASHBOARD_METRICS),
    },
    {
      type: "divider",
    },
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: "KNOWLEDGE",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Articles
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - View Articles",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Q&A
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title:
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    // Courses
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: "Courses - View & Manage Courses",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // Management Section Header
    {
      key: "management-header",
      label: "MANAGEMENT",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Article Management
    {
      key: PageRoute.ARTICLE_MANAGEMENT,
      icon: <FormOutlined />,
      label: "Article Management",
      title: "Article Management - Create/Update/Delete Articles",
      route: PageRoute.ARTICLE_MANAGEMENT,
      onClick: () => navigate(PageRoute.ARTICLE_MANAGEMENT),
    },
    // Quiz Management
    {
      key: PageRoute.QUIZ_MANAGEMENT,
      icon: <FormOutlined />,
      label: "Quiz Management",
      title: "Quiz Management - Create/Update/Delete Quizzes",
      route: PageRoute.QUIZ_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUIZ_MANAGEMENT),
    },
    // Course Management
    {
      key: PageRoute.COURSE_MANAGEMENT,
      icon: <BookOutlined />,
      label: "Course Management",
      title: "Course Management - Create/Update/Delete/Approve Courses",
      route: PageRoute.COURSE_MANAGEMENT,
      onClick: () => navigate(PageRoute.COURSE_MANAGEMENT),
    },
    // Category Management
    {
      key: PageRoute.CATEGORY_MANAGEMENT,
      icon: <FolderOpenOutlined />,
      label: "Category Management",
      title: "Category Management - Create/Update/Delete Categories",
      route: PageRoute.CATEGORY_MANAGEMENT,
      onClick: () => navigate(PageRoute.CATEGORY_MANAGEMENT),
    },
    // Question Bank
    {
      key: PageRoute.QUESTION_BANK_MANAGEMENT,
      icon: <DatabaseOutlined />,
      label: "Question Bank",
      title: "Question Bank - Manage Questions for Quizzes",
      route: PageRoute.QUESTION_BANK_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUESTION_BANK_MANAGEMENT),
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
 * System Admin Sidebar: Dashboard, Knowledge, Management, Settings sections with all items visible
 */
const createSystemAdminSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Dashboard Section Header
    {
      key: "dashboard-header",
      label: "DASHBOARD",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Dashboard Metrics
    {
      key: PageRoute.DASHBOARD_METRICS,
      icon: <DashboardOutlined />,
      label: "Dashboard Metrics",
      title: "Dashboard Metrics - View performance analytics",
      route: PageRoute.DASHBOARD_METRICS,
      onClick: () => navigate(PageRoute.DASHBOARD_METRICS),
    },
    {
      type: "divider",
    },
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: "KNOWLEDGE",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Q&A
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title:
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    // Articles
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: "Articles - Create/Read/Delete Articles",
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Courses
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: "Courses - Manage All Courses",
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // Management Section Header
    {
      key: "management-header",
      label: "MANAGEMENT",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Article Management
    {
      key: PageRoute.ARTICLE_MANAGEMENT,
      icon: <FormOutlined />,
      label: "Article Management",
      title: "Article Management - Create/Update/Delete Articles",
      route: PageRoute.ARTICLE_MANAGEMENT,
      onClick: () => navigate(PageRoute.ARTICLE_MANAGEMENT),
    },
    // Quiz Management
    {
      key: PageRoute.QUIZ_MANAGEMENT,
      icon: <FormOutlined />,
      label: "Quiz Management",
      title: "Quiz Management - Create/Update/Delete Quizzes",
      route: PageRoute.QUIZ_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUIZ_MANAGEMENT),
    },
    // Course Management
    {
      key: PageRoute.COURSE_MANAGEMENT,
      icon: <BookOutlined />,
      label: "Course Management",
      title: "Course Management - Create/Update/Delete Courses",
      route: PageRoute.COURSE_MANAGEMENT,
      onClick: () => navigate(PageRoute.COURSE_MANAGEMENT),
    },
    // Category Management
    {
      key: PageRoute.CATEGORY_MANAGEMENT,
      icon: <FolderOpenOutlined />,
      label: "Category Management",
      title: "Category Management - Create/Update/Delete Categories",
      route: PageRoute.CATEGORY_MANAGEMENT,
      onClick: () => navigate(PageRoute.CATEGORY_MANAGEMENT),
    },
    // Question Bank
    {
      key: PageRoute.QUESTION_BANK_MANAGEMENT,
      icon: <DatabaseOutlined />,
      label: "Question Bank",
      title: "Question Bank - Manage Questions for Quizzes",
      route: PageRoute.QUESTION_BANK_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUESTION_BANK_MANAGEMENT),
    },
    {
      type: "divider",
    },
    // Settings Section Header
    {
      key: "settings-header",
      label: "SETTINGS",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // User Management
    {
      key: PageRoute.USER_MANAGEMENT,
      icon: <TeamOutlined />,
      label: t("sidebar.user_management", language),
      title: "User Management - Create/Read/Update/Delete Users",
      route: PageRoute.USER_MANAGEMENT,
      onClick: () => navigate(PageRoute.USER_MANAGEMENT),
    },
    // Role & Permission
    {
      key: PageRoute.ROLE_PERMISSIONS,
      icon: <CopyOutlined />,
      label: t("sidebar.role_permission", language),
      title: "Role-Permission - View & Manage Role Permissions Matrix",
      route: PageRoute.ROLE_PERMISSIONS,
      onClick: () => navigate(PageRoute.ROLE_PERMISSIONS),
    },
    // System Settings
    {
      key: PageRoute.SYSTEM_SETTINGS,
      icon: <SettingOutlined />,
      label: "System Settings",
      title: "System Settings - Configure System Parameters",
      route: PageRoute.SYSTEM_SETTINGS,
      onClick: () => navigate(PageRoute.SYSTEM_SETTINGS),
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
 * Director Sidebar: Dashboard, Knowledge sections (all view only)
 */
const createDirectorSidebarItems = (
  navigate: (route: string) => void,
  language: "vi" | "en" = "vi"
): MenuItem[] => {
  return [
    // Dashboard Section Header
    {
      key: "dashboard-header",
      label: "DASHBOARD",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Dashboard Metrics
    {
      key: PageRoute.DASHBOARD_METRICS,
      icon: <DashboardOutlined />,
      label: "Dashboard Metrics",
      title: "Dashboard Metrics - View performance analytics",
      route: PageRoute.DASHBOARD_METRICS,
      onClick: () => navigate(PageRoute.DASHBOARD_METRICS),
    },
    {
      type: "divider",
    },
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: "KNOWLEDGE",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Q&A Section - View only
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title: "Q&A - View Questions & Answers",
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
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
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: t("sidebar.courses", language),
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      key: PageRoute.QUIZ_MANAGEMENT,
      icon: <FormOutlined />,
      label: t("sidebar.quizzes", language),
      title: t("sidebar.quizzes", language),
      route: PageRoute.QUIZ_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUIZ_MANAGEMENT),
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
  const items = useMemo(() => {
    return createMenuItems(navigate, userRole, language)
  }, [navigate, userRole, language])
  return items
}

// Export hàm thô (nếu cần)
export const getSidebarItems = (language: "vi" | "en" = "vi"): MenuItem[] => {
  return createMenuItems(() => {}, undefined, language)
}
