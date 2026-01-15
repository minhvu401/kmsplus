"use client"

import { useEffect, useState } from "react"
import { Card, Tabs, Spin, Alert, Button, Space, Flex } from "antd"
import { ReloadOutlined } from "@ant-design/icons"
import CreateUserForm from "@/components/forms/create-user-form"
import UserListTable from "@/components/forms/user-list-table"
import { getAllUsersForManagementAction } from "@/action/user/userManagementActions"

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
    { id: 3, name: "TrainingManager" },
    { id: 4, name: "Admin" },
    { id: 5, name: "DashboardViewer" },
  ]

  const tabs = [
    {
      key: "create",
      label: "Create User Account",
      children: (
        <Card style={{ marginTop: "20px" }}>
          <CreateUserForm
            roles={availableRoles}
            onSuccess={() => {
              // Refresh user list after successful creation
              setTimeout(() => fetchUsers(), 1000)
            }}
          />
        </Card>
      ),
    },
    {
      key: "manage",
      label: "Manage Users",
      children: (
        <Card style={{ marginTop: "20px" }}>
          <Flex vertical gap={16}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>

            {error && <Alert message={error} type="error" showIcon />}

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin />
              </div>
            ) : (
              <UserListTable users={users} onRefresh={fetchUsers} />
            )}
          </Flex>
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>User Management</h1>
      <Tabs items={tabs} defaultActiveKey="create" />
    </div>
  )
}
