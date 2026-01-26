import { requireAuth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import path from "path"
import fs from "fs/promises"
import { writeFile, mkdir } from "fs/promises"

/**
 * POST /api/profile/avatar - Upload avatar
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const formData = await req.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Get current user
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    const userId = decoded.id

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars")
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const filename = `${userId}-${Date.now()}-${file.name}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    const avatarUrl = `/uploads/avatars/${filename}`

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl,
      },
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      { success: false, message: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}
