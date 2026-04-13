"use client"

import {
  CommentOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  CheckCircleOutlined
} from "@ant-design/icons"
import { Card, Col, Row, Space, Typography, Spin } from "antd"

type Counts = { questions: number; answers: number; comments: number; courses?: number }

export default function SummaryTabContent({ counts }: { counts?: Counts | null }) {
  const { Title, Text } = Typography

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
        Summary
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <QuestionCircleOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={4} style={{ margin: 0 }}>{counts.questions}</Title>
              <Title level={5} style={{ margin: 0 }}>Your Questions</Title>
              <Text type="secondary">Questions you've posted</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <CheckCircleOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={4} style={{ margin: 0 }}>{counts.answers}</Title>
              <Title level={5} style={{ margin: 0 }}>Your Answers</Title>
              <Text type="secondary">Answers you've contributed</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <CommentOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={4} style={{ margin: 0 }}>{counts.comments}</Title>
              <Title level={5} style={{ margin: 0 }}>Your Comments</Title>
              <Text type="secondary">Comments you've posted</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <ReadOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={4} style={{ margin: 0 }}>{counts.courses ?? 0}</Title>
              <Title level={5} style={{ margin: 0 }}>Enrolled Courses</Title>
              <Text type="secondary">Courses you're enrolled in</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
