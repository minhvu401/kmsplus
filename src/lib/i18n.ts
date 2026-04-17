// src/lib/i18n.ts
import { Language } from "@/store/useLanguageStore"
import { vi } from "./i18n.vn"
import { en } from "./i18n.en"

export const translations: Record<Language, Record<string, string>> = {
  vi,
  en,
}

export const t = (key: string, language: Language): string => {
  return translations[language]?.[key] ?? key
}
