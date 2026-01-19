// Quiz Service
"use server"

import { sql } from "@/lib/database"

// 1. Định nghĩa Type đầy đủ
export type Quiz = {
  id: number
  course_id: number
  title: string
  description: string | null
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number
  available_from: Date | null
  available_until: Date | null
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
  question_count?: number // Bổ sung field này vì query có lấy
}

type GetAllQuizzesParams = {
  query?: string
  page?: number
  limit?: number
  course_id?: number
}

// Định nghĩa kết quả trả về cho hàm get all
export type GetAllQuizzesResult = {
  success: boolean
  data?: Quiz[]
  total?: number
  error?: string
}

/**
 * Lấy danh sách bài thi có phân trang và tìm kiếm.
 */
export async function getAllQuizzesAction(
  params: GetAllQuizzesParams = {} // Gán giá trị mặc định là rỗng
): Promise<GetAllQuizzesResult> {
  try {
    const { query = "", page = 1, limit = 100, course_id } = params
    const offset = (page - 1) * limit

    // Xử lý điều kiện lọc
    // Lưu ý: Cú pháp ILIKE và %${query}% phụ thuộc vào lib DB,
    // ở đây viết theo chuẩn chung dùng template literal.

    // Câu query lấy dữ liệu
    const quizzes = await sql`
      SELECT 
        q.id, 
        q.course_id,
        q.title, 
        q.description,
        q.time_limit_minutes,
        q.passing_score,
        q.max_attempts,
        q.available_from,
        q.available_until,
        q.created_at,
        q.updated_at,
        (
          SELECT COUNT(*) 
          FROM quiz_questions qq 
          WHERE qq.quiz_id = q.id
        ) as question_count
      FROM quizzes q
      WHERE q.is_deleted = false
      ${course_id ? sql`AND q.course_id = ${course_id}` : sql``}
      ${query ? sql`AND q.title ILIKE ${"%" + query + "%"}` : sql``}
      ORDER BY q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Câu query đếm tổng số lượng (để phân trang)
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM quizzes q
      WHERE q.is_deleted = false
      ${course_id ? sql`AND q.course_id = ${course_id}` : sql``}
      ${query ? sql`AND q.title ILIKE ${"%" + query + "%"}` : sql``}
    `

    const total = Number(countResult[0].total)

    return {
      success: true,
      data: quizzes.map((quiz) => ({
        ...quiz,
        // Sửa lỗi mapping: DB trả về time_limit_minutes, không phải time_limit
        time_limit_minutes: quiz.time_limit_minutes,
        question_count: Number(quiz.question_count) || 0,
      })) as Quiz[],
      total,
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return {
      success: false,
      error: "Failed to fetch quizzes",
    }
  }
}

/**
 * Lấy chi tiết một bài thi theo ID.
 */
export async function getQuizByIdAction(id: number) {
  try {
    const rows = await sql`
      SELECT * FROM quizzes
      WHERE id = ${id} AND is_deleted = FALSE
    `
    return rows.length > 0 ? (rows[0] as Quiz) : null
  } catch (error) {
    console.error("getQuizByIdAction error:", error)
    // Nên return null hoặc throw tùy theo cách xử lý ở UI
    return null
  }
}

/**
 * Tạo mới một bài thi.
 */
export async function createQuizAction(data: {
  course_id: number
  title: string
  description?: string
  status?: string
  time_limit_minutes?: number
  passing_score?: number
  max_attempts?: number
}) {
  try {
    // Không cần BEGIN/COMMIT nếu chỉ có 1 lệnh INSERT đơn lẻ,
    // trừ khi thư viện DB yêu cầu bắt buộc.

    const result = await sql`
      INSERT INTO quizzes (
        course_id, 
        title, 
        description, 
        time_limit_minutes, 
        passing_score, 
        max_attempts,
        is_deleted,
        created_at,
        updated_at
      ) VALUES (
        ${data.course_id}, 
        ${data.title}, 
        ${data.description || null}, 
        ${data.time_limit_minutes || null}, 
        ${data.passing_score || 70}, 
        ${data.max_attempts || 3},
        false,
        NOW(),
        NOW()
      ) RETURNING *
    `

    return result[0] as Quiz
  } catch (err) {
    console.error("createQuizAction failed:", err)
    throw new Error("Failed to create quiz")
  }
}

/**
 * Cập nhật một bài thi.
 * FIX: Sử dụng logic update an toàn hơn, tránh nối chuỗi SQL thủ công dễ gây lỗi.
 */
export async function updateQuizAction(
  id: number,
  data: Partial<Omit<Quiz, "id" | "created_at" | "updated_at">>
) {
  try {
    // Cách an toàn nhất với Tagged Templates là Update từng trường
    // hoặc sử dụng helper của thư viện nếu có.
    // Dưới đây là cách dùng COALESCE hoặc logic update thông dụng:

    // Lấy dữ liệu cũ trước (để đảm bảo tính toàn vẹn nếu cần)
    // Tuy nhiên, cách đơn giản nhất là viết câu lệnh UPDATE set từng field
    // nếu giá trị đó tồn tại trong object data.

    // Lưu ý: Cú pháp này giả định thư viện `sql` hỗ trợ dynamic fragments
    // (như postgres.js hoặc neon). Nếu dùng vercel/postgres, bạn phải viết query tĩnh
    // hoặc dùng COALESCE.

    const result = await sql`
      UPDATE quizzes
      SET 
        title = ${data.title !== undefined ? data.title : sql`title`},
        description = ${data.description !== undefined ? data.description : sql`description`},
        time_limit_minutes = ${data.time_limit_minutes !== undefined ? data.time_limit_minutes : sql`time_limit_minutes`},
        passing_score = ${data.passing_score !== undefined ? data.passing_score : sql`passing_score`},
        max_attempts = ${data.max_attempts !== undefined ? data.max_attempts : sql`max_attempts`},
        available_from = ${data.available_from !== undefined ? data.available_from : sql`available_from`},
        available_until = ${data.available_until !== undefined ? data.available_until : sql`available_until`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return result.length > 0 ? (result[0] as Quiz) : null
  } catch (error) {
    console.error("updateQuizAction error:", error)
    throw new Error("Failed to update quiz")
  }
}

/**
 * Xóa một bài thi (soft delete).
 */
export async function deleteQuizAction(id: number) {
  try {
    const result = await sql`
      UPDATE quizzes
      SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result.length > 0 ? (result[0] as Quiz) : null
  } catch (error) {
    console.error("deleteQuizAction error:", error)
    throw new Error("Failed to delete quiz")
  }
}
