export enum Permission {
  READ_ARTICLE = "READ_ARTICLE",
  CREATE_ARTICLE = "CREATE_ARTICLE",
  UPDATE_ARTICLE = "UPDATE_ARTICLE",
  DELETE_ARTICLE = "DELETE_ARTICLE",
  APPROVE_ARTICLE = "APPROVE_ARTICLE",
  READ_QUESTION = "READ_QUESTION",
  CREATE_QUESTION = "CREATE_QUESTION",
  UPDATE_QUESTION = "UPDATE_QUESTION",
  DELETE_QUESTION = "DELETE_QUESTION",
  CREATE_ANSWER = "CREATE_ANSWER",
  VOTE_ANSWER = "VOTE_ANSWER",
  READ_COURSE = "READ_COURSE",
  CREATE_COURSE = "CREATE_COURSE",
  ENROLL_COURSE = "ENROLL_COURSE",
  MANAGE_USERS = "MANAGE_USERS",
}

export const PermissionConfig = {
  [Permission.READ_ARTICLE]: {
    id: 1,
    name: "read_article",
    label: "Đọc bài viết",
  },
  [Permission.CREATE_ARTICLE]: {
    id: 2,
    name: "create_article",
    label: "Tạo bài viết",
  },
  [Permission.UPDATE_ARTICLE]: {
    id: 3,
    name: "update_article",
    label: "Cập nhật bài viết",
  },
  [Permission.DELETE_ARTICLE]: {
    id: 4,
    name: "delete_article",
    label: "Xóa bài viết",
  },
  [Permission.APPROVE_ARTICLE]: {
    id: 5,
    name: "approve_article",
    label: "Phê duyệt bài viết",
  },
  [Permission.READ_QUESTION]: {
    id: 6,
    name: "read_question",
    label: "Đọc câu hỏi",
  },
  [Permission.CREATE_QUESTION]: {
    id: 7,
    name: "create_question",
    label: "Tạo câu hỏi",
  },
  [Permission.UPDATE_QUESTION]: {
    id: 8,
    name: "update_question",
    label: "Cập nhật câu hỏi",
  },
  [Permission.DELETE_QUESTION]: {
    id: 9,
    name: "delete_question",
    label: "Xóa câu hỏi",
  },
  [Permission.CREATE_ANSWER]: {
    id: 10,
    name: "create_answer",
    label: "Tạo câu trả lời",
  },
  // [Permission.VOTE_ANSWER]: {
  //   id: 11,
  //   name: "vote_answer",
  //   label: "Bình chọn câu trả lời",
  // },
  [Permission.READ_COURSE]: {
    id: 12,
    name: "read_course",
    label: "Đọc khóa học",
  },
  [Permission.CREATE_COURSE]: {
    id: 13,
    name: "create_course",
    label: "Tạo khóa học",
  },
  [Permission.ENROLL_COURSE]: {
    id: 14,
    name: "enroll_course",
    label: "Đăng ký khóa học",
  },
  [Permission.MANAGE_USERS]: {
    id: 15,
    name: "manage_users",
    label: "Quản lý người dùng",
  },
} as const
