"use client"

import Link from "next/link"
import useLanguageStore from "@/store/useLanguageStore"

export default function CourseNotFound() {
  const { language } = useLanguageStore()

  const copy =
    language === "vi"
      ? {
          title: "Không tìm thấy khóa học",
          description:
            "Khóa học có thể không tồn tại, đã bị ẩn, hoặc ID không hợp lệ.",
          backToCourses: "Về danh sách khóa học",
        }
      : {
          title: "Course not found",
          description:
            "The course may not exist, may be hidden, or the provided ID is invalid.",
          backToCourses: "Back to Courses",
        }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "560px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          404
        </p>
        <h1
          style={{
            margin: "8px 0 10px 0",
            color: "#111827",
            fontSize: "30px",
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {copy.title}
        </h1>
        <p
          style={{
            margin: "0 0 24px 0",
            color: "#4b5563",
            fontSize: "16px",
            lineHeight: 1.6,
          }}
        >
          {copy.description}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/courses"
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {copy.backToCourses}
          </Link>
        </div>
      </section>
    </main>
  )
}