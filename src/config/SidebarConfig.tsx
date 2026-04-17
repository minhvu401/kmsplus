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
import { is } from "zod/v4/locales"

export type MenuItem = Required<MenuProps>["items"][number] & {
  route?: string
  children?: MenuItem[]
}

const byLang = (language: "vi" | "en", vi: string, en: string) =>
  language === "vi" ? vi : en

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
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: t("nav.knowledge_header", language) || "KNOWLEDGE",
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
      title: byLang(
        language,
        "Hỏi đáp - Tạo/Cập nhật/Xóa câu hỏi và câu trả lời, chia sẻ câu hỏi đã xuất bản",
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions"
      ),
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    // Articles
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: byLang(
        language,
        "Bài viết - Xem và bình luận (CRUD)",
        "Articles - View & Comment (CRUD)"
      ),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Courses
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: byLang(
        language,
        "Khóa học - Tìm kiếm, Xem, Đăng ký & Tham gia Bài kiểm tra",
        "Courses - Search, View, Enroll & Participate in Quizzes"
      ),
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    // Documents
    {
      key: "/documents",
      icon: <BookOutlined />,
      label: t("sidebar.documents", language),
      title: byLang(
        language,
        "Tài liệu - Chính sách & Hướng dẫn của Công ty",
        "Documents - Company Policies & Guidelines"
      ),
      route: "/documents",
      onClick: () => navigate("/documents"),
    },
    {
      type: "divider",
    },
    // Courses - search, view list, view a course → Enroll → participate in quizzes
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: byLang(
        language,
        "Khóa học - Tìm kiếm, xem, đăng ký và tham gia bài thi",
        "Courses - Search, View, Enroll & Participate in Quizzes"
      ),
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
      label: t("sidebar.learning_history", language),
      title: byLang(
        language,
        "Lịch sử học tập - Theo dõi tiến độ",
        "Learning History - Track your progress"
      ),
      route: "/history",
      onClick: () => navigate("/history"),
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
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: t("nav.knowledge_header", language) || "KNOWLEDGE",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title: byLang(
        language,
        "Hỏi đáp - Tạo/Cập nhật/Xóa câu hỏi và câu trả lời, chia sẻ câu hỏi đã xuất bản",
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions"
      ),
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: byLang(
        language,
        "Bài viết - CRUD đầy đủ (Tạo/Cập nhật/Xóa) và bình luận",
        "Articles - Full CRUD (Create/Update/Delete) & Comment"
      ),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language) || "Courses",
      title: byLang(
        language,
        "Khóa học - Xem Các Khóa học",
        "Courses - View Courses"
      ),
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      key: "/documents",
      icon: <BookOutlined />, // Bạn có thể đổi icon nếu muốn
      label: t("sidebar.documents", language) || "Documents",
      title: byLang(
        language,
        "Tài liệu - Chính sách & Hướng dẫn của Công ty",
        "Documents - Company Policies & Guidelines"
      ),
      route: "/documents",
      onClick: () => navigate("/documents"),
    },
    { type: "divider" },

    // Management Section Header
    {
      key: "management-header",
      label: t("nav.management_header", language) || "MANAGEMENT",
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    {
      key: PageRoute.ARTICLE_MANAGEMENT,
      icon: <FileTextOutlined />,
      label: t("sidebar.article_management", language),
      title: byLang(
        language,
        "Bài viết - Quản lý bài viết",
        "Articles - Manage Articles"
      ),
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
      label: t("sidebar.contributions", language),
      title: byLang(
        language,
        `${t("sidebar.contributions", language)} - Theo dõi đóng góp của bạn`,
        `${t("sidebar.contributions", language)} - Track your contributions`
      ),
      disabled: true, // UI chưa làm
    },
    {
      type: "divider",
    },
    // View Profile
    {
      key: PageRoute.PROFILE,
      icon: <UserOutlined />,
      label: t("sidebar.profile", language) || "Profile",
      title: t("sidebar.profile", language) || "Profile",
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
  language: "vi" | "en" = "vi",
  isHeadOfDepartment: boolean = false
): MenuItem[] => {
  return [
    // Dashboard Section Header
    {
      key: "dashboard-header",
      label: byLang(language, "BẢNG ĐIỀU KHIỂN", "DASHBOARD"),
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
      label: byLang(language, "Chỉ số tổng quan", "Dashboard Metrics"),
      title: byLang(
        language,
        "Chỉ số tổng quan - Xem phân tích hiệu suất",
        "Dashboard Metrics - View performance analytics"
      ),
      route: PageRoute.DASHBOARD_METRICS,
      onClick: () => navigate(PageRoute.DASHBOARD_METRICS),
    },
    {
      type: "divider",
    },
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: t("nav.knowledge_header", language),
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
      title: byLang(
        language,
        "Bài viết - Xem bài viết",
        "Articles - View Articles"
      ),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Documents
    {
      key: "/documents",
      icon: <BookOutlined />,
      label: t("sidebar.documents", language),
      title: byLang(
        language,
        "Tài liệu - Chính sách & Hướng dẫn của Công ty",
        "Documents - Company Policies & Guidelines"
      ),
      route: "/documents",
      onClick: () => navigate("/documents"),
    },
    // Q&A
    {
      key: PageRoute.QUESTIONS,
      icon: <MessageOutlined />,
      label: t("sidebar.qa", language) || "Q&A",
      title: byLang(
        language,
        "Hỏi đáp - Tạo/Cập nhật/Xóa câu hỏi và câu trả lời, chia sẻ câu hỏi đã xuất bản",
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions"
      ),
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    // Articles
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: byLang(
        language,
        "Bài viết - Xem Bài viết",
        "Articles - View Articles"
      ),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Courses
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: byLang(
        language,
        "Khóa học - Xem và quản lý khóa học",
        "Courses - View & Manage Courses"
      ),
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    // Documents
    {
      key: "/documents",
      icon: <BookOutlined />,
      label: t("sidebar.documents", language),
      title: byLang(
        language,
        "Tài liệu - Chính sách & Hướng dẫn của Công ty",
        "Documents - Company Policies & Guidelines"
      ),
      route: "/documents",
      onClick: () => navigate("/documents"),
    },
    {
      type: "divider",
    },
    // Management Section Header
    {
      key: "management-header",
      label: byLang(language, "QUẢN LÝ", "MANAGEMENT"),
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Q&A Management
    {
      key: PageRoute.QA_MANAGEMENT,
      icon: <MessageOutlined />,
      label: byLang(language, "Quản lý Hỏi đáp", "Q&A Management"),
      title: byLang(
        language,
        "Quản lý Hỏi đáp - Quản lý câu hỏi và câu trả lời",
        "Q&A Management - Manage Questions & Answers"
      ),
      route: PageRoute.QA_MANAGEMENT,
      onClick: () => navigate(PageRoute.QA_MANAGEMENT),
    },
    // Article Management
    {
      key: PageRoute.ARTICLE_MANAGEMENT,
      icon: <FormOutlined />,
      label: byLang(language, "Quản lý bài viết", "Article Management"),
      title: byLang(
        language,
        "Quản lý bài viết - Tạo/Cập nhật/Xóa bài viết",
        "Article Management - Create/Update/Delete Articles"
      ),
      route: PageRoute.ARTICLE_MANAGEMENT,
      onClick: () => navigate(PageRoute.ARTICLE_MANAGEMENT),
    },
    // Document Management (Wiki) - CHỈ HIỂN THỊ KHI LÀ HEAD OF DEPARTMENT
    ...(isHeadOfDepartment
      ? [
          {
            key: PageRoute.DOCUMENT_MANAGEMENT,
            icon: <FileTextOutlined />,
            label: byLang(language, "Quản lý tài liệu", "Document Management"),
            title: byLang(
              language,
              "Wiki & Chính sách nội bộ",
              "Internal Wiki & Policies"
            ),
            route: PageRoute.DOCUMENT_MANAGEMENT,
            onClick: () => navigate(PageRoute.DOCUMENT_MANAGEMENT),
          } as MenuItem,
        ]
      : []),
    // Quiz Management
    {
      key: PageRoute.QUIZ_MANAGEMENT,
      icon: <FormOutlined />,
      label: byLang(language, "Quản lý bài thi", "Quiz Management"),
      title: byLang(
        language,
        "Quản lý bài thi - Tạo/Cập nhật/Xóa bài thi",
        "Quiz Management - Create/Update/Delete Quizzes"
      ),
      route: PageRoute.QUIZ_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUIZ_MANAGEMENT),
    },
    // Course Management
    {
      key: PageRoute.COURSE_MANAGEMENT,
      icon: <BookOutlined />,
      label: byLang(language, "Quản lý khóa học", "Course Management"),
      title: byLang(
        language,
        "Quản lý khóa học - Tạo/Cập nhật/Xóa/Phê duyệt khóa học",
        "Course Management - Create/Update/Delete/Approve Courses"
      ),
      route: PageRoute.COURSE_MANAGEMENT,
      onClick: () => navigate(PageRoute.COURSE_MANAGEMENT),
    },
    // Category Management
    {
      key: PageRoute.CATEGORY_MANAGEMENT,
      icon: <FolderOpenOutlined />,
      label: byLang(language, "Quản lý danh mục", "Category Management"),
      title: byLang(
        language,
        "Quản lý danh mục - Tạo/Cập nhật/Xóa danh mục",
        "Category Management - Create/Update/Delete Categories"
      ),
      route: PageRoute.CATEGORY_MANAGEMENT,
      onClick: () => navigate(PageRoute.CATEGORY_MANAGEMENT),
    },
    // Question Bank
    {
      key: PageRoute.QUESTION_BANK_MANAGEMENT,
      icon: <DatabaseOutlined />,
      label: byLang(language, "Ngân hàng câu hỏi", "Question Bank"),
      title: byLang(
        language,
        "Ngân hàng câu hỏi - Quản lý câu hỏi cho bài thi",
        "Question Bank - Manage Questions for Quizzes"
      ),
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
      label: byLang(language, "BẢNG ĐIỀU KHIỂN", "DASHBOARD"),
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
      label: byLang(language, "Chỉ số tổng quan", "Dashboard Metrics"),
      title: byLang(
        language,
        "Chỉ số tổng quan - Xem phân tích hiệu suất",
        "Dashboard Metrics - View performance analytics"
      ),
      route: PageRoute.DASHBOARD_METRICS,
      onClick: () => navigate(PageRoute.DASHBOARD_METRICS),
    },
    {
      type: "divider",
    },
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: byLang(language, "TRI THỨC", "KNOWLEDGE"),
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
      title: byLang(
        language,
        "Hỏi đáp - Tạo/Cập nhật/Xóa câu hỏi và câu trả lời, chia sẻ câu hỏi đã xuất bản",
        "Q&A - Create/Update/Delete Questions & Answers, Share Published Questions"
      ),
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    // Articles
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: byLang(
        language,
        "Bài viết - Tạo/Xem/Xóa bài viết",
        "Articles - Create/Read/Delete Articles"
      ),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Courses
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: byLang(
        language,
        "Khóa học - Quản lý tất cả khóa học",
        "Courses - Manage All Courses"
      ),
      route: PageRoute.COURSES,
      onClick: () => navigate(PageRoute.COURSES),
    },
    {
      type: "divider",
    },
    // Management Section Header
    {
      key: "management-header",
      label: byLang(language, "QUẢN LÝ", "MANAGEMENT"),
      disabled: true,
      style: {
        textAlign: "left",
        fontSize: "11px",
        color: "#999",
        marginTop: "8px",
        marginBottom: "8px",
      },
    } as MenuItem,
    // Q&A Management
    {
      key: PageRoute.QA_MANAGEMENT,
      icon: <MessageOutlined />,
      label: byLang(language, "Quản lý Hỏi đáp", "Q&A Management"),
      title: byLang(
        language,
        "Quản lý Hỏi đáp - Quản lý câu hỏi và câu trả lời",
        "Q&A Management - Manage Questions & Answers"
      ),
      route: PageRoute.QA_MANAGEMENT,
      onClick: () => navigate(PageRoute.QA_MANAGEMENT),
    },
    // Article Management
    {
      key: PageRoute.ARTICLE_MANAGEMENT,
      icon: <FormOutlined />,
      label: byLang(language, "Quản lý bài viết", "Article Management"),
      title: byLang(
        language,
        "Quản lý bài viết - Tạo/Cập nhật/Xóa bài viết",
        "Article Management - Create/Update/Delete Articles"
      ),
      route: PageRoute.ARTICLE_MANAGEMENT,
      onClick: () => navigate(PageRoute.ARTICLE_MANAGEMENT),
    },
    // Document Management (Wiki)
    {
      key: PageRoute.DOCUMENT_MANAGEMENT,
      icon: <FileTextOutlined />,
      label: byLang(language, "Quản lý tài liệu", "Document Management"),
      title: byLang(
        language,
        "Wiki & Chính sách nội bộ",
        "Internal Wiki & Policies"
      ),
      route: PageRoute.DOCUMENT_MANAGEMENT,
      onClick: () => navigate(PageRoute.DOCUMENT_MANAGEMENT),
    },
    // Quiz Management
    {
      key: PageRoute.QUIZ_MANAGEMENT,
      icon: <FormOutlined />,
      label: byLang(language, "Quản lý bài thi", "Quiz Management"),
      title: byLang(
        language,
        "Quản lý bài thi - Tạo/Cập nhật/Xóa bài thi",
        "Quiz Management - Create/Update/Delete Quizzes"
      ),
      route: PageRoute.QUIZ_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUIZ_MANAGEMENT),
    },
    // Course Management
    {
      key: PageRoute.COURSE_MANAGEMENT,
      icon: <BookOutlined />,
      label: byLang(language, "Quản lý khóa học", "Course Management"),
      title: byLang(
        language,
        "Quản lý khóa học - Tạo/Cập nhật/Xóa khóa học",
        "Course Management - Create/Update/Delete Courses"
      ),
      route: PageRoute.COURSE_MANAGEMENT,
      onClick: () => navigate(PageRoute.COURSE_MANAGEMENT),
    },
    // Category Management
    {
      key: PageRoute.CATEGORY_MANAGEMENT,
      icon: <FolderOpenOutlined />,
      label: byLang(language, "Quản lý danh mục", "Category Management"),
      title: byLang(
        language,
        "Quản lý danh mục - Tạo/Cập nhật/Xóa danh mục",
        "Category Management - Create/Update/Delete Categories"
      ),
      route: PageRoute.CATEGORY_MANAGEMENT,
      onClick: () => navigate(PageRoute.CATEGORY_MANAGEMENT),
    },
    // Question Bank
    {
      key: PageRoute.QUESTION_BANK_MANAGEMENT,
      icon: <DatabaseOutlined />,
      label: byLang(language, "Ngân hàng câu hỏi", "Question Bank"),
      title: byLang(
        language,
        "Ngân hàng câu hỏi - Quản lý câu hỏi cho bài thi",
        "Question Bank - Manage Questions for Quizzes"
      ),
      route: PageRoute.QUESTION_BANK_MANAGEMENT,
      onClick: () => navigate(PageRoute.QUESTION_BANK_MANAGEMENT),
    },
    {
      type: "divider",
    },
    // Settings Section Header
    {
      key: "settings-header",
      label: t("nav.settings_header", language),
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
      title: byLang(
        language,
        "Quản lý người dùng - Tạo/Xem/Cập nhật/Xóa người dùng",
        "User Management - Create/Read/Update/Delete Users"
      ),
      route: PageRoute.USER_MANAGEMENT,
      onClick: () => navigate(PageRoute.USER_MANAGEMENT),
    },
    // Role & Permission
    {
      key: PageRoute.ROLE_PERMISSIONS,
      icon: <CopyOutlined />,
      label: t("sidebar.role_permission", language),
      title: byLang(
        language,
        "Vai trò - Quyền hạn: Xem và quản lý ma trận phân quyền",
        "Role-Permission - View & Manage Role Permissions Matrix"
      ),
      route: PageRoute.ROLE_PERMISSIONS,
      onClick: () => navigate(PageRoute.ROLE_PERMISSIONS),
    },
    // System Settings
    {
      key: PageRoute.SYSTEM_SETTINGS,
      icon: <SettingOutlined />,
      label: byLang(language, "Cài đặt hệ thống", "System Settings"),
      title: byLang(
        language,
        "Cài đặt hệ thống - Cấu hình tham số hệ thống",
        "System Settings - Configure System Parameters"
      ),
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
      label: byLang(language, "BẢNG ĐIỀU KHIỂN", "DASHBOARD"),
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
      label: byLang(language, "Chỉ số tổng quan", "Dashboard Metrics"),
      title: byLang(
        language,
        "Chỉ số tổng quan - Xem phân tích hiệu suất",
        "Dashboard Metrics - View performance analytics"
      ),
      route: PageRoute.DASHBOARD_METRICS,
      onClick: () => navigate(PageRoute.DASHBOARD_METRICS),
    },
    {
      type: "divider",
    },
    // Knowledge Section Header
    {
      key: "knowledge-header",
      label: byLang(language, "TRI THỨC", "KNOWLEDGE"),
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
      title: byLang(
        language,
        "Hỏi đáp - Xem câu hỏi và câu trả lời",
        "Q&A - View Questions & Answers"
      ),
      route: PageRoute.QUESTIONS,
      onClick: () => navigate(PageRoute.QUESTIONS),
    },
    // Articles - View only
    {
      key: PageRoute.ARTICLES,
      icon: <FileTextOutlined />,
      label: t("sidebar.articles", language),
      title: byLang(
        language,
        "Bài viết - Xem bài viết",
        "Articles - View Articles"
      ),
      route: PageRoute.ARTICLES,
      onClick: () => navigate(PageRoute.ARTICLES),
    },
    // Courses - View only
    {
      key: PageRoute.COURSES,
      icon: <BookOutlined />,
      label: t("sidebar.courses", language),
      title: byLang(
        language,
        "Khóa học - Xem khóa học",
        "Courses - View Courses"
      ),
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
  language: "vi" | "en" = "vi",
  isHeadOfDepartment: boolean = false
): MenuItem[] => {
  let items: MenuItem[] = []

  // Role-specific sidebars
  if (userRole === Role.EMPLOYEE) {
    items = createEmployeeSidebarItems(navigate, language)
  } else if (userRole === Role.CONTRIBUTOR) {
    items = createContributorSidebarItems(navigate, language)
  } else if (userRole === Role.TRAINING_MANAGER) {
    items = createTrainingManagerSidebarItems(
      navigate,
      language,
      isHeadOfDepartment
    )
  } else if (userRole === Role.ADMIN) {
    items = createSystemAdminSidebarItems(navigate, language)
  } else if (userRole === Role.DIRECTOR) {
    items = createDirectorSidebarItems(navigate, language)
  }
  // Nếu user đã match vào một role cụ thể ở trên
  if (items.length > 0) {
    // --- Kiểm tra ép kiểu cho tất cả HOD (CHÈN THÊM VÀO ĐÂY) ---
    if (isHeadOfDepartment && userRole !== Role.ADMIN) {
      const hasDocMenu = items.some(
        (item) => item?.key === PageRoute.DOCUMENT_MANAGEMENT
      )
      if (!hasDocMenu) {
        const profileIndex = items.findIndex(
          (item) => item?.key === PageRoute.PROFILE
        )
        const docMenu = {
          key: PageRoute.DOCUMENT_MANAGEMENT,
          icon: <FileTextOutlined />,
          label: byLang(language, "Quản lý tài liệu", "Document Management"),
          title: byLang(
            language,
            "Wiki & Chính sách nội bộ",
            "Internal Wiki & Policies"
          ),
          route: PageRoute.DOCUMENT_MANAGEMENT,
          onClick: () => navigate(PageRoute.DOCUMENT_MANAGEMENT),
        } as MenuItem

        if (profileIndex !== -1) {
          items.splice(profileIndex, 0, docMenu, { type: "divider" })
        } else {
          items.push({ type: "divider" }, docMenu)
        }
      }
    }

    // Sửa lỗi: Bắt buộc phải return items (menu theo role)
    return items
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

export const useSidebarItems = (
  userRole?: Role,
  isHeadOfDepartment: boolean = false
) => {
  const { navigate } = useNavigation()
  const { language } = useLanguageStore()
  const items = useMemo(() => {
    return createMenuItems(navigate, userRole, language, isHeadOfDepartment)
  }, [navigate, userRole, language, isHeadOfDepartment])
  return items
}

// Export hàm thô (nếu cần)
export const getSidebarItems = (
  language: "vi" | "en" = "vi",
  isHeadOfDepartment: boolean = false
): MenuItem[] => {
  return createMenuItems(() => {}, undefined, language, isHeadOfDepartment)
}
