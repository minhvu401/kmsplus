import type { Metadata } from "next"
import ClientCreateCourse from "./ClientCreateCourse"

export const metadata: Metadata = {
  title: "Create Course",
}

export default function CreateCoursePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ClientCreateCourse />
      </div>
    </main>
  )
}
