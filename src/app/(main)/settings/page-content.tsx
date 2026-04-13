"use client"

import { Card, Select, Space, Typography, Divider } from "antd"
import useLanguageStore, { Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import AIPromptsSettings from "@/components/AIPromptsSettings"

const { Title, Text } = Typography

export default function SettingsPageContent() {
  const { language, setLanguage } = useLanguageStore()

  const handleLanguageChange = (value: Language) => {
    setLanguage(value)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {t("settings.title", language)}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("settings.subtitle", language)}
            </p>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <Card className="mt-6">
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Language Settings */}
          <div>
            <div className="mb-4">
              <Text strong className="text-base">
                {t("settings.language", language)}
              </Text>
              <p className="text-gray-500 text-sm mt-1">
                {t("settings.language_description", language)}
              </p>
            </div>

            <Select
              value={language}
              onChange={handleLanguageChange}
              style={{ width: 200 }}
              size="large"
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
          </div>

          <Divider />
        </Space>
      </Card>

      {/* AI Prompts Settings */}
      <AIPromptsSettings />
    </div>
  )
}
