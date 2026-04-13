import { Permission } from "@/enum/permission.enum"

/**
 * Map các Server Actions với Permission yêu cầu
 * Format: 'action-name' -> Permission | Permission[]
 */
export const actionPermissionMap: Record<string, Permission | Permission[]> = {
  // Articles
  "articles.getAllArticles": Permission.VIEW_ARTICLE_LIST,
  "articles.filterByTag": Permission.VIEW_ARTICLE_LIST,
  "articles.getAllTags": Permission.VIEW_ARTICLE_LIST,
  "articles.createArticle": Permission.CREATE_ARTICLE,
  "articles.deleteArticle": Permission.DELETE_ARTICLE,
  "articles.getArticleById": Permission.READ_ARTICLE,
  "articles.updateArticle": Permission.UPDATE_ARTICLE,
  "articles.approveArticle": Permission.APPROVE_ARTICLE,
  "articles.rejectArticle": Permission.APPROVE_ARTICLE,
  "articles.resubmitArticle": Permission.UPDATE_ARTICLE,
  "articles.getPublishedArticles": Permission.READ_ARTICLE,

  // Questions
  "question.createQuestion": Permission.CREATE_QUESTION,
  "question.updateQuestion": Permission.UPDATE_QUESTION,
  "question.deleteQuestion": Permission.DELETE_QUESTION,
  "question.getAllQuestions": Permission.VIEW_QUESTION_LIST,
  "question.getQuestionById": Permission.READ_QUESTION,
  "question.searchQuestions": Permission.SEARCH_QUESTION,
  "question.openQuestion": Permission.OPEN_QUESTION,
  "question.closeQuestion": Permission.CLOSE_QUESTION,

  // Answers
  "question.createAnswer": Permission.CREATE_ANSWER,
  "question.updateAnswer": Permission.EDIT_ANSWER,
  "question.deleteAnswer": Permission.DELETE_ANSWER,

  // Courses
  "courses.createCourse": Permission.CREATE_COURSE,
  "courses.updateCourse": Permission.UPDATE_COURSE,
  "courses.deleteCourse": Permission.DELETE_COURSE,
  "courses.getCourseList": Permission.VIEW_COURSE_LIST,
  "courses.getCourseById": Permission.READ_COURSE,
  "courses.searchCourses": Permission.SEARCH_COURSE,
  "courses.approveCourse": Permission.APPROVE_COURSE,
  "courses.enrollCourse": Permission.ENROLL_COURSE,
  "courses.reviewCourse": Permission.REVIEW_COURSE,

  // Quizzes
  "quiz.createQuiz": Permission.CREATE_QUIZ,
  "quiz.updateQuiz": Permission.UPDATE_QUIZ,
  "quiz.deleteQuiz": Permission.DELETE_QUIZ,
  "quiz.getQuizList": Permission.VIEW_QUIZ_LIST,
  "quiz.getQuizById": Permission.VIEW_QUIZ,
  "quiz.createQuizQuestion": Permission.CREATE_QUIZ_QUESTION,
  "quiz.editQuizQuestion": Permission.EDIT_QUIZ_QUESTION,
  "quiz.deleteQuizQuestion": Permission.DELETE_QUIZ_QUESTION,
  "quiz.participateQuiz": Permission.PARTICIPATE_QUIZ,
  "quiz.viewQuizResult": Permission.VIEW_QUIZ_RESULT,

  // Categories
  "categories.createCategory": Permission.CREATE_CATEGORY,
  "categories.updateCategory": Permission.UPDATE_CATEGORY,
  "categories.deleteCategory": Permission.DELETE_CATEGORY,
  "categories.getCategoryList": Permission.VIEW_CATEGORY_LIST,
  "categories.searchCategories": Permission.SEARCH_CATEGORY,

  // User Management
  "user.createUser": Permission.CREATE_ACCOUNT,
  "user.updateUser": Permission.UPDATE_ACCOUNT,
  "user.deleteUser": Permission.DEACTIVATE_ACCOUNT,
  "user.getUserList": Permission.VIEW_ACCOUNT_LIST,
  "user.searchUsers": Permission.SEARCH_ACCOUNT,
  "user.manageUsers": Permission.MANAGE_USERS,

  // System
  "system.exportData": Permission.EXPORT_DATA,
  "system.viewStatistics": Permission.VIEW_STATISTICS,
  "system.monitorActivity": Permission.MONITOR_ACTIVITY,
}

/**
 * Helper function để lấy required permission cho action
 */
export function getActionPermission(
  actionName: string
): Permission | Permission[] | null {
  return actionPermissionMap[actionName] || null
}

/**
 * Helper function để check nếu action cần permission
 */
export function actionRequiresPermission(actionName: string): boolean {
  return !!actionPermissionMap[actionName]
}
