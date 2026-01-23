import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Language = "vi" | "en"

interface LanguageStore {
  language: Language
  setLanguage: (language: Language) => void
}

const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: "vi" as Language,
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ language: state.language }),
    }
  )
)

export default useLanguageStore
