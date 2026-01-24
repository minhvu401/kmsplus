// src/lib/i18n.ts
import { Language } from "@/store/useLanguageStore"

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header
    "header.notifications": "Thông báo",
    
    // Sidebar
    "sidebar.dashboard": "Tổng quan",
    "sidebar.courses": "Khóa học",
    "sidebar.quizzes": "Bài kiểm tra",
    "sidebar.articles": "Bài viết",
    "sidebar.question_bank": "Ngân hàng câu hỏi",
    "sidebar.questions": "Hỏi đáp",
    "sidebar.user_management": "Quản lý người dùng",
    "sidebar.role_permission": "Vai trò & Quyền hạn",
    "sidebar.profile": "Hồ sơ cá nhân",
    "sidebar.settings": "Cài đặt",
    
    // Profile
    "profile.title": "Hồ sơ cá nhân",
    "profile.subtitle": "Quản lý thông tin cá nhân và bảo mật tài khoản",
    "profile.edit": "Chỉnh sửa",
    "profile.change_password": "Đổi mật khẩu",
    "profile.details": "Chi tiết",
    "profile.activity": "Hoạt động",
    "profile.security": "Bảo mật",
    "profile.profile_information": "Thông tin hồ sơ",
    "profile.full_name": "Họ và tên",
    "profile.email": "Email",
    "profile.department": "Phòng ban",
    "profile.member_since": "Ngày tham gia",
    "profile.edit_profile": "Chỉnh sửa hồ sơ",
    "profile.security_options": "Tùy chọn bảo mật",
    "profile.protect_account": "Bảo vệ tài khoản của bạn",
    "profile.protect_account_desc": "Sử dụng mật khẩu mạnh và cập nhật thường xuyên để bảo vệ tài khoản của bạn.",
    "profile.cancel": "Hủy bỏ",
    
    // Settings
    "settings.title": "Cài đặt",
    "settings.subtitle": "Quản lý các cài đặt ứng dụng của bạn",
    "settings.language": "Ngôn ngữ",
    "settings.language_description": "Chọn ngôn ngữ ưa thích của bạn",
    "settings.language_vietnamese": "Tiếng Việt",
    "settings.language_english": "Tiếng Anh",

    // Roles
    "role.employee": "Nhân viên",
    "role.contributor": "Người đóng góp",
    "role.trainingmanager": "Quản lý đào tạo",
    "role.admin": "Quản trị viên",
    "role.dashboardviewer": "Người xem bảng điều khiển",

    // Permissions - Article
    "permission.read_article": "Đọc bài viết",
    "permission.create_article": "Tạo bài viết",
    "permission.update_article": "Cập nhật bài viết",
    "permission.delete_article": "Xóa bài viết",
    "permission.approve_article": "Phê duyệt bài viết",
    
    // Permissions - Question
    "permission.read_question": "Đọc câu hỏi",
    "permission.create_question": "Tạo câu hỏi",
    "permission.update_question": "Cập nhật câu hỏi",
    "permission.delete_question": "Xóa câu hỏi",
    "permission.create_answer": "Tạo câu trả lời",
    
    // Permissions - Course
    "permission.read_course": "Xem khóa học",
    "permission.create_course": "Tạo khóa học",
    "permission.enroll_course": "Đăng ký khóa học",
    
    // Permissions - User
    "permission.manage_users": "Quản lý người dùng",
    
    // Permission Modules
    "module.article": "Bài viết",
    "module.question": "Câu hỏi",
    "module.course": "Khóa học",
    "module.user": "Người dùng",
    
    // Common
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.loading": "Đang tải...",
  },
  en: {
    // Header
    "header.notifications": "Notifications",
    
    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.courses": "Courses",
    "sidebar.quizzes": "Quizzes",
    "sidebar.articles": "Articles",
    "sidebar.question_bank": "Question Bank",
    "sidebar.questions": "Questions",
    "sidebar.user_management": "User Management",
    "sidebar.role_permission": "Role & Permission",
    "sidebar.profile": "Profile",
    "sidebar.settings": "Settings",
    
    // Profile
    "profile.title": "My Profile",
    "profile.subtitle": "Manage your personal information and account security",
    "profile.edit": "Edit",
    "profile.change_password": "Change Password",
    "profile.details": "Details",
    "profile.activity": "Activity",
    "profile.security": "Security",
    "profile.profile_information": "Profile Information",
    "profile.full_name": "Full Name",
    "profile.email": "Email",
    "profile.department": "Department",
    "profile.member_since": "Member Since",
    "profile.edit_profile": "Edit Profile",
    "profile.security_options": "Security Options",
    "profile.protect_account": "Protect Your Account",
    "profile.protect_account_desc": "Use a strong password and update it regularly to protect your account.",
    "profile.cancel": "Cancel",
    
    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your application settings",
    "settings.language": "Language",
    "settings.language_description": "Choose your preferred language",
    "settings.language_vietnamese": "Vietnamese",
    "settings.language_english": "English",

    // Roles
    "role.employee": "Employee",
    "role.contributor": "Contributor",
    "role.trainingmanager": "Training Manager",
    "role.admin": "Admin",
    "role.dashboardviewer": "Dashboard Viewer",

    // Permissions - Article
    "permission.read_article": "Read Article",
    "permission.create_article": "Create Article",
    "permission.update_article": "Update Article",
    "permission.delete_article": "Delete Article",
    "permission.approve_article": "Approve Article",
    
    // Permissions - Question
    "permission.read_question": "Read Question",
    "permission.create_question": "Create Question",
    "permission.update_question": "Update Question",
    "permission.delete_question": "Delete Question",
    "permission.create_answer": "Create Answer",
    "permission.vote_answer": "Vote Answer",
    
    // Permissions - Course
    "permission.read_course": "View Course",
    "permission.create_course": "Create Course",
    "permission.enroll_course": "Enroll Course",
    
    // Permissions - User
    "permission.manage_users": "Manage Users",
    
    // Permission Modules
    "module.article": "Articles",
    "module.question": "Questions",
    "module.course": "Courses",
    "module.user": "Users",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
  },
}

export const t = (key: string, language: Language): string => {
  return translations[language]?.[key] || key
}