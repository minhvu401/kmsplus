import { Tabs, Typography } from "antd"
import SummaryTabContent from "./SummaryTabContent"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

export default function ActivityTabContent() {
  const { Title, Text } = Typography
  const language = useLanguageStore((state) => state.language)

  return (
    <Tabs
      tabPosition="left"
      defaultActiveKey="summary"
      items={[
        {
          label: t("profile.tab_summary", language),
          key: "summary",
          children: <SummaryTabContent />,
        },
        {
          label: t("profile.tab_answers", language),
          key: "answers",
          children: (
            <div>
              <Title level={4}>{t("profile.tab_answers", language)}</Title>
              <Text>{t("profile.activity_answers_empty", language)}</Text>
            </div>
          ),
        },
        {
          label: t("profile.tab_questions", language),
          key: "questions",
          children: (
            <div>
              <Title level={4}>{t("profile.tab_questions", language)}</Title>
              <Text>{t("profile.activity_questions_empty", language)}</Text>
            </div>
          ),
        },
        {
          label: t("profile.tab_tags", language),
          key: "tags",
          children: (
            <div>
              <Title level={4}>{t("profile.tab_tags", language)}</Title>
              <Text>{t("profile.activity_tags_placeholder", language)}</Text>
            </div>
          ),
        },
        {
          label: t("profile.tab_badges", language),
          key: "badges",
          children: (
            <div>
              <Title level={4}>{t("profile.tab_badges", language)}</Title>
              <Text>{t("profile.activity_badges_placeholder", language)}</Text>
            </div>
          ),
        },
        {
          label: t("profile.tab_reputation", language),
          key: "reputation",
          children: (
            <div>
              <Title level={4}>{t("profile.tab_reputation", language)}</Title>
              <Text>{t("profile.activity_reputation_placeholder", language)}</Text>
            </div>
          ),
        },
      ]}
    />
  )
}
