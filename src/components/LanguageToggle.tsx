"use client"

import { Select } from "antd"
import useLanguageStore, { Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()

  const handleLanguageChange = (value: Language) => {
    setLanguage(value)
  }

  return (
    <Select
      value={language}
      onChange={handleLanguageChange}
      style={{ width: 120 }}
      options={[
        {
          label: t("settings.language_vietnamese", "vi"),
          value: "vi" as Language,
        },
        {
          label: t("settings.language_english", "en"),
          value: "en" as Language,
        },
      ]}
    />
  )
}
