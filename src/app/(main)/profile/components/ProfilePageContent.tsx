// src/app/(main)/profile/components/ProfilePageContent.tsx
"use client"

import {
  Card,
  Avatar,
  Typography,
  Row,
  Col,
  Button,
  Tabs,
  Space,
  Spin,
  Divider,
} from "antd"
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  HistoryOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons"
import { useState, useEffect } from "react"
import ActivityTabContent from "./ActivityTabContent"
import ProfileForm from "@/components/forms/profile-form"
import PasswordForm from "@/components/forms/password-form"
import useUserStore from "@/store/useUserStore"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

interface UserType {
  id: string
  full_name: string | null
  email: string
  department?: string
  role?: string
  avatar_url?: string
  created_at?: string
}

export default function ProfilePageContent() {
  const { Title, Text } = Typography
  const { user } = useUserStore()
  const { language } = useLanguageStore()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isPasswordMode, setIsPasswordMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserType | null>(
    user
      ? {
          ...user,
          created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
        }
      : null
  )

  useEffect(() => {
    if (user) {
      setUserData({
        ...user,
        created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
      })
    }
  }, [user])

  const handleProfileSuccess = () => {
    setIsEditMode(false)
  }

  const handlePasswordSuccess = () => {
    setIsPasswordMode(false)
  }

  if (!userData) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {t("profile.title", language)}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("profile.subtitle", language)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              size={80}
              icon={<UserOutlined />}
              src={userData?.avatar_url}
              className="bg-blue-500"
            >
              {userData?.full_name?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Title level={3} className="mb-1">
                {userData?.full_name}
              </Title>
              <Text type="secondary">{userData?.email}</Text>
              {userData?.department && (
                <>
                  <br />
                  <Text type="secondary" className="text-sm">
                    {userData?.department}
                  </Text>
                </>
              )}
            </div>
          </div>
          {!isEditMode && !isPasswordMode && (
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditMode(true)}
              >
                {t("profile.edit", language)}
              </Button>
              <Button
                icon={<LockOutlined />}
                onClick={() => setIsPasswordMode(true)}
              >
                {t("profile.change_password", language)}
              </Button>
            </Space>
          )}
        </div>
      </Card>

      {/* Edit Mode */}
      {isEditMode && (
        <Card className="mb-6">
          <Title level={4}>
            {t("profile.edit_profile", language)}
          </Title>
          <Divider />
          <ProfileForm user={userData} onSuccess={handleProfileSuccess} />
          <div className="mt-4">
            <Button
              type="text"
              danger
              onClick={() => setIsEditMode(false)}
            >
              {t("profile.cancel", language)}
            </Button>
          </div>
        </Card>
      )}

      {/* Password Change Mode */}
      {isPasswordMode && (
        <Card className="mb-6">
          <Title level={4}>
            {t("profile.change_password", language)}
          </Title>
          <Divider />
          <div className="max-w-md">
            <PasswordForm onSuccess={handlePasswordSuccess} />
          </div>
          <div className="mt-4">
            <Button
              type="text"
              danger
              onClick={() => setIsPasswordMode(false)}
            >
              {t("profile.cancel", language)}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs Content */}
      {!isEditMode && !isPasswordMode && (
        <Card>
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                label: t("profile.details", language),
                key: "details",
                icon: <UserOutlined />,
                children: (
                  <div className="pt-4">
                    <Title level={5}>
                      {t("profile.profile_information", language)}
                    </Title>
                    <div className="space-y-4">
                      <Row gutter={[32, 24]}>
                        <Col xs={24} sm={12}>
                          <div>
                            <Text strong className="block mb-2">
                              {t("profile.full_name", language)}
                            </Text>
                            <Text>{userData?.full_name}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div>
                            <Text strong className="block mb-2">
                              {t("profile.email", language)}
                            </Text>
                            <Text>{userData?.email}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div>
                            <Text strong className="block mb-2">
                              {t("profile.department", language)}
                            </Text>
                            <Text>{userData?.department || "N/A"}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div>
                            <Text strong className="block mb-2">
                              {t("profile.member_since", language)}
                            </Text>
                            <Text>
                              {userData?.created_at
                                ? new Date(userData.created_at).toLocaleDateString(
                                    language === "vi" ? "vi-VN" : "en-US"
                                  )
                                : "N/A"}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    <Divider />
                    <Space>
                      <Button
                        type="primary"
                        onClick={() => setIsEditMode(true)}
                      >
                        {t("profile.edit_profile", language)}
                      </Button>
                      <Button
                        onClick={() => setIsPasswordMode(true)}
                      >
                        {t("profile.change_password", language)}
                      </Button>
                    </Space>
                  </div>
                ),
              },
              {
                label: t("profile.activity", language),
                key: "activity",
                icon: <HistoryOutlined />,
                children: (
                  <div className="pt-4">
                    <ActivityTabContent />
                  </div>
                ),
              },
              {
                label: t("profile.security", language),
                key: "security",
                icon: <SecurityScanOutlined />,
                children: (
                  <div className="pt-4">
                    <Title level={5}>
                      {t("profile.security_options", language)}
                    </Title>
                    <div className="space-y-4 max-w-2xl">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Text strong>
                          {t("profile.protect_account", language)}
                        </Text>
                        <p className="text-sm text-gray-600 mt-2">
                          {t("profile.protect_account_desc", language)}
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsPasswordMode(true)}
                        icon={<LockOutlined />}
                      >
                        {t("profile.change_password", language)}
                      </Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  )
}