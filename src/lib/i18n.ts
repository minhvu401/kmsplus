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
    "sidebar.qa": "Hỏi & Đáp",
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
    "profile.protect_account_desc":
      "Sử dụng mật khẩu mạnh và cập nhật thường xuyên để bảo vệ tài khoản của bạn.",
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
    "role.director": "Giám đốc",
    "role.admin": "Quản trị viên",
    "role.dashboardviewer": "Người xem bảng điều khiển",

    // Permissions - Authentication
    "permission.login": "Đăng nhập",
    "permission.logout": "Đăng xuất",
    "permission.view_profile": "Xem hồ sơ",

    // Permissions - Articles
    "permission.view_article_list": "Xem danh sách bài viết",
    "permission.search_article": "Tìm kiếm bài viết",
    "permission.read_article": "Đọc bài viết",
    "permission.create_article": "Tạo bài viết",
    "permission.update_article": "Cập nhật bài viết",
    "permission.delete_article": "Xóa bài viết",
    "permission.comment_article": "Bình luận bài viết",
    "permission.edit_article_comment": "Chỉnh sửa bình luận bài viết",
    "permission.delete_article_comment": "Xóa bình luận bài viết",
    "permission.approve_article": "Phê duyệt bài viết",

    // Permissions - Questions
    "permission.view_question_list": "Xem danh sách câu hỏi",
    "permission.search_question": "Tìm kiếm câu hỏi",
    "permission.read_question": "Đọc câu hỏi",
    "permission.create_question": "Tạo câu hỏi",
    "permission.update_question": "Cập nhật câu hỏi",
    "permission.delete_question": "Xóa câu hỏi",
    "permission.create_answer": "Tạo câu trả lời",
    "permission.edit_answer": "Chỉnh sửa câu trả lời",
    "permission.delete_answer": "Xóa câu trả lời",
    "permission.open_question": "Mở câu hỏi",
    "permission.close_question": "Đóng câu hỏi",
    "permission.share_question": "Chia sẻ câu hỏi",

    // Permissions - Courses
    "permission.create_course": "Tạo khóa học",
    "permission.view_course_list": "Xem danh sách khóa học",
    "permission.search_course": "Tìm kiếm khóa học",
    "permission.read_course": "Xem khóa học",
    "permission.update_course": "Cập nhật khóa học",
    "permission.delete_course": "Xóa khóa học",
    "permission.enroll_course": "Đăng ký khóa học",
    "permission.review_course": "Đánh giá khóa học",
    "permission.approve_course": "Phê duyệt khóa học",
    "permission.view_course_statistics": "Xem thống kê khóa học",

    // Permissions - Quizzes
    "permission.create_quiz": "Tạo bài kiểm tra",
    "permission.view_quiz": "Xem bài kiểm tra",
    "permission.update_quiz": "Cập nhật bài kiểm tra",
    "permission.delete_quiz": "Xóa bài kiểm tra",
    "permission.create_quiz_question": "Tạo câu hỏi bài kiểm tra",
    "permission.edit_quiz_question": "Chỉnh sửa câu hỏi bài kiểm tra",
    "permission.delete_quiz_question": "Xóa câu hỏi bài kiểm tra",
    "permission.view_quiz_question": "Xem câu hỏi bài kiểm tra",
    "permission.view_quiz_list": "Xem danh sách bài kiểm tra",
    "permission.participate_quiz": "Tham gia bài kiểm tra",
    "permission.view_quiz_result": "Xem kết quả bài kiểm tra",

    // Permissions - Learning
    "permission.view_question_bank": "Xem ngân hàng câu hỏi",
    "permission.view_personal_progress": "Xem tiến độ học tập",

    // Permissions - User Management
    "permission.create_account": "Tạo tài khoản",
    "permission.view_account_list": "Xem danh sách tài khoản",
    "permission.update_account": "Cập nhật tài khoản",
    "permission.deactivate_account": "Vô hiệu hóa tài khoản",
    "permission.search_account": "Tìm kiếm tài khoản",
    "permission.manage_users": "Quản lý người dùng",

    // Permissions - Categories
    "permission.create_category": "Tạo danh mục",
    "permission.view_category_list": "Xem danh sách danh mục",
    "permission.update_category": "Cập nhật danh mục",
    "permission.delete_category": "Xóa danh mục",
    "permission.search_category": "Tìm kiếm danh mục",

    // Permissions - System Administration
    "permission.monitor_activity": "Theo dõi hoạt động",
    "permission.view_statistics": "Xem thống kê",
    "permission.export_data": "Xuất dữ liệu",

    // Permissions - System Settings
    "permission.language_setting": "Cài đặt ngôn ngữ",
    "permission.view_role_permission": "Xem vai trò & quyền hạn",
    "permission.edit_role_permission": "Chỉnh sửa vai trò & quyền hạn",
    "permission.moderate_content": "Kiểm duyệt nội dung",
    "permission.ai_explanation": "Giải thích AI",
    "permission.ai_recommendation": "Gợi ý AI",

    // Permission Modules
    "module.authentication": "Xác thực",
    "module.article": "Bài viết",
    "module.question": "Câu hỏi",
    "module.course": "Khóa học",
    "module.quiz": "Bài kiểm tra",
    "module.learning": "Học tập",
    "module.user": "Người dùng",
    "module.category": "Danh mục",
    "module.admin": "Quản trị",
    "module.settings": "Cài đặt",

    // Dashboard Metrics - General
    "dashboard.metrics.access_denied": "Truy cập bị từ chối",
    "dashboard.metrics.access_denied_desc":
      "Dashboard Metrics chỉ có sẵn cho các vai trò: Giám đốc, Người quản lý đào tạo, Quản trị viên hệ thống, hoặc Nhân viên.",
    "dashboard.director.title": "🎯 Bảng điều khiển Giám đốc",
    "dashboard.director.subtitle":
      "Nhìn nhanh sức khỏe toàn hệ thống và hiệu quả đào tạo tổng thể (ROI). Theo dõi sự chấp nhận, tham gia và tác động đào tạo trên toàn tổ chức.",
    "dashboard.metrics.active_users": "Người dùng hoạt động",
    "dashboard.metrics.adoption_rate": "Tỷ lệ áp dụng",
    "dashboard.metrics.completion_rate": "Tỷ lệ hoàn thành",
    "dashboard.metrics.avg_rating": "Đánh giá trung bình",
    "dashboard.metrics.active_users_chart": "Người dùng hoạt động (MAU/DAU)",
    "dashboard.metrics.adoption_rate_chart": "Tỷ lệ áp dụng hệ thống",
    "dashboard.metrics.completion_rate_chart": "Tỷ lệ hoàn thành khóa học",
    "dashboard.metrics.top_categories": "Danh mục hàng đầu",
    "dashboard.metrics.content_rating": "Đánh giá nội dung",

    // Dashboard Metrics - Training Manager
    "dashboard.training_manager.title": "📚 Bảng điều khiển Quản lý Đào tạo",
    "dashboard.training_manager.subtitle":
      "Phát hiện lỗ hổng kiến thức, quản lý kho học liệu, và theo dõi sức khỏe của ngân hàng câu hỏi.",
    "dashboard.metrics.knowledge_gap":
      "Lỗ hổng kiến thức (Zero-result Searches)",
    "dashboard.metrics.trending_keywords": "Từ khóa xu hướng",
    "dashboard.metrics.course_dropoff": "Tỷ lệ bỏ học",
    "dashboard.metrics.unanswered_questions": "Tỷ lệ câu hỏi chưa được trả lời",
    "dashboard.metrics.top_contributors":
      "Top Người đóng góp & Người học (Leaderboard)",
    "dashboard.metrics.question_bank_health": "Sức khỏe ngân hàng câu hỏi",
    "dashboard.metrics.search_count": "Số lần tìm kiếm",
    "dashboard.metrics.no_results": "❌ Không có kết quả",
    "dashboard.metrics.answered": "Đã trả lời",
    "dashboard.metrics.unanswered": "Chưa trả lời",
    "dashboard.metrics.resolution_rate": "Tỷ lệ giải quyết",
    "dashboard.metrics.contributors": "👥 Người đóng góp",
    "dashboard.metrics.learners": "🎓 Người học xuất sắc",
    "dashboard.metrics.contribution": "đóng góp",
    "dashboard.metrics.courses_completed": "khóa hoàn",

    // Dashboard Metrics - System Admin
    "dashboard.admin.title": "⚙️ Bảng điều khiển Quản trị viên Hệ thống",
    "dashboard.admin.subtitle":
      "Xử lý các công việc đang chờ duyệt, quản lý người dùng, và theo dõi tăng trưởng hệ thống.",
    "dashboard.metrics.pending_articles": "Bài viết đang chờ duyệt",
    "dashboard.metrics.pending_courses": "Khóa học đang chờ duyệt",
    "dashboard.metrics.new_users_growth": "Tốc độ tăng trưởng người dùng mới",
    "dashboard.metrics.need_review": "Cần xem xét và phê duyệt",
    "dashboard.metrics.view_details": "Xem chi tiết",
    "dashboard.metrics.new_users": "Người dùng mới",

    // Dashboard Metrics - Employee
    "dashboard.employee.title": "👤 Bảng điều khiển Cá nhân",
    "dashboard.employee.subtitle":
      "Trả lời câu hỏi 'Tôi cần làm gì?' và 'Tôi đã đạt được gì?'. Theo dõi khóa học bắt buộc và tiến độ học tập của bạn.",
    "dashboard.metrics.mandatory_courses": "Khóa học bắt buộc sắp hết hạn",
    "dashboard.metrics.learning_progress": "Tiến độ học tập của tôi",
    "dashboard.metrics.contribution_stats": "Thống kê đóng góp của tôi",
    "dashboard.metrics.days_until_due": "Còn",
    "dashboard.metrics.days_unit": "ngày",
    "dashboard.metrics.days_overdue": "Quá hạn",
    "dashboard.metrics.today_is_due": "Hôm nay là hạn",
    "dashboard.metrics.not_started": "Chưa bắt đầu",
    "dashboard.metrics.in_progress": "Đang học",
    "dashboard.metrics.start_learning": "Đi học",
    "dashboard.metrics.updated": "Cập nhật:",
    "dashboard.metrics.articles": "Bài viết",
    "dashboard.metrics.questions": "Câu hỏi",
    "dashboard.metrics.answers": "Câu trả lời",
    "dashboard.metrics.no_mandatory_courses":
      "Không có khóa học bắt buộc sắp hết hạn",
    "dashboard.metrics.no_courses": "Chưa có khóa học nào",

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
    "sidebar.qa": "Q&A",
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
    "profile.protect_account_desc":
      "Use a strong password and update it regularly to protect your account.",
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
    "role.director": "Director",
    "role.admin": "Admin",
    "role.dashboardviewer": "Dashboard Viewer",

    // Permissions - Authentication
    "permission.login": "Login",
    "permission.logout": "Logout",
    "permission.view_profile": "View Profile",

    // Permissions - Articles
    "permission.view_article_list": "View Article List",
    "permission.search_article": "Search Article",
    "permission.read_article": "Read Article",
    "permission.create_article": "Create Article",
    "permission.update_article": "Update Article",
    "permission.delete_article": "Delete Article",
    "permission.comment_article": "Comment Article",
    "permission.edit_article_comment": "Edit Article Comment",
    "permission.delete_article_comment": "Delete Article Comment",
    "permission.approve_article": "Approve Article",

    // Permissions - Questions
    "permission.view_question_list": "View Question List",
    "permission.search_question": "Search Question",
    "permission.read_question": "Read Question",
    "permission.create_question": "Create Question",
    "permission.update_question": "Update Question",
    "permission.delete_question": "Delete Question",
    "permission.create_answer": "Create Answer",
    "permission.edit_answer": "Edit Answer",
    "permission.delete_answer": "Delete Answer",
    "permission.open_question": "Open Question",
    "permission.close_question": "Close Question",
    "permission.share_question": "Share Question",

    // Permissions - Courses
    "permission.create_course": "Create Course",
    "permission.view_course_list": "View Course List",
    "permission.search_course": "Search Course",
    "permission.read_course": "View Course",
    "permission.update_course": "Update Course",
    "permission.delete_course": "Delete Course",
    "permission.enroll_course": "Enroll Course",
    "permission.review_course": "Review Course",
    "permission.approve_course": "Approve Course",
    "permission.view_course_statistics": "View Course Statistics",

    // Permissions - Quizzes
    "permission.create_quiz": "Create Quiz",
    "permission.view_quiz": "View Quiz",
    "permission.update_quiz": "Update Quiz",
    "permission.delete_quiz": "Delete Quiz",
    "permission.create_quiz_question": "Create Quiz Question",
    "permission.edit_quiz_question": "Edit Quiz Question",
    "permission.delete_quiz_question": "Delete Quiz Question",
    "permission.view_quiz_question": "View Quiz Question",
    "permission.view_quiz_list": "View Quiz List",
    "permission.participate_quiz": "Participate Quiz",
    "permission.view_quiz_result": "View Quiz Result",

    // Permissions - Learning
    "permission.view_question_bank": "View Question Bank",
    "permission.view_personal_progress": "View Personal Progress",

    // Permissions - User Management
    "permission.create_account": "Create Account",
    "permission.view_account_list": "View Account List",
    "permission.update_account": "Update Account",
    "permission.deactivate_account": "Deactivate Account",
    "permission.search_account": "Search Account",
    "permission.manage_users": "Manage Users",

    // Permissions - Categories
    "permission.create_category": "Create Category",
    "permission.view_category_list": "View Category List",
    "permission.update_category": "Update Category",
    "permission.delete_category": "Delete Category",
    "permission.search_category": "Search Category",

    // Permissions - System Administration
    "permission.monitor_activity": "Monitor Activity",
    "permission.view_statistics": "View Statistics",
    "permission.export_data": "Export Data",

    // Permissions - System Settings
    "permission.language_setting": "Language Setting",
    "permission.view_role_permission": "View Role Permission",
    "permission.edit_role_permission": "Edit Role Permission",
    "permission.moderate_content": "Moderate Content",
    "permission.ai_explanation": "AI Explanation",
    "permission.ai_recommendation": "AI Recommendation",

    // Permission Modules
    "module.authentication": "Authentication",
    "module.article": "Articles",
    "module.question": "Questions",
    "module.course": "Courses",
    "module.quiz": "Quizzes",
    "module.learning": "Learning",
    "module.user": "Users",
    "module.category": "Categories",
    "module.admin": "Administration",
    "module.settings": "Settings",

    // Dashboard Metrics - General
    "dashboard.metrics.access_denied": "Access Denied",
    "dashboard.metrics.access_denied_desc":
      "Dashboard Metrics is only available for Director, Training Manager, System Admin, or Employee roles.",
    "dashboard.director.title": "🎯 Director Dashboard",
    "dashboard.director.subtitle":
      "Get a quick overview of system health and overall training effectiveness (ROI). Monitor adoption, engagement, and training impact across your organization.",
    "dashboard.metrics.active_users": "Active Users",
    "dashboard.metrics.adoption_rate": "Adoption Rate",
    "dashboard.metrics.completion_rate": "Completion Rate",
    "dashboard.metrics.avg_rating": "Average Rating",
    "dashboard.metrics.active_users_chart": "Active Users (MAU/DAU)",
    "dashboard.metrics.adoption_rate_chart": "System Adoption Rate",
    "dashboard.metrics.completion_rate_chart": "Course Completion Rate",
    "dashboard.metrics.top_categories": "Top Categories",
    "dashboard.metrics.content_rating": "Content Rating",

    // Dashboard Metrics - Training Manager
    "dashboard.training_manager.title": "📚 Training Manager Dashboard",
    "dashboard.training_manager.subtitle":
      "Identify knowledge gaps, manage learning resources, and monitor question bank health.",
    "dashboard.metrics.knowledge_gap": "Knowledge Gap (Zero-result Searches)",
    "dashboard.metrics.trending_keywords": "Trending Keywords",
    "dashboard.metrics.course_dropoff": "Course Drop-off Rate",
    "dashboard.metrics.unanswered_questions": "Unanswered Questions Rate",
    "dashboard.metrics.top_contributors":
      "Top Contributors & Learners (Leaderboard)",
    "dashboard.metrics.question_bank_health": "Question Bank Health",
    "dashboard.metrics.search_count": "Search Count",
    "dashboard.metrics.no_results": "❌ No Results",
    "dashboard.metrics.answered": "Answered",
    "dashboard.metrics.unanswered": "Unanswered",
    "dashboard.metrics.resolution_rate": "Resolution Rate",
    "dashboard.metrics.contributors": "👥 Contributors",
    "dashboard.metrics.learners": "🎓 Top Learners",
    "dashboard.metrics.contribution": "contributions",
    "dashboard.metrics.courses_completed": "courses completed",

    // Dashboard Metrics - System Admin
    "dashboard.admin.title": "⚙️ System Administrator Dashboard",
    "dashboard.admin.subtitle":
      "Handle pending tasks, manage users, and monitor system growth.",
    "dashboard.metrics.pending_articles": "Pending Articles",
    "dashboard.metrics.pending_courses": "Pending Courses",
    "dashboard.metrics.new_users_growth": "New Users Growth Rate",
    "dashboard.metrics.need_review": "Needs review and approval",
    "dashboard.metrics.view_details": "View Details",
    "dashboard.metrics.new_users": "New Users",

    // Dashboard Metrics - Employee
    "dashboard.employee.title": "👤 Personal Dashboard",
    "dashboard.employee.subtitle":
      "Answer 'What do I need to do?' and 'What have I achieved?'. Track mandatory courses and your learning progress.",
    "dashboard.metrics.mandatory_courses": "Mandatory Courses Due Soon",
    "dashboard.metrics.learning_progress": "My Learning Progress",
    "dashboard.metrics.contribution_stats": "My Contribution Stats",
    "dashboard.metrics.days_until_due": "Only",
    "dashboard.metrics.days_unit": "days left",
    "dashboard.metrics.days_overdue": "Overdue by",
    "dashboard.metrics.today_is_due": "Due today",
    "dashboard.metrics.not_started": "Not Started",
    "dashboard.metrics.in_progress": "In Progress",
    "dashboard.metrics.start_learning": "Start Learning",
    "dashboard.metrics.updated": "Updated:",
    "dashboard.metrics.articles": "Articles",
    "dashboard.metrics.questions": "Questions",
    "dashboard.metrics.answers": "Answers",
    "dashboard.metrics.no_mandatory_courses": "No mandatory courses due soon",
    "dashboard.metrics.no_courses": "No courses yet",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
  },
}

export const t = (key: string, language: Language): string => {
  return translations[language]?.[key] || key
}
