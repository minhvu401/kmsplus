"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/database"
import { message } from "antd"

export async function updateCourseAction(
  id: number,
  data: {
    title?: string
    description?: string
    thumbnail_url?: string
    status?: string
    duration_hours?: number
    tags?: string[]
    curriculum?: any[]
  }
) {
  try {
    // 1. Cập nhật thông tin cơ bản của course
    await sql`
      UPDATE courses 
      SET 
        title = ${data.title},
        description = ${data.description || null},
        thumbnail_url = ${data.thumbnail_url || null},
        status = ${data.status || "draft"},
        duration_hours = ${data.duration_hours || 0},
        updated_at = NOW()
      WHERE id = ${id}
    `

    // 2. Xóa curriculum cũ nếu có
    await sql`
      DELETE FROM curriculum_items 
      WHERE course_id = ${id}
    `

    // 3. Thêm curriculum mới nếu có
    if (data.curriculum && data.curriculum.length > 0) {
      for (const [index, item] of data.curriculum.entries()) {
        const sectionTitle = `Section ${index + 1}`

        // Tạo section
        const sectionResult = await sql`
          INSERT INTO curriculum_sections (course_id, title, display_order, created_at, updated_at)
          VALUES (${id}, ${sectionTitle}, ${index}, NOW(), NOW())
          RETURNING id
        `

        const sectionId = sectionResult[0]?.id

        if (sectionId && item.items && item.items.length > 0) {
          // Thêm các items vào section
          for (const [itemIndex, curriculumItem] of item.items.entries()) {
            await sql`
              INSERT INTO curriculum_items (
                course_id, 
                section_id, 
                resource_id, 
                type, 
                title, 
                display_order, 
                created_at, 
                updated_at
              )
              VALUES (
                ${id}, 
                ${sectionId}, 
                ${curriculumItem.resource_id}, 
                ${curriculumItem.type}, 
                ${curriculumItem.title}, 
                ${itemIndex + 1}, 
                NOW(), 
                NOW()
              )
            `
          }
        }
      }
    }

    // 4. Xử lý tags nếu có
    if (data.tags && data.tags.length > 0) {
      // Xóa tags cũ
      await sql`DELETE FROM course_tags WHERE course_id = ${id}`

      // Thêm tags mới
      for (const tag of data.tags) {
        await sql`
          INSERT INTO course_tags (course_id, tag)
          VALUES (${id}, ${tag})
        `
      }
    }

    // 5. Revalidate cache
    revalidatePath("/courses")
    revalidatePath(`/courses/${id}`)
    revalidatePath("/courses/manage")

    return {
      success: true,
      message: "Course updated successfully!",
    }
  } catch (error) {
    console.error("Error updating course:", error)
    return {
      success: false,
      error: "Failed to update course. Please try again.",
    }
  }
}
