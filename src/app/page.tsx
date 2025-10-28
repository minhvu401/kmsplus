"use client"

import { redirect } from "next/navigation"

// Đường dẫn này ĐÚNG với tên file "button.tsx"
// import Button from "@/components/ui/button"

export default function Home() {
  // Redirect to login page
  redirect("/login")
}
