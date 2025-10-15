import { NextResponse } from "next/server"
import { sql } from "@/lib/neonClient"

export async function GET() {
  try {
    // Query dữ liệu từ bảng users
    const users = await sql`SELECT full_name, email 
                            FROM users 
                            ORDER BY id DESC`

    // Trả về JSON
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { success: false, message: "Database query failed" },
      { status: 500 }
    )
  }
}
