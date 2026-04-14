import { getCurrentUser } from "@/lib/auth"
import { NextResponse } from "next/server"
// Nhớ import 'sql' từ db config của bạn (ví dụ: @vercel/postgres hoặc thư viện bạn đang dùng)
import { sql } from "@/lib/database"

interface DepartmentRow {
  head_of_department_id: string | null
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Truy vấn database để lấy head_of_department_id (dựa theo code truy vấn sql`...` của bạn)
    const dbData = await sql`
      SELECT d.head_of_department_id 
      FROM users u 
      LEFT JOIN department d ON u.department_id = d.id 
      WHERE u.id = ${Number(user.id)}
    `
    
    // Xử lý cả 2 trường hợp thư viện trả về Array trực tiếp hoặc Object chứa { rows: [...] }
    const rows = Array.isArray(dbData) ? dbData : (dbData && typeof dbData === 'object' && 'rows' in dbData ? (dbData as { rows: unknown[] }).rows : []) || []
    const hodId = rows.length > 0 ? (rows[0] as DepartmentRow).head_of_department_id : null

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        department: {
          head_of_department_id: hodId
        }
      },
    })
  } catch (error) {
    console.error("Error getting current user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}