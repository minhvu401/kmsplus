"use client"

import React, { useEffect, useState } from "react"
import { Layout, Avatar, Typography, Row, Col, Button, Tabs, Space } from "antd"
import {
  UserOutlined,
  EditOutlined,
  GlobalOutlined,
  HistoryOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { getCurrentUserInfor } from "@/action/user/userActions"
import ActivityTabContent from "./ActivityTabContent"

interface UserType {
  id: string
  full_name: string | null
  email?: string
  department?: string
  role?: string
  avatar_url?: string
}

/**
 * Trang Profile chính
 */
export default function ProfilePageContent() {
  const { Title, Text } = Typography

  const [user, setUser] = useState<UserType | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const thisUser = await getCurrentUserInfor()
        if (thisUser) {
          setUser(thisUser)
        }
      } catch (error) {}
    }

    fetchUser()
  }, [])

  return (
    <Layout
      style={{
        padding: "24px",
        backgroundColor: "#fff", // AntD layout mặc định có nền xám
      }}
    >
      {/* Phần Header: Avatar, Tên, Email và các nút Edit */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <Space size="large" align="center">
            <Avatar size={128} icon={<UserOutlined />}>
              {/* Hiển thị chữ cái đầu nếu không có ảnh */}
              {user?.avatar_url}
            </Avatar>
            <div>
              <Title level={2} style={{ marginBottom: 0 }}>
                {user?.full_name}
              </Title>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                {user?.email}
              </Text>
              {/* Bạn có thể thêm các thông tin khác như "Member for..." ở đây */}
            </div>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<EditOutlined />}>Edit profile</Button>
            <Button icon={<GlobalOutlined />}>Network profile</Button>
          </Space>
        </Col>
      </Row>

      {/* Phần Content: Các tab chính */}
      <Tabs
        defaultActiveKey="activity"
        size="large"
        type="line"
        items={[
          {
            label: "Profile",
            key: "profile",
            icon: <UserOutlined />,
            children: (
              <div>
                <Title level={4}>Profile Details</Title>
                <Text>Đây là nơi hiển thị chi tiết hồ sơ.</Text>
              </div>
            ),
          },
          {
            label: "Activity",
            key: "activity",
            icon: <HistoryOutlined />,
            children: <ActivityTabContent />,
          },
          //   {
          //     label: "Saves",
          //     key: "saves",
          //     icon: <SaveOutlined />,
          //     children: (
          //       <div>
          //         <Title level={4}>Saves</Title>
          //         <Text>Đây là nơi hiển thị các mục đã lưu.</Text>
          //       </div>
          //     ),
          //   },
          {
            label: "Settings",
            key: "settings",
            icon: <SettingOutlined />,
            children: (
              <div>
                <Title level={4}>Settings</Title>
                <Text>Đây là nơi hiển thị các cài đặt tài khoản.</Text>
              </div>
            ),
          },
        ]}
      />
    </Layout>
  )
}
