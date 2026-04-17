"use client"

import {
  CommentOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import { Card, Col, Row, Space, Typography, Spin } from "antd"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

type Counts = {
  questions: number
  answers: number
  comments: number
  courses?: number
}

export default function SummaryTabContent({
  counts,
}: {
  counts?: Counts | null
}) {
  const { Title, Text } = Typography
  const { language } = useLanguageStore()

  if (!counts) {
    return (
      <div className="p-6 flex justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: "24px" }}>
        {t("profile.summary_title", language)}
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <QuestionCircleOutlined
                style={{ fontSize: "48px", color: "#858585" }}
              />
              <Title level={4} style={{ margin: 0 }}>
                {counts.questions}
              </Title>
              <Title level={5} style={{ margin: 0 }}>
                {t("profile.summary_your_questions", language)}
              </Title>
              <Text type="secondary">
                {t("profile.summary_questions_posted", language)}
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <CheckCircleOutlined
                style={{ fontSize: "48px", color: "#858585" }}
              />
              <Title level={4} style={{ margin: 0 }}>
                {counts.answers}
              </Title>
              <Title level={5} style={{ margin: 0 }}>
                {t("profile.summary_your_answers", language)}
              </Title>
              <Text type="secondary">
                {t("profile.summary_answers_contributed", language)}
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <CommentOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={4} style={{ margin: 0 }}>
                {counts.comments}
              </Title>
              <Title level={5} style={{ margin: 0 }}>
                {t("profile.summary_your_comments", language)}
              </Title>
              <Text type="secondary">
                {t("profile.summary_comments_posted", language)}
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <ReadOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={4} style={{ margin: 0 }}>
                {counts.courses ?? 0}
              </Title>
              <Title level={5} style={{ margin: 0 }}>
                {t("profile.summary_enrolled_courses", language)}
              </Title>
              <Text type="secondary">
                {t("profile.summary_courses_enrolled", language)}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
