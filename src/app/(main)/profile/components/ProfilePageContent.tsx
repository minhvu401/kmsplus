"use client"

import {
  Layout,
  Avatar,
  Typography,
  Row,
  Col,
  Button,
  Tabs,
  Space,
  Spin,
} from "antd"
import {
  UserOutlined,
  EditOutlined,
  GlobalOutlined,
  HistoryOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { useState, useEffect } from "react"
import ActivityTabContent from "./ActivityTabContent"
import ProfileForm from "@/components/forms/profile-form"
import PasswordForm from "@/components/forms/password-form"
import useUserStore from "@/store/useUserStore"

interface UserType {
  id: string
  full_name: string | null
  email: string
  department?: string
  role?: string
  avatar_url?: string
}

export default function ProfilePageContent() {
  const { Title, Text } = Typography
  const { user } = useUserStore()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isPasswordMode, setIsPasswordMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserType | null>(user || null)

  useEffect(() => {
    if (user) {
      setUserData(user)
    }
  }, [user])

  const handleProfileSuccess = () => {
    setIsEditMode(false)
    // Optionally refresh user data here
  }

  const handlePasswordSuccess = () => {
    setIsPasswordMode(false)
  }

  if (!userData) {
    return (
      <Layout style={{ padding: "24px", backgroundColor: "#fff" }}>
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <Layout
      style={{
        padding: "32px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Phần Header: Avatar, Tên, Email và các nút Edit */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "32px",
          borderRadius: "8px",
          marginBottom: "32px",
        }}
      >
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: "0" }}
        >
          <Col>
            <Space size="large" align="center">
              <Avatar
                size={128}
                icon={<UserOutlined />}
                src={userData?.avatar_url}
              >
                {/* Hiển thị chữ cái đầu nếu không có ảnh */}
                {userData?.full_name?.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title
                  level={2}
                  style={{ marginBottom: "8px", fontSize: "28px" }}
                >
                  {userData?.full_name}
                </Title>
                <Text
                  type="secondary"
                  style={{ fontSize: "16px", lineHeight: "1.8" }}
                >
                  {userData?.email}
                </Text>
              </div>
            </Space>
          </Col>
          {!isEditMode && !isPasswordMode && (
            <Col>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditMode(true)}
                  size="large"
                >
                  Edit Profile
                </Button>
                <Button icon={<SettingOutlined />} size="large">
                  Settings
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </div>

      {/* Phần Content: Các tab chính */}
      {isEditMode ? (
        <div
          style={{
            marginBottom: "32px",
            marginLeft: "20px",
            padding: "32px",
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        >
          <Title level={3} style={{ fontSize: "20px", marginBottom: "24px" }}>
            Edit Profile
          </Title>
          <ProfileForm user={userData} onSuccess={handleProfileSuccess} />
          <Button
            danger
            type="text"
            onClick={() => setIsEditMode(false)}
            style={{ marginTop: "20px" }}
          >
            Cancel
          </Button>
        </div>
      ) : isPasswordMode ? (
        <div
          style={{
            marginBottom: "32px",
            padding: "32px",
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        >
          <Title level={3} style={{ fontSize: "20px", marginBottom: "24px" }}>
            Change Password
          </Title>
          <div style={{ maxWidth: "500px" }}>
            <PasswordForm onSuccess={handlePasswordSuccess} />
          </div>
          <Button
            danger
            type="text"
            onClick={() => setIsPasswordMode(false)}
            style={{ marginTop: "20px" }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Tabs
            defaultActiveKey="profile"
            size="large"
            type="line"
            style={{ padding: "0", marginLeft: "10px" }}
            items={[
              {
                label: "Profile",
                key: "profile",
                icon: <UserOutlined />,
                children: (
                  <div style={{ padding: "32px" }}>
                    <Title
                      level={4}
                      style={{ fontSize: "20px", marginBottom: "28px" }}
                    >
                      Profile Details
                    </Title>
                    <Row gutter={[32, 32]}>
                      <Col xs={24} sm={12}>
                        <Text
                          strong
                          style={{ fontSize: "16px", lineHeight: "1.8" }}
                        >
                          Full Name:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "16px", lineHeight: "1.8" }}>
                          {userData?.full_name}
                        </Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text
                          strong
                          style={{ fontSize: "16px", lineHeight: "1.8" }}
                        >
                          Email:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "16px", lineHeight: "1.8" }}>
                          {userData?.email}
                        </Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text
                          strong
                          style={{ fontSize: "16px", lineHeight: "1.8" }}
                        >
                          Department:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "16px", lineHeight: "1.8" }}>
                          {userData?.department || "N/A"}
                        </Text>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text
                          strong
                          style={{ fontSize: "16px", lineHeight: "1.8" }}
                        >
                          Member Since:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "16px", lineHeight: "1.8" }}>
                          {userData && (userData as any).created_at
                            ? new Date(
                                (userData as any).created_at
                              ).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </Text>
                      </Col>
                    </Row>
                    <Space style={{ marginTop: "32px", marginBottom: "16px" }}>
                      <Button
                        type="primary"
                        onClick={() => setIsEditMode(true)}
                        size="large"
                      >
                        Edit Profile
                      </Button>
                      <Button
                        onClick={() => setIsPasswordMode(true)}
                        size="large"
                      >
                        Change Password
                      </Button>
                    </Space>
                  </div>
                ),
              },
              {
                label: "Activity",
                key: "activity",
                icon: <HistoryOutlined />,
                children: (
                  <div style={{ padding: "32px" }}>
                    <ActivityTabContent />
                  </div>
                ),
              },
              {
                label: "Security",
                key: "security",
                icon: <SettingOutlined />,
                children: (
                  <div style={{ padding: "32px" }}>
                    <Title
                      level={4}
                      style={{ fontSize: "20px", marginBottom: "16px" }}
                    >
                      Security Settings
                    </Title>
                    <Text style={{ fontSize: "16px", lineHeight: "1.8" }}>
                      Manage your password and account security.
                    </Text>
                    <br />
                    <Button
                      danger
                      style={{ marginTop: "24px" }}
                      onClick={() => setIsPasswordMode(true)}
                      size="large"
                    >
                      Change Password
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </Layout>
  )
}
