// @/src/service/enrollment.service.ts
import { sql } from "@/lib/database"

export type CourseLearnerEnrollment = {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  enrollmentDate: string
  progress: number
  status: "Not Started" | "In Progress" | "Completed"
}

export type CourseLearnerEnrollmentDetail = {
  userId: string
  courseId: number
  courseName: string
  name: string
  email: string
  avatar: string
  department: string
  enrollmentDate: string
  progress: number
  status: "Not Started" | "In Progress" | "Completed"
  completedAt: string | null
  completedItems: number
  totalItems: number
  sections: Array<{
    id: number
    title: string
    order: number
    items: Array<{
      id: number
      type: "video" | "text" | "quiz"
      title: string
      status: "Not Started" | "Completed" | "Failed"
      highestQuizScore?: number | null
    }>
  }>
}

type GetCourseLearnerEnrollmentsParams = {
  courseId: number
  query?: string
  status?: string
  department?: string
  sort?: string
  page?: number
  limit?: number
}

type GetCourseLearnerEnrollmentDetailParams = {
  courseId: number
  userId: number
}

export async function getEnrollmentOverviewService(courseId?: number) {
  try {
    const courses = await sql`
      SELECT id, title, status
      FROM courses
      WHERE status = 'published'
      ORDER BY created_at DESC
    `

    const targetId = courseId || (courses.length > 0 ? Number(courses[0].id) : null)

    if (!targetId) {
      return {
        success: true,
        courses: [],
        stats: null,
        chart: [],
        activity: [],
      }
    }

    const statsRes = await sql`
      WITH latest_enrollments AS (
        SELECT DISTINCT ON (e.user_id)
          e.user_id,
          e.status,
          e.progress_percentage,
          e.enrolled_at
        FROM enrollments e
        WHERE e.course_id = ${targetId}
        ORDER BY e.user_id, e.enrolled_at DESC, e.id DESC
      )
      SELECT
        COUNT(*)::int AS total_enrollments,
        COALESCE(ROUND(AVG(progress_percentage)), 0)::int AS avg_progress,
        COALESCE(
          ROUND(
            (
              COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric
              / NULLIF(COUNT(*), 0)
            ) * 100
          ),
          0
        )::int AS completion_rate,
        COUNT(CASE WHEN enrolled_at >= date_trunc('month', CURRENT_DATE) THEN 1 END)::int AS this_month,
        COUNT(
          CASE
            WHEN enrolled_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
             AND enrolled_at < date_trunc('month', CURRENT_DATE)
            THEN 1
          END
        )::int AS last_month
      FROM latest_enrollments
    `

    const stats = statsRes[0]
    const thisMonth = Number(stats?.this_month) || 0
    const lastMonth = Number(stats?.last_month) || 0
    const growth =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0
          ? 100
          : 0

    const targetCourse = courses.find((course) => Number(course.id) === targetId)

    return {
      success: true,
      courses,
      stats: {
        id: targetId,
        name: targetCourse?.title || "Unknown",
        totalEnrollments: Number(stats?.total_enrollments) || 0,
        avgProgress: Number(stats?.avg_progress) || 0,
        completionRate: Number(stats?.completion_rate) || 0,
        growth,
        completionGrowth: 0,
      },
      chart: [],
      activity: [],
    }
  } catch (error) {
    console.error("Service Error - getEnrollmentOverview:", error)
    return { success: false, error: "Database error" }
  }
}

export async function getCourseLearnerEnrollmentsService({
  courseId,
  query = "",
  status = "any",
  department = "any",
  sort = "name-asc",
  page = 1,
  limit = 10,
}: GetCourseLearnerEnrollmentsParams) {
  try {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
    const offset = (safePage - 1) * safeLimit
    const normalizedQuery = query.trim()

    const whereQuery = normalizedQuery
      ? sql`
          AND (
            COALESCE(u.full_name, '') ILIKE ${"%" + normalizedQuery + "%"}
            OR COALESCE(u.email, '') ILIKE ${"%" + normalizedQuery + "%"}
          )
        `
      : sql``

    const whereStatus =
      status && status !== "any"
        ? sql`
            AND (
              CASE
                WHEN le.status = 'completed' OR COALESCE(le.progress_percentage, 0) >= 100 THEN 'Completed'
                WHEN COALESCE(le.progress_percentage, 0) > 0 THEN 'In Progress'
                ELSE 'Not Started'
              END
            ) = ${status}
          `
        : sql``

    const whereDepartment =
      department && department !== "any"
        ? sql`AND COALESCE(d.name, 'Unknown') = ${department}`
        : sql``

    const rows = await sql`
      WITH latest_enrollments AS (
        SELECT DISTINCT ON (e.user_id)
          e.id,
          e.user_id,
          e.status,
          e.progress_percentage,
          e.enrolled_at
        FROM enrollments e
        WHERE e.course_id = ${courseId}
        ORDER BY e.user_id, e.enrolled_at DESC, e.id DESC
      )
      SELECT
        le.user_id::text as id,
        COALESCE(u.full_name, u.email, 'Learner #' || le.user_id::text) as name,
        COALESCE(u.email, '') as email,
        COALESCE(u.avatar_url, '') as avatar,
        COALESCE(d.name, 'Unknown') as department,
        le.enrolled_at as enrollment_date,
        COALESCE(le.progress_percentage, 0)::int as progress,
        CASE
          WHEN le.status = 'completed' OR COALESCE(le.progress_percentage, 0) >= 100 THEN 'Completed'
          WHEN COALESCE(le.progress_percentage, 0) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END as course_status
      FROM latest_enrollments le
      LEFT JOIN users u ON u.id = le.user_id
      LEFT JOIN department d ON d.id = u.department_id
      WHERE 1 = 1
        ${whereQuery}
        ${whereStatus}
        ${whereDepartment}
      ORDER BY
        CASE WHEN ${sort} = 'name-asc' THEN COALESCE(u.full_name, u.email, 'Unknown') END ASC,
        CASE WHEN ${sort} = 'progress-desc' THEN COALESCE(le.progress_percentage, 0) END DESC,
        CASE WHEN ${sort} = 'enrollment-date-asc' THEN le.enrolled_at END ASC,
        CASE WHEN ${sort} = 'enrollment-date-desc' THEN le.enrolled_at END DESC,
        COALESCE(u.full_name, u.email, 'Unknown') ASC
      LIMIT ${safeLimit}
      OFFSET ${offset}
    `

    const totalResult = await sql`
      WITH latest_enrollments AS (
        SELECT DISTINCT ON (e.user_id)
          e.user_id,
          e.status,
          e.progress_percentage,
          e.enrolled_at
        FROM enrollments e
        WHERE e.course_id = ${courseId}
        ORDER BY e.user_id, e.enrolled_at DESC, e.id DESC
      )
      SELECT COUNT(*)::int as total
      FROM latest_enrollments le
      LEFT JOIN users u ON u.id = le.user_id
      LEFT JOIN department d ON d.id = u.department_id
      WHERE 1 = 1
        ${whereQuery}
        ${whereStatus}
        ${whereDepartment}
    `

    const departmentsResult = await sql`
      WITH latest_enrollments AS (
        SELECT DISTINCT ON (e.user_id)
          e.user_id
        FROM enrollments e
        WHERE e.course_id = ${courseId}
        ORDER BY e.user_id, e.enrolled_at DESC, e.id DESC
      )
      SELECT DISTINCT COALESCE(d.name, 'Unknown') as department
      FROM latest_enrollments le
      LEFT JOIN users u ON u.id = le.user_id
      LEFT JOIN department d ON d.id = u.department_id
      ORDER BY COALESCE(d.name, 'Unknown') ASC
    `

    const learners: CourseLearnerEnrollment[] = (rows as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar || "",
      department: row.department,
      enrollmentDate:
        row.enrollment_date instanceof Date
          ? row.enrollment_date.toISOString()
          : String(row.enrollment_date),
      progress: Number(row.progress) || 0,
      status: row.course_status,
    }))

    return {
      success: true,
      learners,
      totalItems: Number(totalResult?.[0]?.total) || 0,
      departments: (departmentsResult as any[]).map((row) => row.department),
      page: safePage,
      limit: safeLimit,
    }
  } catch (error) {
    console.error("Service Error - getCourseLearnerEnrollments:", error)
    return {
      success: false,
      learners: [],
      totalItems: 0,
      departments: [],
      page,
      limit,
      error: "Database error",
    }
  }
}

export async function getCourseLearnerEnrollmentDetailService({
  courseId,
  userId,
}: GetCourseLearnerEnrollmentDetailParams) {
  try {
    const rows = await sql`
      SELECT
        e.user_id::text AS user_id,
        e.course_id::int AS course_id,
        COALESCE(c.title, 'Unknown Course') AS course_name,
        COALESCE(u.full_name, u.email, 'Learner #' || e.user_id::text) AS name,
        COALESCE(u.email, '') AS email,
        COALESCE(u.avatar_url, '') AS avatar,
        COALESCE(d.name, 'Unknown') AS department,
        e.enrolled_at AS enrollment_date,
        COALESCE(e.progress_percentage, 0)::int AS progress,
        CASE
          WHEN e.status = 'completed' OR COALESCE(e.progress_percentage, 0) >= 100 THEN 'Completed'
          WHEN COALESCE(e.progress_percentage, 0) > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END AS course_status,
        e.completed_at AS completed_at,
        e.completed_item_ids AS completed_item_ids,
        (
          SELECT COUNT(*)::int
          FROM curriculum_items ci
          JOIN sections s ON s.id = ci.section_id
          WHERE s.course_id = e.course_id
        ) AS total_items
      FROM enrollments e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN department d ON d.id = u.department_id
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.course_id = ${courseId} AND e.user_id = ${userId}
      ORDER BY e.enrolled_at DESC, e.id DESC
      LIMIT 1
    `

    if (!rows.length) {
      return {
        success: false,
        error: "Learner enrollment not found",
      }
    }

    const row = rows[0] as any
  const rawCompletedIds = row.completed_item_ids
    let completedItems = 0
    let completedItemIds: number[] = []

    if (Array.isArray(rawCompletedIds)) {
      completedItemIds = rawCompletedIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
      completedItems = completedItemIds.length
    } else if (typeof rawCompletedIds === "string") {
      try {
        const parsed = JSON.parse(rawCompletedIds)
        if (Array.isArray(parsed)) {
          completedItemIds = parsed
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id))
          completedItems = completedItemIds.length
        }
      } catch {
        completedItems = 0
      }
    }

    const completedItemSet = new Set(completedItemIds)

    const curriculumRows = await sql`
      SELECT
        s.id AS section_id,
        s.title AS section_title,
        s."order" AS section_order,
        ci.id AS item_id,
        ci.type AS item_kind,
        ci."order" AS item_order,
        ci.lesson_id AS lesson_id,
        ci.quiz_id AS quiz_id,
        l.title AS lesson_title,
        l.type AS lesson_type,
        q.title AS quiz_title,
        q.passing_score AS quiz_passing_score,
        (
          SELECT MAX(qa.score)
          FROM quiz_attempts qa
          WHERE qa.user_id = ${userId}
            AND qa.curriculum_item_id = ci.id
            AND qa.status = 'submitted'
        ) AS highest_quiz_score,
        (
          SELECT COUNT(*)::int
          FROM quiz_attempts qa
          WHERE qa.user_id = ${userId}
            AND qa.curriculum_item_id = ci.id
            AND qa.status = 'submitted'
        ) AS submitted_attempt_count
      FROM sections s
      LEFT JOIN curriculum_items ci ON ci.section_id = s.id
      LEFT JOIN lessons l ON l.id = ci.lesson_id
      LEFT JOIN quizzes q ON q.id = ci.quiz_id
      WHERE s.course_id = ${courseId}
      ORDER BY s."order" ASC, ci."order" ASC
    `

    const sectionMap = new Map<
      number,
      {
        id: number
        title: string
        order: number
        items: Array<{
          id: number
          type: "video" | "text" | "quiz"
          title: string
          status: "Not Started" | "Completed" | "Failed"
          highestQuizScore?: number | null
        }>
      }
    >()

    for (const row of curriculumRows as any[]) {
      const sectionId = Number(row.section_id)
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          id: sectionId,
          title: row.section_title || `Section #${sectionId}`,
          order: Number(row.section_order) || 0,
          items: [],
        })
      }

      if (!row.item_id) {
        continue
      }

      const itemId = Number(row.item_id)
      const resolvedType: "video" | "text" | "quiz" =
        row.item_kind === "quiz"
          ? "quiz"
          : String(row.lesson_type || "").toLowerCase() === "video"
            ? "video"
            : "text"

      const highestQuizScore =
        resolvedType === "quiz" && row.highest_quiz_score != null
          ? Number(row.highest_quiz_score)
          : null
      const submittedAttemptCount =
        resolvedType === "quiz" ? Number(row.submitted_attempt_count) || 0 : 0
      const passingScore =
        resolvedType === "quiz" ? Number(row.quiz_passing_score ?? 70) : 70

      const isCompleted = completedItemSet.has(itemId)

      let itemStatus: "Not Started" | "Completed" | "Failed" =
        isCompleted ? "Completed" : "Not Started"

      if (resolvedType === "quiz" && submittedAttemptCount > 0) {
        itemStatus =
          highestQuizScore != null && highestQuizScore >= passingScore
            ? "Completed"
            : "Failed"
      }

      sectionMap.get(sectionId)!.items.push({
        id: itemId,
        type: resolvedType,
        title: row.quiz_title || row.lesson_title || `Item #${itemId}`,
        status: itemStatus,
        highestQuizScore,
      })
    }

    const sections = Array.from(sectionMap.values()).sort(
      (a, b) => a.order - b.order
    )

    const detail: CourseLearnerEnrollmentDetail = {
      userId: String(row.user_id),
      courseId: Number(row.course_id),
      courseName: row.course_name,
      name: row.name,
      email: row.email,
      avatar: row.avatar || "",
      department: row.department,
      enrollmentDate:
        row.enrollment_date instanceof Date
          ? row.enrollment_date.toISOString()
          : String(row.enrollment_date),
      progress: Number(row.progress) || 0,
      status: row.course_status,
      completedAt:
        row.completed_at instanceof Date
          ? row.completed_at.toISOString()
          : row.completed_at
            ? String(row.completed_at)
            : null,
      completedItems,
      totalItems: Number(row.total_items) || 0,
      sections,
    }

    return {
      success: true,
      detail,
    }
  } catch (error) {
    console.error("Service Error - getCourseLearnerEnrollmentDetail:", error)
    return {
      success: false,
      error: "Database error",
    }
  }
}
