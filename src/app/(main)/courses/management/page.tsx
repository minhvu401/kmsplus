import { getAllCourses, getCategoriesAPI } from "@/action/courses/courseAction"
import ManageCoursesClient from "../components/ManageCoursesClient"
import { getAllQuizzes } from "@/action/quiz/quizActions"
import { getAllLessonsAction } from "@/service/lesson.service"
import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ManagerCoursesPage({ searchParams }: Props) {
  // Lấy thông tin user đang đăng nhập
  const user = await requireAuth()
  const userId = Number(user.id)

  const roleRows = await sql`
    SELECT LOWER(r.name) AS name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${userId}
  `

  const roleNames = roleRows.map((row: any) => String(row.name || ""))
  const isContributorOrEmployee = roleNames.some(
    (role) => role.includes("contributor") || role.includes("employee")
  )
  const hasManagementRole = roleNames.some(
    (role) =>
      role.includes("admin") ||
      role.includes("director") ||
      role.includes("head of department") ||
      role.includes("training manager")
  )

  if (isContributorOrEmployee && !hasManagementRole) {
    redirect("/courses?flash=management-access-denied")
  }

  const params = await searchParams
  const page = Number(params?.page || "1") || 1
  const query = Array.isArray(params?.query)
    ? params?.query[0]
    : (params?.query as string) || ""

  // Handle multiple categories
  const categoriesParam = params?.category
  const selectedCategories = Array.isArray(categoriesParam)
    ? categoriesParam
    : categoriesParam
      ? [categoriesParam as string]
      : []

  // ✅ ĐLCS THÊM: Extract status filter from URL
  const status = Array.isArray(params?.status)
    ? params?.status[0]
    : (params?.status as string) || "All"

  // Extract sort order from URL and apply on server (before pagination)
  const sortOrderParam = Array.isArray(params?.sort)
    ? params?.sort[0]
    : (params?.sort as string) || "newest"
  const sortOrder = sortOrderParam === "oldest" ? "oldest" : "newest"

  const limit = 10

  // 1. Fetch dữ liệu song song
  const [coursesData, lessonsRes, quizzesRes, categoriesRes] =
    await Promise.all([
      getAllCourses({
        query,
        page,
        limit,
        categories: selectedCategories,
        status,
        sort: sortOrder,
      }),
      getAllLessonsAction(),
      getAllQuizzes({}),
      getCategoriesAPI(),
    ])

  // 2. Trích xuất mảng courses
  const {
    courses = [],
    totalCount = 0,
    isHeadOfDepartmentView = false,
    currentUserId = null,
  } = coursesData || {}

  // Trích xuất categories hợp lệ (đã được lọc theo phòng ban ở API)
  const categories = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes as any)?.data || []

  // ✅ LẤY DANH SÁCH ID DANH MỤC ĐƯỢC PHÉP XEM CỦA PHÒNG BAN NÀY
  const allowedCategoryIds = categories.map((c: any) => Number(c.id))
  const isAdmin = user.role?.toLowerCase().includes("admin")

  // 👇 LOGIC AN TOÀN: Ép mảng VÀ LỌC THEO PHÒNG BAN
  const rawLessons = Array.isArray(lessonsRes)
    ? lessonsRes
    : (lessonsRes as any)?.data || []
  const safeLessons = rawLessons.filter((l: any) => {
    if (isAdmin) return true // Admin thấy hết
    // Chỉ lấy bài học thuộc các Category của phòng ban này
    return l.category_id && allowedCategoryIds.includes(Number(l.category_id))
  })

  const rawQuizzes = Array.isArray(quizzesRes)
    ? quizzesRes
    : (quizzesRes as any)?.data || (quizzesRes as any)?.quizzes || []
  const safeQuizzes = rawQuizzes.filter((q: any) => {
    if (isAdmin) return true
    return q.category_id && allowedCategoryIds.includes(Number(q.category_id))
  })

  return (
    <main className="p-8 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <ManageCoursesClient
          courses={courses}
          totalCount={totalCount}
          currentUserId={currentUserId}
          enforceCreatorOnlyEdit={isHeadOfDepartmentView}
          query={query}
          page={page}
          selectedCategories={selectedCategories}
          categories={categories}
          availableLessons={safeLessons}
          availableQuizzes={safeQuizzes}
          userRole={user.role} // ✅ Đảm bảo truyền role vào đây
        />
      </div>
    </main>
  )
}
