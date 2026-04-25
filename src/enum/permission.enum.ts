export enum Permission {
  // Authentication (3)
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  VIEW_PROFILE = "VIEW_PROFILE",

  // Knowledge Articles (10)
  VIEW_ARTICLE_LIST = "VIEW_ARTICLE_LIST",
  SEARCH_ARTICLE = "SEARCH_ARTICLE",
  READ_ARTICLE = "READ_ARTICLE",
  CREATE_ARTICLE = "CREATE_ARTICLE",
  UPDATE_ARTICLE = "UPDATE_ARTICLE",
  DELETE_ARTICLE = "DELETE_ARTICLE",
  COMMENT_ARTICLE = "COMMENT_ARTICLE",
  EDIT_ARTICLE_COMMENT = "EDIT_ARTICLE_COMMENT",
  DELETE_ARTICLE_COMMENT = "DELETE_ARTICLE_COMMENT",
  APPROVE_ARTICLE = "APPROVE_ARTICLE",

  // Questions & Answers (12)
  VIEW_QUESTION_LIST = "VIEW_QUESTION_LIST",
  SEARCH_QUESTION = "SEARCH_QUESTION",
  READ_QUESTION = "READ_QUESTION",
  CREATE_QUESTION = "CREATE_QUESTION",
  UPDATE_QUESTION = "UPDATE_QUESTION",
  DELETE_QUESTION = "DELETE_QUESTION",
  CREATE_ANSWER = "CREATE_ANSWER",
  EDIT_ANSWER = "EDIT_ANSWER",
  DELETE_ANSWER = "DELETE_ANSWER",
  OPEN_QUESTION = "OPEN_QUESTION",
  CLOSE_QUESTION = "CLOSE_QUESTION",
  SHARE_QUESTION = "SHARE_QUESTION",

  // Training Courses (10)
  CREATE_COURSE = "CREATE_COURSE",
  VIEW_COURSE_LIST = "VIEW_COURSE_LIST",
  SEARCH_COURSE = "SEARCH_COURSE",
  READ_COURSE = "READ_COURSE",
  UPDATE_COURSE = "UPDATE_COURSE",
  DELETE_COURSE = "DELETE_COURSE",
  ENROLL_COURSE = "ENROLL_COURSE",
  REVIEW_COURSE = "REVIEW_COURSE",
  APPROVE_COURSE = "APPROVE_COURSE",
  VIEW_COURSE_STATISTICS = "VIEW_COURSE_STATISTICS",

  // Quizzes (11)
  CREATE_QUIZ = "CREATE_QUIZ",
  VIEW_QUIZ = "VIEW_QUIZ",
  UPDATE_QUIZ = "UPDATE_QUIZ",
  DELETE_QUIZ = "DELETE_QUIZ",
  CREATE_QUIZ_QUESTION = "CREATE_QUIZ_QUESTION",
  EDIT_QUIZ_QUESTION = "EDIT_QUIZ_QUESTION",
  DELETE_QUIZ_QUESTION = "DELETE_QUIZ_QUESTION",
  VIEW_QUIZ_QUESTION = "VIEW_QUIZ_QUESTION",
  VIEW_QUIZ_LIST = "VIEW_QUIZ_LIST",
  PARTICIPATE_QUIZ = "PARTICIPATE_QUIZ",
  VIEW_QUIZ_RESULT = "VIEW_QUIZ_RESULT",

  // Enrollment & Progress (3)
  VIEW_QUESTION_BANK = "VIEW_QUESTION_BANK",
  VIEW_PERSONAL_PROGRESS = "VIEW_PERSONAL_PROGRESS",

  // User Management (6)
  CREATE_ACCOUNT = "CREATE_ACCOUNT",
  VIEW_ACCOUNT_LIST = "VIEW_ACCOUNT_LIST",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  DEACTIVATE_ACCOUNT = "DEACTIVATE_ACCOUNT",
  SEARCH_ACCOUNT = "SEARCH_ACCOUNT",
  MANAGE_USERS = "MANAGE_USERS",

  // Categories (5)
  CREATE_CATEGORY = "CREATE_CATEGORY",
  VIEW_CATEGORY_LIST = "VIEW_CATEGORY_LIST",
  UPDATE_CATEGORY = "UPDATE_CATEGORY",
  DELETE_CATEGORY = "DELETE_CATEGORY",
  SEARCH_CATEGORY = "SEARCH_CATEGORY",

  // Documents (4)
  VIEW_DOCUMENT = "VIEW_DOCUMENT",
  CREATE_DOCUMENT = "CREATE_DOCUMENT",
  UPDATE_DOCUMENT = "UPDATE_DOCUMENT",
  DELETE_DOCUMENT = "DELETE_DOCUMENT",

  // System Administration (3)
  MONITOR_ACTIVITY = "MONITOR_ACTIVITY",
  VIEW_STATISTICS = "VIEW_STATISTICS",
  EXPORT_DATA = "EXPORT_DATA",

  // System Settings (7)
  LANGUAGE_SETTING = "LANGUAGE_SETTING",
  VIEW_ROLE_PERMISSION = "VIEW_ROLE_PERMISSION",
  EDIT_ROLE_PERMISSION = "EDIT_ROLE_PERMISSION",
  MODERATE_CONTENT = "MODERATE_CONTENT",
  AI_EXPLANATION = "AI_EXPLANATION",
  AI_RECOMMENDATION = "AI_RECOMMENDATION",
  MANAGE_SYSTEM = "MANAGE_SYSTEM",
}

export const PermissionConfig = {
  // Authentication
  [Permission.LOGIN]: { id: 269, name: "login", label: "Đăng nhập" },
  [Permission.LOGOUT]: { id: 270, name: "logout", label: "Đăng xuất" },
  [Permission.VIEW_PROFILE]: {
    id: 271,
    name: "view_profile",
    label: "Xem hồ sơ",
  },

  // Articles
  [Permission.VIEW_ARTICLE_LIST]: {
    id: 272,
    name: "view_article_list",
    label: "Xem danh sách bài viết",
  },
  [Permission.SEARCH_ARTICLE]: {
    id: 273,
    name: "search_article",
    label: "Tìm kiếm bài viết",
  },
  [Permission.READ_ARTICLE]: {
    id: 274,
    name: "read_article",
    label: "Đọc bài viết",
  },
  [Permission.CREATE_ARTICLE]: {
    id: 275,
    name: "create_article",
    label: "Tạo bài viết",
  },
  [Permission.UPDATE_ARTICLE]: {
    id: 276,
    name: "update_article",
    label: "Cập nhật bài viết",
  },
  [Permission.DELETE_ARTICLE]: {
    id: 277,
    name: "delete_article",
    label: "Xóa bài viết",
  },
  [Permission.COMMENT_ARTICLE]: {
    id: 278,
    name: "comment_article",
    label: "Bình luận bài viết",
  },
  [Permission.EDIT_ARTICLE_COMMENT]: {
    id: 279,
    name: "edit_article_comment",
    label: "Chỉnh sửa bình luận bài viết",
  },
  [Permission.DELETE_ARTICLE_COMMENT]: {
    id: 280,
    name: "delete_article_comment",
    label: "Xóa bình luận bài viết",
  },
  [Permission.APPROVE_ARTICLE]: {
    id: 281,
    name: "approve_article",
    label: "Phê duyệt bài viết",
  },

  // Questions
  [Permission.VIEW_QUESTION_LIST]: {
    id: 282,
    name: "view_question_list",
    label: "Xem danh sách câu hỏi",
  },
  [Permission.SEARCH_QUESTION]: {
    id: 283,
    name: "search_question",
    label: "Tìm kiếm câu hỏi",
  },
  [Permission.READ_QUESTION]: {
    id: 284,
    name: "read_question",
    label: "Đọc câu hỏi",
  },
  [Permission.CREATE_QUESTION]: {
    id: 285,
    name: "create_question",
    label: "Tạo câu hỏi",
  },
  [Permission.UPDATE_QUESTION]: {
    id: 286,
    name: "update_question",
    label: "Cập nhật câu hỏi",
  },
  [Permission.DELETE_QUESTION]: {
    id: 287,
    name: "delete_question",
    label: "Xóa câu hỏi",
  },
  [Permission.CREATE_ANSWER]: {
    id: 288,
    name: "create_answer",
    label: "Tạo câu trả lời",
  },
  [Permission.EDIT_ANSWER]: {
    id: 289,
    name: "edit_answer",
    label: "Chỉnh sửa câu trả lời",
  },
  [Permission.DELETE_ANSWER]: {
    id: 290,
    name: "delete_answer",
    label: "Xóa câu trả lời",
  },
  [Permission.OPEN_QUESTION]: {
    id: 291,
    name: "open_question",
    label: "Mở câu hỏi",
  },
  [Permission.CLOSE_QUESTION]: {
    id: 292,
    name: "close_question",
    label: "Đóng câu hỏi",
  },
  [Permission.SHARE_QUESTION]: {
    id: 293,
    name: "share_question",
    label: "Chia sẻ câu hỏi",
  },

  // Courses
  [Permission.CREATE_COURSE]: {
    id: 294,
    name: "create_course",
    label: "Tạo khóa học",
  },
  [Permission.VIEW_COURSE_LIST]: {
    id: 295,
    name: "view_course_list",
    label: "Xem danh sách khóa học",
  },
  [Permission.SEARCH_COURSE]: {
    id: 296,
    name: "search_course",
    label: "Tìm kiếm khóa học",
  },
  [Permission.READ_COURSE]: {
    id: 297,
    name: "read_course",
    label: "Đọc khóa học",
  },
  [Permission.UPDATE_COURSE]: {
    id: 298,
    name: "update_course",
    label: "Cập nhật khóa học",
  },
  [Permission.DELETE_COURSE]: {
    id: 299,
    name: "delete_course",
    label: "Xóa khóa học",
  },
  [Permission.ENROLL_COURSE]: {
    id: 300,
    name: "enroll_course",
    label: "Đăng ký khóa học",
  },
  [Permission.REVIEW_COURSE]: {
    id: 301,
    name: "review_course",
    label: "Đánh giá khóa học",
  },

  // Quizzes
  [Permission.CREATE_QUIZ]: {
    id: 302,
    name: "create_quiz",
    label: "Tạo bài kiểm tra",
  },
  [Permission.VIEW_QUIZ]: {
    id: 303,
    name: "view_quiz",
    label: "Xem bài kiểm tra",
  },
  [Permission.UPDATE_QUIZ]: {
    id: 304,
    name: "update_quiz",
    label: "Cập nhật bài kiểm tra",
  },
  [Permission.DELETE_QUIZ]: {
    id: 305,
    name: "delete_quiz",
    label: "Xóa bài kiểm tra",
  },
  [Permission.CREATE_QUIZ_QUESTION]: {
    id: 306,
    name: "create_quiz_question",
    label: "Thêm câu hỏi vào bài kiểm tra",
  },
  [Permission.EDIT_QUIZ_QUESTION]: {
    id: 307,
    name: "edit_quiz_question",
    label: "Chỉnh sửa câu hỏi bài kiểm tra",
  },
  [Permission.DELETE_QUIZ_QUESTION]: {
    id: 308,
    name: "delete_quiz_question",
    label: "Xóa câu hỏi bài kiểm tra",
  },
  [Permission.VIEW_QUESTION_BANK]: {
    id: 309,
    name: "view_question_bank",
    label: "Xem ngân hàng câu hỏi",
  },
  [Permission.VIEW_QUIZ_QUESTION]: {
    id: 310,
    name: "view_quiz_question",
    label: "Xem câu hỏi bài kiểm tra",
  },
  [Permission.VIEW_QUIZ_LIST]: {
    id: 311,
    name: "view_quiz_list",
    label: "Xem danh sách bài kiểm tra",
  },
  [Permission.PARTICIPATE_QUIZ]: {
    id: 313,
    name: "participate_quiz",
    label: "Tham gia bài kiểm tra",
  },
  [Permission.VIEW_QUIZ_RESULT]: {
    id: 315,
    name: "view_quiz_result",
    label: "Xem kết quả bài kiểm tra",
  },

  // Enrollment & Progress
  [Permission.VIEW_PERSONAL_PROGRESS]: {
    id: 314,
    name: "view_personal_progress",
    label: "Xem tiến độ cá nhân",
  },

  // User Management
  [Permission.CREATE_ACCOUNT]: {
    id: 317,
    name: "create_account",
    label: "Tạo tài khoản",
  },
  [Permission.VIEW_ACCOUNT_LIST]: {
    id: 318,
    name: "view_account_list",
    label: "Xem danh sách tài khoản",
  },
  [Permission.UPDATE_ACCOUNT]: {
    id: 319,
    name: "update_account",
    label: "Cập nhật tài khoản",
  },
  [Permission.DEACTIVATE_ACCOUNT]: {
    id: 320,
    name: "deactivate_account",
    label: "Vô hiệu hóa tài khoản",
  },
  [Permission.SEARCH_ACCOUNT]: {
    id: 321,
    name: "search_account",
    label: "Tìm kiếm tài khoản",
  },
  [Permission.MANAGE_USERS]: {
    id: 322,
    name: "manage_users",
    label: "Quản lý người dùng",
  },

  // Categories
  [Permission.CREATE_CATEGORY]: {
    id: 326,
    name: "create_category",
    label: "Tạo danh mục",
  },
  [Permission.VIEW_CATEGORY_LIST]: {
    id: 327,
    name: "view_category_list",
    label: "Xem danh sách danh mục",
  },
  [Permission.UPDATE_CATEGORY]: {
    id: 328,
    name: "update_category",
    label: "Cập nhật danh mục",
  },
  [Permission.DELETE_CATEGORY]: {
    id: 329,
    name: "delete_category",
    label: "Xóa danh mục",
  },
  [Permission.SEARCH_CATEGORY]: {
    id: 330,
    name: "search_category",
    label: "Tìm kiếm danh mục",
  },

  // System Administration (3)
  [Permission.MONITOR_ACTIVITY]: {
    id: 323,
    name: "monitor_activity",
    label: "Giám sát hoạt động",
  },
  [Permission.VIEW_STATISTICS]: {
    id: 324,
    name: "view_statistics",
    label: "Xem thống kê",
  },
  [Permission.EXPORT_DATA]: {
    id: 325,
    name: "export_data",
    label: "Xuất dữ liệu",
  },

  // System Settings
  [Permission.LANGUAGE_SETTING]: {
    id: 331,
    name: "language_setting",
    label: "Cài đặt ngôn ngữ",
  },
  [Permission.VIEW_ROLE_PERMISSION]: {
    id: 332,
    name: "view_role_permission",
    label: "Xem quyền vai trò",
  },
  [Permission.EDIT_ROLE_PERMISSION]: {
    id: 333,
    name: "edit_role_permission",
    label: "Chỉnh sửa quyền vai trò",
  },
  [Permission.MODERATE_CONTENT]: {
    id: 334,
    name: "moderate_content",
    label: "Kiểm duyệt nội dung",
  },
  [Permission.AI_RECOMMENDATION]: {
    id: 335,
    name: "ai_recommendation",
    label: "Gợi ý AI",
  },
  [Permission.AI_EXPLANATION]: {
    id: 336,
    name: "ai_explanation",
    label: "Giải thích AI",
  },
  [Permission.MANAGE_SYSTEM]: {
    id: 337,
    name: "manage_system",
    label: "Quản lý hệ thống",
  },

  // Documents (4)
  [Permission.VIEW_DOCUMENT]: {
    id: 343,
    name: "view_document",
    label: "Xem tài liệu",
  },
  [Permission.CREATE_DOCUMENT]: {
    id: 344,
    name: "create_document",
    label: "Tạo tài liệu",
  },
  [Permission.UPDATE_DOCUMENT]: {
    id: 345,
    name: "update_document",
    label: "Cập nhật tài liệu",
  },
  [Permission.DELETE_DOCUMENT]: {
    id: 346,
    name: "delete_document",
    label: "Xóa tài liệu",
  },
} as const
