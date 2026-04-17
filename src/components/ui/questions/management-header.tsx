"use client"

import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

export default function QuestionsManagementHeader() {
  const { language } = useLanguageStore()

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
        {t("question.management.title", language)}
      </h1>
      <p className="text-gray-600 max-w-2xl leading-relaxed">
        {t("question.management.description", language)}
      </p>
    </div>
  )
}
