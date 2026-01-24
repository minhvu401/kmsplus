// src/app/(main)/user-management/page-content.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, Tabs, Spin, Alert, Button, Space, Flex } from "antd"
import { ReloadOutlined, UserAddOutlined, TeamOutlined } from "@ant-design/icons"
import CreateUserForm from "@/components/forms/create-user-form"
import UserListTable from "@/components/forms/user-list-table"
import { getAllUsersForManagementAction } from "@/action/user/userManagementActions"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: Date
  role_name?: string
  role_id?: string
}

export default function UserManagementPageContent() {
  const { language } = useLanguageStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAllUsersForManagementAction()

      if (response.success && response.data) {
        setUsers(response.data)
      } else {
        setError(response.message || "Failed to fetch users")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching users")
    } finally {
      setLoading(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Get available roles (hardcoded for now, can be fetched from API)
  const availableRoles = [
    { id: 1, name: "Employee" },
    { id: 2, name: "Contributor" },
    { id: 3, name: "Training Manager" },
    { id: 4, name: "Admin" },
    { id: 5, name: "Dashboard Viewer" },
  ]

  const tabs = [
    {
      key: "create",
      label: language === "vi" ? "Tạo tài khoản" : "Create Account",
      icon: <UserAddOutlined />,
      children: (
        <div className="pt-4">
          <CreateUserForm
            roles={availableRoles}
            onSuccess={() => {
              // Refresh user list after successful creation
              setTimeout(() => fetchUsers(), 1000)
            }}
          />
        </div>
      ),
    },
    {
      key: "manage",
      label: language === "vi" ? "Quản lý người dùng" : "Manage Users",
      icon: <TeamOutlined />,
      children: (
        <div className="pt-4">
          <Flex vertical gap={16}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
              >
                {language === "vi" ? "Làm mới" : "Refresh"}
              </Button>
            </Space>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
              />
            )}

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Spin />
              </div>
            ) : (
              <UserListTable users={users} onRefresh={fetchUsers} />
            )}
          </Flex>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {t("sidebar.user_management", language)}
            </h1>
            <p className="text-gray-600 mt-2">
              {language === "vi"
                ? "Quản lý tài khoản người dùng trong hệ thống"
                : "Manage user accounts in the system"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <Card>
        <Tabs
          items={tabs}
          defaultActiveKey="create"
        />
      </Card>
    </div>
  )
}