export type CourseStatus = "Not Started" | "In Progress" | "Completed"

export type CurriculumItemType = "video" | "text" | "quiz"

export type LearnerCurriculumItemStatus =
  | "Not Started"
  | "Completed"
  | "Failed"

export interface LearnerCurriculumItem {
  id: number
  type: CurriculumItemType
  title: string
  status: LearnerCurriculumItemStatus
  highestQuizScore?: number | null
}

export interface LearnerCurriculumSection {
  id: number
  title: string
  order: number
  items: LearnerCurriculumItem[]
}

export interface LearnerEnrollment {
  key?: string
  id: string
  name: string
  email: string
  avatar: string
  department: string
  enrollmentDate: string
  progress: number
  status: CourseStatus
}

export interface LearnerEnrollmentDetail {
  userId: string
  courseId: number
  courseName: string
  name: string
  email: string
  avatar: string
  department: string
  enrollmentDate: string
  progress: number
  status: CourseStatus
  completedAt: string | null
  completedItems: number
  totalItems: number
  sections: LearnerCurriculumSection[]
}
