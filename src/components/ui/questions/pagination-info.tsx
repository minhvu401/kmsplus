"use client"

import { Flex } from "antd"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface QuestionsPaginationInfoProps {
  currentPage: number
  pageSize: number
  totalItems: number
  questionsLength: number
}

export default function QuestionsPaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  questionsLength,
}: QuestionsPaginationInfoProps) {
  const { language } = useLanguageStore()

  const from = questionsLength > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const to = Math.min(currentPage * pageSize, totalItems)

  const resultsText = t("question.showing_results", language)
    .replace("{from}", from.toString())
    .replace("{to}", to.toString())
    .replace("{total}", totalItems.toString())

  return (
    <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
      {resultsText}
    </Flex>
  )
}
