"use client"

import Link from "next/link"
import useLanguageStore from "@/store/useLanguageStore"

export default function QuestionBackLink({
  backTarget,
}: {
  backTarget: string
}) {
  const { language } = useLanguageStore()
  const isVi = language === "vi"

  return (
    <Link
      href={backTarget}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 19.5 8.25 12l7.5-7.5"
        />
      </svg>
      {isVi ? "Quay lại" : "Back"}
    </Link>
  )
}
