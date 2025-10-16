"use client"

import { Button, Space, Card, Typography } from "antd"
import { UserOutlined, HomeOutlined, SettingOutlined } from "@ant-design/icons"

const { Title, Paragraph } = Typography

export default function AntdTestPage() {
  return (
    <div style={{ padding: "50px" }}>
      <Card>
        <Title level={2}>🎉 Ant Design Setup Success!</Title>
        <Paragraph>
          Ant Design đã được cài đặt và config với Next.js App Router!
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space wrap>
            <Button type="primary" icon={<HomeOutlined />}>
              Primary Button
            </Button>
            <Button type="default" icon={<UserOutlined />}>
              Default Button
            </Button>
            <Button type="dashed" icon={<SettingOutlined />}>
              Dashed Button
            </Button>
            <Button type="link">Link Button</Button>
            <Button danger>Danger Button</Button>
          </Space>

          <Card type="inner" title="Inner Card">
            tất cả components của Ant Design: Table, Form, Modal, Drawer,
            DatePicker, etc.
          </Card>
        </Space>
      </Card>
    </div>
  )
}
