/**
 * Mapping tất cả Server Actions với permissions yêu cầu
 * Sử dụng file này tham khảo khi cập nhật permission checks trong action files
 */

import { Permission } from "@/enum/permission.enum"

export const ACTION_PERMISSION_MAPPING = {
  // ============ AI SUGGESTION ACTIONS ============
  "ai-suggestion": {
    analyzeQATopics: Permission.VIEW_STATISTICS,
    getTopQATopic: Permission.VIEW_STATISTICS,
    createAISuggestion: Permission.MANAGE_SYSTEM,
    approveSuggestion: Permission.MANAGE_SYSTEM,
    dismissSuggestion: Permission.MANAGE_SYSTEM,
    getLatestSuggestion: null, // Read-only, no check needed
  },

  // ============ ARTICLES ACTIONS ============
  articles: {
    getCurrentUserDetail: null, // Public, just needs auth
    getAllArticles: Permission.VIEW_ARTICLE_LIST,
    filterByTag: Permission.SEARCH_ARTICLE,
    filterByTagAndCategory: Permission.SEARCH_ARTICLE,
    deleteArticle: Permission.DELETE_ARTICLE,
    restoreArticle: Permission.DELETE_ARTICLE, // Same permission to restore
    approveArticle: Permission.APPROVE_ARTICLE,
    rejectArticle: Permission.APPROVE_ARTICLE,
    resubmitArticle: Permission.CREATE_ARTICLE,
    createArticle: Permission.CREATE_ARTICLE,
    getArticleById: Permission.READ_ARTICLE,
    updateArticle: Permission.UPDATE_ARTICLE,
    getTopAuthors: Permission.VIEW_ARTICLE_LIST,
    getPublishedArticles: Permission.READ_ARTICLE,
  },

  // ============ AUTHENTICATION ACTIONS ============
  auth: {
    loginAction: Permission.LOGIN,
    logoutAction: Permission.LOGOUT,
    forgotPasswordAction: null, // Public
  },

  // ============ CATEGORIES ACTIONS ============
  categories: {
    getAllCategories: Permission.VIEW_CATEGORY_LIST,
    getCategoryById: Permission.VIEW_CATEGORY_LIST,
    createCategory: Permission.CREATE_CATEGORY,
    updateCategory: Permission.UPDATE_CATEGORY,
    deleteCategory: Permission.DELETE_CATEGORY,
    restoreCategory: Permission.DELETE_CATEGORY,
  },

  // ============ CHAT ACTIONS ============
  chat: {
    createNewConversation: null, // Users can create their own chats
    getConversationDetails: null,
    getMyConversations: null,
    updateConvTitle: null,
  },

  // ============ COMMENTS ACTIONS ============
  comments: {
    getComments: Permission.READ_ARTICLE,
    createComment: Permission.COMMENT_ARTICLE,
    updateComment: Permission.EDIT_ARTICLE_COMMENT,
    deleteComment: Permission.DELETE_ARTICLE_COMMENT,
  },

  // ============ COURSES ACTIONS ============
  courses: {
    getCategoriesAPI: Permission.VIEW_COURSE_LIST,
    getAllCourses: Permission.VIEW_COURSE_LIST,
    getCourseById: Permission.READ_COURSE,
    getCourseManagementAccess: null, // Check logic inside
    deleteCourseAPI: Permission.DELETE_COURSE,
    createCourseAPI: Permission.CREATE_COURSE,
    updateCourseAPI: Permission.UPDATE_COURSE,
    approveCourse: Permission.APPROVE_COURSE,
    rejectCourseAction: Permission.APPROVE_COURSE,
    updateCourseAction: Permission.UPDATE_COURSE,
  },

  // ============ DEPARTMENT ACTIONS ============
  department: {
    getAllDepartments: null, // Public info
    getDepartmentsWithHeads: null,
    assignHeadOfDepartment: Permission.MANAGE_SYSTEM,
    getEligibleHeadsForDepartment: Permission.MANAGE_SYSTEM,
  },

  // ============ ENROLLMENT ACTIONS ============
  enrollment: {
    enrollCourseAction: Permission.ENROLL_COURSE,
    checkEnrollmentStatus: Permission.ENROLL_COURSE,
    getEnrollmentOverview: Permission.VIEW_COURSE_STATISTICS,
    getCourseLearnerEnrollments: Permission.VIEW_COURSE_STATISTICS,
    getCourseLearnerEnrollmentDetail: Permission.VIEW_COURSE_STATISTICS,
  },

  // ============ METRICS ACTIONS ============
  metrics: {
    getActiveUsersMetrics: Permission.VIEW_STATISTICS,
    getAdoptionRateMetrics: Permission.VIEW_STATISTICS,
    getCourseCompletionRateMetrics: Permission.VIEW_STATISTICS,
    getTopCategoriesMetrics: Permission.VIEW_STATISTICS,
    getContentRatingMetrics: Permission.VIEW_STATISTICS,
    getCurrentAverageRatingAction: Permission.VIEW_STATISTICS,
    getKnowledgeGapMetrics: Permission.VIEW_STATISTICS,
    getTrendingKeywordsMetrics: Permission.VIEW_STATISTICS,
    getCourseDropoffRateMetrics: Permission.VIEW_STATISTICS,
    getUnansweredQuestionsMetrics: Permission.VIEW_STATISTICS,
    getTopContributorsMetrics: Permission.VIEW_STATISTICS,
    getTopLearnersMetrics: Permission.VIEW_STATISTICS,
    getQuestionBankHealthMetrics: Permission.VIEW_STATISTICS,
    getPendingItemsMetrics: Permission.VIEW_STATISTICS,
    getNewUsersGrowthMetrics: Permission.VIEW_STATISTICS,
    getMandatoryCoursesMetrics: Permission.VIEW_STATISTICS,
    getPersonalLearningProgressMetrics: Permission.VIEW_PERSONAL_PROGRESS,
    getContributionStatsMetrics: Permission.VIEW_STATISTICS,
  },

  // ============ NOTIFICATIONS ACTIONS ============
  notifications: {
    // Add notification action permissions as needed
  },

  // ============ PROGRESS ACTIONS ============
  progress: {
    getPersonalHistory: Permission.VIEW_PERSONAL_PROGRESS,
    updateProgress: Permission.VIEW_PERSONAL_PROGRESS,
    checkItemCompletion: Permission.VIEW_PERSONAL_PROGRESS,
  },

  // ============ DOCUMENTS ACTIONS ============
  documents: {
    fetchCategories: Permission.VIEW_DOCUMENT,
    createCategory: Permission.CREATE_DOCUMENT,
    fetchDocuments: Permission.VIEW_DOCUMENT,
    getDocumentById: Permission.VIEW_DOCUMENT,
    saveDocument: [Permission.CREATE_DOCUMENT, Permission.UPDATE_DOCUMENT], // CREATE for new, UPDATE for existing
    updateDocumentStatus: Permission.UPDATE_DOCUMENT,
    deleteDocument: Permission.DELETE_DOCUMENT,
  },

  // ============ QUESTION ACTIONS ============
  question: {
    getAllQuestions: Permission.VIEW_QUESTION_LIST,
    getQuestionById: Permission.READ_QUESTION,
    createQuestion: Permission.CREATE_QUESTION,
    updateQuestion: Permission.UPDATE_QUESTION,
    deleteQuestion: Permission.DELETE_QUESTION,
  },

  // ============ QUESTION BANK ACTIONS ============
  "question-bank": {
    // Add question bank action permissions as needed
  },

  // ============ QUIZ ACTIONS ============
  quiz: {
    getAllQuizzes: Permission.VIEW_QUIZ_LIST,
    getQuizById: Permission.VIEW_QUIZ,
    getQuizByCurriculumItemId: Permission.VIEW_QUIZ,
    getAttemptHistoryForCurriculumItem: Permission.VIEW_QUIZ_RESULT,
    createQuiz: Permission.CREATE_QUIZ,
    updateQuiz: Permission.UPDATE_QUIZ,
    deleteQuiz: Permission.DELETE_QUIZ,
    getQuizQuestions: Permission.VIEW_QUIZ_QUESTION,
    updateQuizQuestions: Permission.EDIT_QUIZ_QUESTION,
    updateQuizMetadata: Permission.UPDATE_QUIZ,
    startQuizAttempt: Permission.PARTICIPATE_QUIZ,
    getInProgressAttemptForCurriculumItem: Permission.PARTICIPATE_QUIZ,
    submitQuizAttempt: Permission.PARTICIPATE_QUIZ,
    getQuestionsForAttempt: Permission.PARTICIPATE_QUIZ,
    getSavedAnswers: Permission.PARTICIPATE_QUIZ,
    getAttemptMeta: Permission.PARTICIPATE_QUIZ,
    getAttemptRouteInfo: Permission.PARTICIPATE_QUIZ,
    getTimeLimitForAttempt: Permission.PARTICIPATE_QUIZ,
  },

  // ============ REVIEWS ACTIONS ============
  reviews: {
    // Add review action permissions as needed
  },

  // ============ ROLE-PERMISSIONS ACTIONS ============
  "role-permissions": {
    getAllRoles: Permission.VIEW_ROLE_PERMISSION,
    getRolePermissions: Permission.VIEW_ROLE_PERMISSION,
    updateRolePermissions: Permission.EDIT_ROLE_PERMISSION,
  },

  // ============ USER ACTIONS ============
  user: {
    getProfileAction: null, // Users view their own profile
    updateProfileAction: Permission.UPDATE_ACCOUNT,
    updatePasswordAction: Permission.UPDATE_ACCOUNT,
    createUser: Permission.CREATE_ACCOUNT,
    getAllUsers: Permission.MANAGE_USERS,
    updateUser: Permission.MANAGE_USERS,
    deactivateUser: Permission.DEACTIVATE_ACCOUNT,
    searchUsers: Permission.SEARCH_ACCOUNT,
  },
}

/**
 * Helper function to get permission for an action
 * @param module Module name (e.g., "articles", "courses")
 * @param action Action function name (e.g., "createArticle")
 * @returns Permission required or null if no check needed
 */
export function getActionPermission(
  module: string,
  action: string
): Permission | null {
  const moduleMap =
    ACTION_PERMISSION_MAPPING[module as keyof typeof ACTION_PERMISSION_MAPPING]
  if (!moduleMap) return null

  return moduleMap[action as keyof typeof moduleMap] || null
}
