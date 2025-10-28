import {
  TrophyOutlined,
  GiftOutlined,
  LineChartOutlined,
} from "@ant-design/icons"
import { Button, Card, Col, Row, Space, Tabs, Typography } from "antd"

export default function SummaryTabContent() {
  const { Title, Text } = Typography
  return (
    <div>
      <Title level={4} style={{ marginBottom: "24px" }}>
        Summary
      </Title>
      <Row gutter={[16, 16]}>
        {/* Card 1: Reputation */}
        <Col xs={24} md={8}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <TrophyOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={5}>
                Reputation is how the community thanks you
              </Title>
              <Text type="secondary">
                When users upvote your helpful posts, you'll earn reputation and
                unlock new privileges.
              </Text>
            </Space>
          </Card>
        </Col>
        {/* Card 2: Earn badges */}
        <Col xs={24} md={8}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <GiftOutlined style={{ fontSize: "48px", color: "#858585" }} />
              <Title level={5}>Earn badges for helpful actions</Title>
              <Text type="secondary" style={{ textAlign: "center" }}>
                Badges are bits of digital flair that you get when you
                participate in especially helpful ways.
              </Text>
              <Button type="primary" style={{ marginTop: "16px" }}>
                Take the Tour and earn your first badge
              </Button>
            </Space>
          </Card>
        </Col>
        {/* Card 3: Measure your impact */}
        <Col xs={24} md={8}>
          <Card>
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              <LineChartOutlined
                style={{ fontSize: "48px", color: "#858585" }}
              />
              <Title level={5}>Measure your impact</Title>
              <Text type="secondary">
                Your posts and helpful actions here help hundreds or thousands
                of people searching for help.
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
