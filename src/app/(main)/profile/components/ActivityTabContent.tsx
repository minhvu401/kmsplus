"use client"

import { Tabs, Typography } from "antd"
import SummaryTabContent from "./SummaryTabContent"
import QuestionsTabContent from "./QuestionsTabContent"
import AnswersTabContent from "./AnswersTabContent"
import CommentsTabContent from "./CommentsTabContent"
import LearningTabContent from "./LearningTabContent"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

export default function ActivityTabContent({ counts, user, questions, answers, comments, enrolledCourses }: { counts?: { questions:number, answers:number, comments:number, courses?:number }, user?: { id?: string | number } | null, questions?: any[], answers?: any[], comments?: any[], enrolledCourses?: any[] }) {
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
          children: <SummaryTabContent counts={counts} />,
        },
        {
          label: t("profile.tab_questions", language),
          key: "questions",
          children: (
            <div className="pt-4">
              <QuestionsTabContent initialItems={questions} userId={user?.id} />
            </div>
          ),
        },
        {
          label: t("profile.tab_answers", language),
          key: "answers",
          children: (
            <div className="pt-4">
              <AnswersTabContent initialItems={answers ?? []} userId={user?.id} />
            </div>
          ),
        },
        {
          label: t("profile.tab_comments", language),
          key: "comments",
          children: (
            <div className="pt-4">
              <CommentsTabContent initialItems={comments ?? []} userId={user?.id} />
            </div>
          ),
        },
        {
          label: t("profile.tab_learning", language),
          key: "learning",
          children: (
            <div className="pt-4">
              <LearningTabContent initialItems={enrolledCourses ?? []} userId={user?.id} />
            </div>
          ),
        },
      ]}
    />
  )
}
