// src/lib/i18n.ts
import { Language } from "@/store/useLanguageStore"

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Auth & Login
    "login.system_desc": "Hệ thống Quản lý Tri thức Doanh nghiệp",
    "login.feature_1": "Quản lý khóa học & tài liệu",
    "login.feature_2": "Ngân hàng câu hỏi thông minh",
    "login.feature_3": "Kiểm tra & đánh giá trực tuyến",
    "auth.returning_to_login": "Đang quay lại trang đăng nhập...",

    // Header
    "header.notifications": "Thông báo",

    // Sidebar
    "sidebar.dashboard": "Tổng quan",
    "sidebar.courses": "Khóa học",
    "sidebar.quizzes": "Bài kiểm tra",
    "sidebar.articles": "Bài viết",
    "sidebar.documents": "Tài liệu",
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

    // Profile Activity Tab
    "profile.activity_answers_empty": "Bạn chưa trả lời câu hỏi nào.",
    "profile.activity_questions_empty": "Bạn chưa đặt câu hỏi nào.",
    "profile.activity_tags_placeholder": "Nội dung thẻ (Tags).",
    "profile.activity_badges_placeholder": "Nội dung huy hiệu (Badges).",
    "profile.activity_reputation_placeholder":
      "Nội dung điểm uy tín (Reputation).",
    "profile.tab_summary": "Tổng hợp",
    "profile.tab_answers": "Câu trả lời",
    "profile.tab_questions": "Câu hỏi",
    "profile.tab_tags": "Thẻ",
    "profile.tab_badges": "Huy hiệu",
    "profile.tab_reputation": "Uy tín",

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

    // User Management
    "user.table_email": "Email",
    "user.table_full_name": "Họ và tên",
    "user.table_role": "Vai trò",
    "user.table_department": "Phòng ban",
    "user.table_status": "Trạng thái",
    "user.table_created_date": "Ngày tạo",
    "user.table_actions": "Thao tác",
    "user.btn_edit": "Chỉnh sửa",
    "user.btn_deactivate": "Vô hiệu hóa",
    "user.btn_activate": "Kích hoạt",
    "user.status_active": "Hoạt động",
    "user.status_inactive": "Không hoạt động",
    "user.modal_edit_title": "Chỉnh sửa thông tin người dùng",
    "user.form_email": "Email",
    "user.form_full_name": "Họ và tên",
    "user.form_role": "Vai trò",
    "user.form_department": "Phòng ban",
    "user.search_placeholder": "Tìm kiếm theo email hoặc tên...",
    "user.confirm_deactivate": "Vô hiệu hóa tài khoản",
    "user.confirm_deactivate_msg":
      "Bạn có chắc chắn muốn vô hiệu hóa tài khoản này không?",
    "user.confirm_activate": "Kích hoạt tài khoản",
    "user.confirm_activate_msg":
      "Bạn có chắc chắn muốn kích hoạt tài khoản này không?",
    "user.updated_success": "Cập nhật người dùng thành công",
    "user.cannot_edit_own": "Bạn không thể chỉnh sửa tài khoản của chính mình",
    "user.cannot_deactivate_admin":
      "Quản trị viên hệ thống không thể tự vô hiệu hóa",

    // Quiz Management
    "quiz.step_basic_info": "Thông tin cơ bản",
    "quiz.step_add_questions": "Thêm câu hỏi",
    "quiz.step_review_publish": "Xem lại & Công bố",
    "quiz.label_title": "Tiêu đề bài kiểm tra",
    "quiz.label_description": "Mô tả bài kiểm tra",
    "quiz.label_time_limit": "Giới hạn thời gian (phút)",
    "quiz.label_passing_score": "Điểm vượt qua (%)",
    "quiz.placeholder_title": "Nhập tiêu đề bài kiểm tra",
    "quiz.placeholder_description": "Nhập mô tả bài kiểm tra",
    "quiz.validation_empty_title": "Vui lòng nhập tiêu đề bài kiểm tra",
    "quiz.validation_empty_description": "Vui lòng nhập mô tả bài kiểm tra",
    "quiz.validation_no_questions": "Bài kiểm tra phải có ít nhất 1 câu hỏi",
    "quiz.btn_previous": "Quay lại",
    "quiz.btn_next": "Tiếp tục",
    "quiz.btn_publish": "Công bố",
    "quiz.btn_save_draft": "Lưu bản nháp",
    "quiz.published_success": "Bài kiểm tra đã được công bố thành công",

    // Quiz Validation Messages
    "quiz.validation_title_required": "Vui lòng nhập tên bài thi",
    "quiz.validation_title_min": "Tên bài thi không được ít hơn 10 ký tự",
    "quiz.validation_title_max": "Tên bài thi không vượt quá 255 ký tự",
    "quiz.validation_description_max": "Mô tả không vượt quá 1000 ký tự",
    "quiz.validation_duration_range":
      "Thời gian làm bài phải từ 0 đến 1440 phút",
    "quiz.validation_passing_score_range": "Điểm đạt phải từ 1 đến 100",
    "quiz.validation_questions_count": "Bạn cần thêm ít nhất 10 câu hỏi",
    "quiz.validation_incomplete_fields":
      "Vui lòng hoàn thành các trường bắt buộc",
    "quiz.validation_incomplete_steps": "Vui lòng hoàn thành tất cả các bước",

    // Quiz Messages
    "quiz.load_dept_error": "Không thể tải danh sách phòng ban",
    "quiz.no_questions_in_bank": "Không có câu hỏi nào trong kho dữ liệu",
    "quiz.load_questions_error": "Không thể tải danh sách câu hỏi",
    "quiz.reorder_success": "Thay đổi thứ tự câu hỏi thành công",
    "quiz.delete_question_success": "Đã xóa câu hỏi",
    "quiz.create_success": "Tạo bài thi thành công!",
    "quiz.user_not_found": "User ID not found",
    "quiz.course_required": "Course ID is required",

    // Quiz Form Labels
    "quiz.label_duration": "Thời Gian Làm Bài (phút)",
    "quiz.label_max_attempts": "Số Lần Làm Lại",
    "quiz.label_target_type": "Loại Phân Phối",
    "quiz.label_target_depts": "Chọn Phòng Ban",

    // Quiz Create - Review & Distribution
    "quiz.create_title": "Tạo Bài Thi Mới",
    "quiz.review_label_title": "Tên bài thi:",
    "quiz.review_label_description": "Mô tả:",
    "quiz.empty_value": "(Không có)",
    "quiz.review_label_time_limit": "Thời gian làm bài:",
    "quiz.review_label_passing_score": "Điểm đạt:",
    "quiz.review_label_max_attempts": "Số lần làm bài:",
    "quiz.review_label_questions_count": "Số câu hỏi:",
    "quiz.review_label_status": "Trạng thái:",
    "quiz.status_draft": "Nháp",
    "quiz.distribution_title": "Phân Phối Bài Thi",
    "quiz.target_public_company": "Công Khai (Toàn Công Ty)",
    "quiz.target_public_desc": "Tất cả nhân viên có thể thấy bài thi này",
    "quiz.target_specific_departments": "Phòng Ban Cụ Thể",
    "quiz.target_departments_desc": "Chỉ những phòng ban được chọn mới thấy",
    "quiz.placeholder_select_depts": "Chọn phòng ban...",
    "quiz.distribution_public_label": "Công Khai:",
    "quiz.distribution_public_all_employees": "Tất cả nhân viên công ty",
    "quiz.no_depts_selected": "(Chưa chọn phòng ban)",
    "quiz.btn_add_from_bank": "Thêm Câu Hỏi Từ Kho",
    "quiz.selected_questions_label": "Câu hỏi đã chọn",
    "quiz.modal_title_add_questions": "Thêm Câu Hỏi Từ Kho Dữ Liệu",

    // Navigation & Sidebar
    "sidebar.learning_history": "Lịch sử học tập",
    "sidebar.qa_management": "Quản lý Q&A",
    "sidebar.dashboard_metrics": "Thống kê Dashboard",
    "sidebar.article_management": "Quản lý bài viết",
    "sidebar.quiz_management": "Quản lý bài kiểm tra",
    "sidebar.course_management": "Quản lý khóa học",
    "sidebar.category_management": "Quản lý danh mục",
    "sidebar.contributions": "Đóng góp",
    "nav.dashboard_header": "DASHBOARD",
    "nav.knowledge_header": "KIẾN THỨC",
    "nav.management_header": "QUẢN LÝ",
    "nav.settings_header": "CÀI ĐẶT",

    // Common UI Elements
    "common.edit": "Chỉnh sửa",
    "common.delete": "Xóa",
    "common.deactivate": "Vô hiệu hóa",
    "common.activate": "Kích hoạt",
    "common.action": "Thao tác",
    "common.email": "Email",
    "common.full_name": "Họ và tên",
    "common.role": "Vai trò",
    "common.department": "Phòng ban",
    "common.status": "Trạng thái",
    "common.search": "Tìm kiếm",
    "common.select": "Chọn",
    "common.search_placeholder": "Tìm kiếm...",
    "common.select_placeholder": "Chọn một mục",
    "common.yes": "Có",
    "common.no": "Không",
    "common.current": "Hiện tại",
    "common.close": "Đóng",
    "common.minutes": "phút",
    "common.times": "lần",

    // Quiz Common
    "quiz.questions_unit": "câu",

    // Form Validation
    "form.required_field": "Vui lòng nhập trường này",
    "form.invalid_email": "Vui lòng nhập email hợp lệ",
    "form.please_enter": "Vui lòng nhập",
    "form.please_select": "Vui lòng chọn",
    "form.email": "Email",
    "form.full_name": "Họ và tên",
    "form.password": "Mật khẩu",
    "form.confirm_password": "Xác nhận mật khẩu",

    // Form Labels & Placeholders - User Creation
    "form.label_email": "Địa chỉ email",
    "form.label_password": "Mật khẩu",
    "form.label_full_name": "Họ và tên",
    "form.label_role": "Vai trò",
    "form.label_department": "Phòng ban",
    "form.placeholder_email": "user@company.com",
    "form.placeholder_password": "Tối thiểu 6 ký tự",
    "form.placeholder_full_name": "Ví dụ: Nguyễn Văn A",
    "form.placeholder_role": "Chọn vai trò cho người dùng",
    "form.placeholder_department": "Chọn phòng ban",

    // Form Validation Messages
    "form.validation_email_required": "Vui lòng nhập email",
    "form.validation_email_invalid": "Vui lòng nhập email hợp lệ",
    "form.validation_password_required": "Vui lòng nhập mật khẩu",
    "form.validation_password_min": "Mật khẩu phải có ít nhất 6 ký tự",
    "form.validation_fullname_required": "Vui lòng nhập họ và tên",
    "form.validation_fullname_min": "Họ và tên phải có ít nhất 2 ký tự",
    "form.validation_role_required": "Vui lòng chọn vai trò",
    "form.validation_department_required": "Vui lòng chọn phòng ban",

    // Form Buttons
    "form.btn_reset": "Xóa",
    "form.btn_create_user": "Tạo người dùng",

    // User Management
    "user_mgmt.page_title": "Quản lý người dùng",
    "user_mgmt.page_subtitle": "Quản lý tài khoản người dùng trong hệ thống",
    "user_mgmt.tab_create": "Tạo tài khoản",
    "user_mgmt.tab_manage": "Quản lý người dùng",
    "user_mgmt.tab_assign_hod": "Phân công trưởng phòng",
    "user_mgmt.search_placeholder": "Tìm kiếm theo email hoặc tên...",
    "user_mgmt.filter_role": "Vai trò",
    "user_mgmt.filter_role_placeholder": "Chọn vai trò...",
    "user_mgmt.filter_department": "Phòng ban",
    "user_mgmt.filter_department_placeholder": "Chọn phòng ban...",
    "user_mgmt.btn_clear_filters": "Xóa bộ lọc",
    "user_mgmt.btn_refresh": "Làm mới",
    "user_mgmt.no_departments": "Không có phòng ban để hiển thị",
    "user_mgmt.label_department": "Phòng ban",
    "user_mgmt.label_current_hod": "Trưởng phòng hiện tại",
    "user_mgmt.unassigned": "Chưa phân công",
    "user_mgmt.btn_reassign": "Đổi",
    "user_mgmt.btn_assign": "Phân công",
    "user_mgmt.modal_title_assign_hod": "Phân công trưởng phòng",
    "user_mgmt.modal_label_department": "Phòng ban",
    "user_mgmt.modal_select_hod": "Chọn trưởng phòng",
    "user_mgmt.modal_no_managers":
      "Không có Training Manager thuộc phòng ban này",
    "user_mgmt.msg_success": "Cập nhật thành công",
    "user_mgmt.msg_select_hod": "Vui lòng chọn trưởng phòng",
    "user_mgmt.msg_failed": "Không thể cập nhật trưởng phòng",
    "user_mgmt.msg_fetch_failed": "Không thể tải danh sách",

    // Common
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.loading": "Đang tải...",
  },
  en: {
    // Auth & Login
    "login.system_desc": "Enterprise Knowledge Management System",
    "login.feature_1": "Course & Document Management",
    "login.feature_2": "Smart Question Bank",
    "login.feature_3": "Online Testing & Assessment",
    "auth.returning_to_login": "Returning to login page...",

    // Header
    "header.notifications": "Notifications",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.courses": "Courses",
    "sidebar.quizzes": "Quizzes",
    "sidebar.articles": "Articles",
    "sidebar.documents": "Documents",
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

    // Profile Activity Tab
    "profile.activity_answers_empty": "You haven't answered any questions yet.",
    "profile.activity_questions_empty": "You haven't asked any questions yet.",
    "profile.activity_tags_placeholder": "Tags content.",
    "profile.activity_badges_placeholder": "Badges content.",
    "profile.activity_reputation_placeholder": "Reputation content.",
    "profile.tab_summary": "Summary",
    "profile.tab_answers": "Answers",
    "profile.tab_questions": "Questions",
    "profile.tab_tags": "Tags",
    "profile.tab_badges": "Badges",
    "profile.tab_reputation": "Reputation",

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

    // User Management
    "user.table_email": "Email",
    "user.table_full_name": "Full Name",
    "user.table_role": "Role",
    "user.table_department": "Department",
    "user.table_status": "Status",
    "user.table_created_date": "Created Date",
    "user.table_actions": "Actions",
    "user.btn_edit": "Edit",
    "user.btn_deactivate": "Deactivate",
    "user.btn_activate": "Activate",
    "user.status_active": "Active",
    "user.status_inactive": "Inactive",
    "user.modal_edit_title": "Edit User Information",
    "user.form_email": "Email",
    "user.form_full_name": "Full Name",
    "user.form_role": "Role",
    "user.form_department": "Department",
    "user.search_placeholder": "Search by email or name...",
    "user.confirm_deactivate": "Deactivate Account",
    "user.confirm_deactivate_msg":
      "Are you sure you want to deactivate this account?",
    "user.confirm_activate": "Activate Account",
    "user.confirm_activate_msg":
      "Are you sure you want to activate this account?",
    "user.updated_success": "User updated successfully",
    "user.cannot_edit_own": "You cannot edit your own account",
    "user.cannot_deactivate_admin":
      "System Administrator cannot deactivate themselves",

    // Quiz Management
    "quiz.step_basic_info": "Basic Information",
    "quiz.step_add_questions": "Add Questions",
    "quiz.step_review_publish": "Review & Publish",
    "quiz.label_title": "Quiz Title",
    "quiz.label_description": "Quiz Description",
    "quiz.label_time_limit": "Time Limit (minutes)",
    "quiz.label_passing_score": "Passing Score (%)",
    "quiz.placeholder_title": "Enter quiz title",
    "quiz.placeholder_description": "Enter quiz description",
    "quiz.validation_empty_title": "Please enter quiz title",
    "quiz.validation_empty_description": "Please enter quiz description",
    "quiz.validation_no_questions": "Quiz must have at least 1 question",
    "quiz.btn_previous": "Previous",
    "quiz.btn_next": "Next",
    "quiz.btn_publish": "Publish",
    "quiz.btn_save_draft": "Save Draft",
    "quiz.published_success": "Quiz published successfully",

    // Quiz Validation Messages
    "quiz.validation_title_required": "Please enter quiz title",
    "quiz.validation_title_min": "Quiz title must be at least 10 characters",
    "quiz.validation_title_max": "Quiz title cannot exceed 255 characters",
    "quiz.validation_description_max":
      "Description cannot exceed 1000 characters",
    "quiz.validation_duration_range":
      "Time limit must be between 0 and 1440 minutes",
    "quiz.validation_passing_score_range":
      "Passing score must be between 1 and 100",
    "quiz.validation_questions_count": "You need to add at least 10 questions",
    "quiz.validation_incomplete_fields": "Please complete all required fields",
    "quiz.validation_incomplete_steps": "Please complete all steps",

    // Quiz Messages
    "quiz.load_dept_error": "Failed to load departments",
    "quiz.no_questions_in_bank": "No questions in question bank",
    "quiz.load_questions_error": "Failed to load questions",
    "quiz.reorder_success": "Questions reordered successfully",
    "quiz.delete_question_success": "Question deleted",
    "quiz.create_success": "Quiz created successfully!",
    "quiz.user_not_found": "User ID not found",
    "quiz.course_required": "Course ID is required",

    // Quiz Form Labels
    "quiz.label_duration": "Time Limit (minutes)",
    "quiz.label_max_attempts": "Max Attempts",
    "quiz.label_target_type": "Distribution Type",
    "quiz.label_target_depts": "Select Departments",

    // Quiz Create - Review & Distribution
    "quiz.create_title": "Create New Quiz",
    "quiz.review_label_title": "Title:",
    "quiz.review_label_description": "Description:",
    "quiz.empty_value": "(None)",
    "quiz.review_label_time_limit": "Time Limit:",
    "quiz.review_label_passing_score": "Passing Score:",
    "quiz.review_label_max_attempts": "Max Attempts:",
    "quiz.review_label_questions_count": "Questions Count:",
    "quiz.review_label_status": "Status:",
    "quiz.status_draft": "Draft",
    "quiz.distribution_title": "Quiz Distribution",
    "quiz.target_public_company": "Public (Company-wide)",
    "quiz.target_public_desc": "All employees can access this quiz",
    "quiz.target_specific_departments": "Specific Departments",
    "quiz.target_departments_desc": "Only selected departments can see this",
    "quiz.placeholder_select_depts": "Select departments...",
    "quiz.distribution_public_label": "Public:",
    "quiz.distribution_public_all_employees": "All company employees",
    "quiz.no_depts_selected": "(No departments selected)",
    "quiz.btn_add_from_bank": "Add Questions From Bank",
    "quiz.selected_questions_label": "Selected Questions",
    "quiz.modal_title_add_questions": "Add Questions From Question Bank",

    // Navigation & Sidebar
    "sidebar.learning_history": "Learning History",
    "sidebar.qa_management": "Q&A Management",
    "sidebar.dashboard_metrics": "Dashboard Metrics",
    "sidebar.article_management": "Article Management",
    "sidebar.quiz_management": "Quiz Management",
    "sidebar.course_management": "Course Management",
    "sidebar.category_management": "Category Management",
    "sidebar.contributions": "Contributions",
    "nav.dashboard_header": "DASHBOARD",
    "nav.knowledge_header": "KNOWLEDGE",
    "nav.management_header": "MANAGEMENT",
    "nav.settings_header": "SETTINGS",

    // Common UI Elements
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.deactivate": "Deactivate",
    "common.activate": "Activate",
    "common.action": "Action",
    "common.email": "Email",
    "common.full_name": "Full Name",
    "common.role": "Role",
    "common.department": "Department",
    "common.status": "Status",
    "common.search": "Search",
    "common.select": "Select",
    "common.search_placeholder": "Search...",
    "common.select_placeholder": "Select an item",
    "common.yes": "Yes",
    "common.no": "No",
    "common.current": "Current",
    "common.close": "Close",
    "common.minutes": "minutes",
    "common.times": "times",

    // Quiz Common
    "quiz.questions_unit": "question(s)",

    // Form Validation
    "form.required_field": "Please fill in this field",
    "form.invalid_email": "Please enter a valid email",
    "form.please_enter": "Please enter",
    "form.please_select": "Please select",
    "form.email": "Email",
    "form.full_name": "Full Name",
    "form.password": "Password",
    "form.confirm_password": "Confirm Password",

    // Form Labels & Placeholders - User Creation
    "form.label_email": "Email Address",
    "form.label_password": "Password",
    "form.label_full_name": "Full Name",
    "form.label_role": "Role",
    "form.label_department": "Department",
    "form.placeholder_email": "user@company.com",
    "form.placeholder_password": "At least 6 characters",
    "form.placeholder_full_name": "John Doe",
    "form.placeholder_role": "Select a role for the user",
    "form.placeholder_department": "Select a department",

    // Form Validation Messages
    "form.validation_email_required": "Please enter email address",
    "form.validation_email_invalid": "Please enter a valid email address",
    "form.validation_password_required": "Please enter password",
    "form.validation_password_min": "Password must be at least 6 characters",
    "form.validation_fullname_required": "Please enter full name",
    "form.validation_fullname_min": "Full name must be at least 2 characters",
    "form.validation_role_required": "Please select a role",
    "form.validation_department_required": "Please select a department",

    // Form Buttons
    "form.btn_reset": "Reset",
    "form.btn_create_user": "Create User",

    // User Management
    "user_mgmt.page_title": "User Management",
    "user_mgmt.page_subtitle": "Manage user accounts in the system",
    "user_mgmt.tab_create": "Create Account",
    "user_mgmt.tab_manage": "Manage Users",
    "user_mgmt.tab_assign_hod": "Assign Head of Department",
    "user_mgmt.search_placeholder": "Search by email or name...",
    "user_mgmt.filter_role": "Role",
    "user_mgmt.filter_role_placeholder": "Select roles...",
    "user_mgmt.filter_department": "Department",
    "user_mgmt.filter_department_placeholder": "Select departments...",
    "user_mgmt.btn_clear_filters": "Clear filters",
    "user_mgmt.btn_refresh": "Refresh",
    "user_mgmt.no_departments": "No departments to display",
    "user_mgmt.label_department": "Department",
    "user_mgmt.label_current_hod": "Current Head of Department",
    "user_mgmt.unassigned": "Unassigned",
    "user_mgmt.btn_reassign": "Reassign",
    "user_mgmt.btn_assign": "Assign",
    "user_mgmt.modal_title_assign_hod": "Assign Head of Department",
    "user_mgmt.modal_label_department": "Department",
    "user_mgmt.modal_select_hod": "Select head of department",
    "user_mgmt.modal_no_managers":
      "No Training Manager found in this department",
    "user_mgmt.msg_success": "Updated successfully",
    "user_mgmt.msg_select_hod": "Please select a head of department",
    "user_mgmt.msg_failed": "Failed to update head of department",
    "user_mgmt.msg_fetch_failed": "Failed to fetch data",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
  },
}

export const t = (key: string, language: Language): string => {
  return translations[language]?.[key] || key
}
