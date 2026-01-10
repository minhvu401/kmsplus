// src/app/(main)/courses/create/CreateCourseWrapper.tsx
"use client"

import dynamic from "next/dynamic"
import type { Lesson } from "@/service/lesson.service"
import type { Quiz } from "@/app/(main)/courses/components/CreateCourseClient" // Hoặc import type Quiz từ nơi bạn định nghĩa

// 1. Thực hiện dynamic import tại đây (Nơi được phép dùng ssr: false)
const CreateCourseClient = dynamic(
  () =>
    import("@/app/(main)/courses/components/CreateCourseClient").then(
      (mod) => mod.CreateCourseClient
    ),
  { ssr: false }
)

interface Props {
  initialLessons: Lesson[]
  initialQuizzes: Quiz[]
}

export default function CreateCourseWrapper(props: Props) {
  return <CreateCourseClient {...props} />
}
