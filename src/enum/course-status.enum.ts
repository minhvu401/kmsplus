// Course Status Enum
export type CourseStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "rejected"

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  published: "Published",
  rejected: "Rejected",
}
