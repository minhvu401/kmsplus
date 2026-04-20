"use client"

import React from "react"
import Link from "next/link"
import { BookOutlined } from "@ant-design/icons"
import useLanguageStore, { type Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface Category {
  id: number
  name: string
  description?: string
  doc_count: number
}

interface DocumentPageClientProps {
  categories: Category[]
}

export default function DocumentPageClient({
  categories,
}: DocumentPageClientProps) {
  const { language: rawLanguage } = useLanguageStore()
  const language = rawLanguage as Language

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <BookOutlined className="mr-3 text-blue-600" />
          {t("document.page_title", language)}
        </h1>
        <p className="text-gray-600 text-base">
          {t("document.page_subtitle", language)}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-100 shadow-sm">
          <BookOutlined className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500">
            {t("document.empty_title", language)}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/documents/category/${category.id}`}
              className="block group"
            >
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOutlined className="text-xl" />
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {category.doc_count} {t("document.doc_count", language)}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h2>

                <p className="text-gray-500 text-sm line-clamp-2 mt-auto">
                  {category.description ||
                    t("document.default_description", language)}
                </p>

                <div className="mt-6 flex items-center text-blue-600 text-sm font-medium">
                  {t("document.view_details", language)}{" "}
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
