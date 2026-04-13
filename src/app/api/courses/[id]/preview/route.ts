import { NextResponse } from "next/server"
import { getCourseByIdAction } from "@/service/course.service"

export async function GET(request: Request, context: any) {
  try {
    const id = Number(context?.params?.id)
    if (Number.isNaN(id)) return NextResponse.json({ success: false, message: "Invalid course id" }, { status: 400 })
    const course = await getCourseByIdAction(id)
    if (!course) return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("GET /api/courses/[id]/preview error", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
