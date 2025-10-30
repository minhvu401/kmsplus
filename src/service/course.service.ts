/*
================================================================================
|
|   src/service/course.service.ts (ĐÃ CẬP NHẬT VÀ BÌNH LUẬN)
|
|   Đây là file service, chịu trách nhiệm TRỰC TIẾP tương tác 
|   với database Neon (PostgreSQL).
|
|   - "use server" cho phép các hàm này chạy an toàn trên server.
|   - Các hàm này KHÔNG gọi 'requireAuth', vì việc đó là của 'action'.
|
================================================================================
*/
"use server"

// Import client 'sql' từ Neon
import { sql } from "@/lib/neonClient" // Giả sử client neon của bạn ở đây

export type Course = {
  id: number
  creator_id: number
  title: string
  slug: string // Dùng cho URL (vd: /courses/ten-khoa-hoc)
  description: string | null
  thumbnail_url: string | null
  status: string // Vd: 'draft', 'published', 'archived'
  duration_hours: number | null
  enrollment_count: number
  approved_by: number | null // ID của admin đã duyệt
  approved_at: Date | null
  published_at: Date | null
  is_deleted: boolean // Dùng cho soft delete
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
  category_id?: number // Foreign key liên kết bảng 'categories'

  // Các trường này được JOIN từ bảng 'categories' (chỉ dùng trong hàm 'getAllCourses')
  category_name?: string
  category_slug?: string
}
export type CoursePayload = {
  creator_id: number
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  category_id?: number
  level?: string
  price?: number
  learning_outcomes?: string[]
  requirements?: string[]
}

/**
 * Định nghĩa các tham số đầu vào cho hàm lấy danh sách khóa học.
 * Các tham số này đến từ URL (searchParams).
 */
type GetAllCoursesParams = {
  query?: string // Chuỗi tìm kiếm (theo title)
  page?: number // Số trang hiện tại
  limit?: number // Số lượng item mỗi trang
  categorySlug?: string // Lọc theo slug của category (MỚI)
  sort?: string // Sắp xếp (vd: 'trending', 'newest') (MỚI)
}
// ------------------------------------------------------------------------------
/**
 * LẤY DANH SÁCH KHÓA HỌC (CÓ PHÂN TRANG, TÌM KIẾM, LỌC, SẮP XẾP)
 *
 * Hàm này được cập nhật để JOIN với bảng 'categories' và xây dựng câu query động
 * dựa trên các tham số đầu vào.
 */
// export async function getAllCoursesAction({
//   query = "",
//   page = 1,
//   limit = 18, // Đặt limit mặc định (vd: 18 item/trang)
//   categorySlug = "",
//   sort = "trending",
// }: GetAllCoursesParams) {
//   // Tính toán OFFSET cho phân trang
//   const offset = (page - 1) * limit

//   // 1. Xây dựng mệnh đề SELECT
//   // Luôn JOIN với 'categories' để lấy 'category_name' và 'category_slug'
//   const selectClause = sql`
//     SELECT
//       c.*,
//       cat.name as category_name,
//       cat.slug as category_slug
//     FROM courses c
//     LEFT JOIN categories cat ON c.category_id = cat.id
//   `

//   // 2. Xây dựng mệnh đề WHERE động
//   // 'whereClauses' dùng cho query chính
//   // 'countWhereClauses' dùng cho query đếm (COUNT)
//   const whereClauses = [sql`c.is_deleted = FALSE`] // Luôn lọc các khóa đã xóa
//   const countWhereClauses = [sql`c.is_deleted = FALSE`]

//   // Thêm điều kiện TÌM KIẾM (nếu có)
//   if (query) {
//     // 'ILIKE' là 'LIKE' không phân biệt hoa/thường
//     const searchCondition = sql`(c.title ILIKE ${"%" + query + "%"})`
//     whereClauses.push(searchCondition)
//     countWhereClauses.push(searchCondition)
//   }

//   // Thêm điều kiện LỌC CATEGORY (nếu có)
//   if (categorySlug) {
//     const categoryCondition = sql`cat.slug = ${categorySlug}`
//     whereClauses.push(categoryCondition)

//     // Khi đếm, chúng ta không cần JOIN đầy đủ, chỉ cần kiểm tra sự tồn tại (EXISTS)
//     // để tối ưu tốc độ đếm.
//     countWhereClauses.push(
//       sql`EXISTS (SELECT 1 FROM categories cat WHERE cat.id = c.category_id AND cat.slug = ${categorySlug})`
//     )
//   }

//   // Ghép các mệnh đề WHERE lại
//   // const whereClause = sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
//   // const countWhereClause = sql`WHERE ${sql.join(countWhereClauses, sql` AND `)}`
//   const whereClause =
//     whereClauses.length > 0
//       ? sql`WHERE ${whereClauses.reduce(
//           (prev, curr, i) => (i === 0 ? curr : sql`${prev} AND ${curr}`),
//           sql``
//         )}`
//       : sql``
//   const countWhereClause =
//     countWhereClauses.length > 0
//       ? sql`WHERE ${countWhereClauses.reduce(
//           (prev, curr, i) => (i === 0 ? curr : sql`${prev} AND ${curr}`),
//           sql``
//         )}`
//       : sql``

//   // 3. Xây dựng mệnh đề SẮP XẾP (ORDER BY)
//   let orderByClause
//   switch (sort) {
//     case "newest":
//       orderByClause = sql`ORDER BY c.created_at DESC`
//       break
//     case "popular":
//       orderByClause = sql`ORDER BY c.enrollment_count DESC`
//       break
//     case "trending":
//     default:
//       // Giả lập 'trending': ưu tiên enrollment cao và ngày tạo mới
//       orderByClause = sql`ORDER BY c.enrollment_count DESC, c.created_at DESC`
//   }

//   // 4. Thực thi 2 câu query song song (tăng tốc độ)
//   const [rowsResult, totalResult] = await Promise.all([
//     // Query chính: Lấy dữ liệu
//     sql`
//       ${selectClause}
//       ${whereClause}
//       ${orderByClause}
//       LIMIT ${limit}
//       OFFSET ${offset}
//     `,
//     // Query phụ: Đếm tổng số lượng
//     sql`
//       SELECT COUNT(*) FROM courses c
//       ${countWhereClause}
//     `,
//   ])

//   // 5. Trả về kết quả
//   const totalCount = parseInt(totalResult[0].count as string, 10)

//   return {
//     courses: rowsResult as Course[],
//     totalCount,
//   }
// }
// ------------------------------------------------------------------------------
/**
 * LẤY DANH SÁCH KHÓA HỌC (CÓ PHÂN TRANG, TÌM KIẾM, SẮP XẾP)
 * BẢN ĐÃ BỎ CATEGORY (KHÔNG JOIN VÀ KHÔNG DÙNG categorySlug)
 */
export async function getAllCoursesAction({
  query = "",
  page = 1,
  limit = 18, // Mặc định 18 item/trang
  sort = "trending",
}: {
  query?: string
  page?: number
  limit?: number
  sort?: string
}) {
  // Tính OFFSET cho phân trang
  const offset = (page - 1) * limit

  // 1️⃣ Mệnh đề SELECT cơ bản
  const selectClause = sql`
    SELECT *
    FROM courses c
  `

  // 2️⃣ WHERE (lọc dữ liệu)
  const whereClauses = [sql`c.is_deleted = FALSE`] // bỏ khóa học bị xóa
  const countWhereClauses = [sql`c.is_deleted = FALSE`]

  // Thêm điều kiện TÌM KIẾM (nếu có)
  if (query) {
    const searchCondition = sql`(c.title ILIKE ${"%" + query + "%"})`
    whereClauses.push(searchCondition)
    countWhereClauses.push(searchCondition)
  }

  // Tạo WHERE bằng reduce (nếu có nhiều điều kiện)
  const whereClause =
    whereClauses.length > 0
      ? sql`WHERE ${whereClauses.reduce(
          (prev, curr, i) => (i === 0 ? curr : sql`${prev} AND ${curr}`),
          sql``
        )}`
      : sql``

  const countWhereClause =
    countWhereClauses.length > 0
      ? sql`WHERE ${countWhereClauses.reduce(
          (prev, curr, i) => (i === 0 ? curr : sql`${prev} AND ${curr}`),
          sql``
        )}`
      : sql``

  // 3️⃣ ORDER BY (sắp xếp)
  let orderByClause
  switch (sort) {
    case "newest":
      orderByClause = sql`ORDER BY c.created_at DESC`
      break
    case "popular":
      orderByClause = sql`ORDER BY c.enrollment_count DESC`
      break
    default:
      orderByClause = sql`ORDER BY c.enrollment_count DESC, c.created_at DESC`
  }

  // 4️⃣ Chạy 2 query song song
  const [rowsResult, totalResult] = await Promise.all([
    sql`
      ${selectClause}
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) FROM courses c
      ${countWhereClause}
    `,
  ])

  // 5️⃣ Trả kết quả
  const totalCount = parseInt(totalResult[0].count as string, 10)

  return {
    courses: rowsResult as Course[],
    totalCount,
  }
}

/**
 * LẤY CHI TIẾT MỘT KHÓA HỌC BẰNG 'ID'
 * (Dùng cho trang quản lý, vd: /manage/courses/edit/123)
 */
export async function getCourseByIdAction(id: number) {
  const rows = await sql`
    SELECT * FROM courses
    WHERE id = ${id} AND is_deleted = FALSE
  `
  // Trả về null nếu không tìm thấy
  return rows.length > 0 ? (rows[0] as Course) : null
}

/**
 * LẤY CHI TIẾT MỘT KHÓA HỌC BẰNG 'SLUG' (HÀM MỚI)
 * (Dùng cho trang public, vd: /courses/ten-khoa-hoc)
 */
export async function getCourseBySlugAction(slug: string) {
  const rows = await sql`
    SELECT * FROM courses
    WHERE slug = ${slug} AND is_deleted = FALSE
  `
  return rows.length > 0 ? (rows[0] as Course) : null
}

/**
 * TẠO MỚI MỘT KHÓA HỌC (ĐÃ CẬP NHẬT)
 * (Hàm này nên được cập nhật để nhận nhiều trường hơn từ Stepper)
 */
export async function createCourseAction(data: {
  creator_id: number
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  status?: string
  duration_hours?: number
  // === GỢI Ý THÊM CÁC TRƯỜNG TỪ STEPPER ===
  category_id?: number
  level?: string
  price?: number
  learning_outcomes?: string[] // Lưu dạng JSONB hoặc TEXT[]
  requirements?: string[] // Lưu dạng JSONB hoặc TEXT[]
}) {
  try {
    // Dùng Transaction (BEGIN/COMMIT) để đảm bảo an toàn dữ liệu
    await sql`BEGIN`

    // Câu lệnh INSERT (đã thêm các trường mới)
    const result = await sql`
      INSERT INTO courses (
        creator_id, title, slug, description, 
        thumbnail_url, status, duration_hours,
        category_id, level, price, learning_outcomes, requirements
      ) VALUES (
        ${data.creator_id}, 
        ${data.title}, 
        ${data.slug}, 
        ${data.description || null}, 
        ${data.thumbnail_url || null}, 
        ${data.status || "draft"}, 
        ${data.duration_hours || 0},
        ${data.category_id || null},
        ${data.level || null},
        ${data.price || 0},
        ${data.learning_outcomes ? JSON.stringify(data.learning_outcomes) : null},
        ${data.requirements ? JSON.stringify(data.requirements) : null}
      ) RETURNING *
    `
    // Nếu INSERT thành công, commit transaction
    await sql`COMMIT`
    return result[0] as Course
  } catch (err) {
    // Nếu có lỗi, ROLLBACK để hủy mọi thay đổi
    await sql`ROLLBACK`
    console.error("createCourseAction transaction failed:", err)
    throw new Error("Failed to create course")
  }
}

/**
 * CẬP NHẬT MỘT KHÓA HỌC (THEO ID)
 *
 * Dùng 'COALESCE' để chỉ cập nhật các trường được gửi lên.
 * COALESCE(value_moi, value_cu): Nếu 'value_moi' là null (hoặc undefined),
 * nó sẽ giữ lại 'value_cu'.
 */
export async function updateCourseAction(
  id: number,
  // Dữ liệu gửi lên là một phần (Partial) của Course
  data: Partial<Omit<Course, "id" | "created_at" | "updated_at">>
) {
  // Bạn cũng có thể thêm các trường khác vào đây (vd: level, price...)
  // miễn là chúng khớp với tên cột trong database.
  const result = await sql`
    UPDATE courses
    SET
      title = COALESCE(${data.title}, title),
      slug = COALESCE(${data.slug}, slug),
      description = COALESCE(${data.description}, description),
      thumbnail_url = COALESCE(${data.thumbnail_url}, thumbnail_url),
      status = COALESCE(${data.status}, status),
      duration_hours = COALESCE(${data.duration_hours}, duration_hours),
      
      -- Cập nhật thêm các trường khác...
      
      updated_at = NOW() -- Luôn cập nhật mốc thời gian
    WHERE id = ${id}
    RETURNING *
  `
  return result.length > 0 ? (result[0] as Course) : null
  // category_id = COALESCE(${data.category_id}, category_id),
}

/**
 * XÓA MỀM (SOFT DELETE) MỘT KHÓA HỌC
 *
 * Chỉ set 'is_deleted = TRUE' và 'deleted_at', không xóa hẳn khỏi DB.
 */
export async function deleteCourseAction(id: number) {
  await sql`
    UPDATE courses
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE id = ${id}
  `
  return { message: "Course marked as deleted" }
}
