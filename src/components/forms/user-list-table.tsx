"use client"

import { useState, useActionState, useEffect } from "react"
import {
  Table,
  Button,
  Modal,
  message,
  Select,
  Space,
  Tag,
  Popconfirm,
  Input,
  Form,
} from "antd"
import { SearchOutlined } from "@ant-design/icons"
import {
  UserManagementState,
  banUserAction,
  updateUserInfoAction,
} from "@/action/user/userManagementActions"
import { RoleConfig } from "@/enum/role.enum"

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: Date
  department_name?: string
  role_name?: string
  role_id?: string
  is_active?: string | boolean
}

interface UserListTableProps {
  users: User[]
  onRefresh?: () => void
  onSearch?: (query: string) => void
}

export default function UserListTable({
  users,
  onRefresh,
  onSearch,
}: UserListTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editForm] = Form.useForm()

  // Helper function to check if user is active
  const isUserActive = (status: string | boolean | undefined) => {
    if (status === undefined || status === null) return false
    if (typeof status === "boolean") return status
    if (typeof status === "string") {
      return (
        status.toLowerCase() === "true" ||
        status.toLowerCase() === "active" ||
        status === "1"
      )
    }
    return false
  }

  // Update info action
  const initialUpdateInfoState: UserManagementState = {
    success: false,
    message: "",
  }

  const [updateInfoState, updateUserInfoActionDispatch] = useActionState(
    updateUserInfoAction,
    initialUpdateInfoState
  )

  // Ban user action
  const initialBanState: UserManagementState = {
    success: false,
    message: "",
  }

  const [banState, banUserActionFunc] = useActionState(
    banUserAction,
    initialBanState
  )

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    editForm.setFieldsValue({
      email: user.email,
      fullName: user.full_name,
    })
    setIsEditModalVisible(true)
  }

  // Handle save user info
  const handleSaveUserInfo = async (values: any) => {
    if (!selectedUser) return

    setIsLoading(true)

    const formData = new FormData()
    formData.append("userId", selectedUser.id)
    formData.append("email", values.email)
    formData.append("fullName", values.fullName)

    console.log("Submitting update with:", {
      userId: selectedUser.id,
      email: values.email,
      fullName: values.fullName,
    })

    await updateUserInfoActionDispatch(formData)
  }

  // Handle update info state - success
  useEffect(() => {
    if (updateInfoState.success) {
      message.success(updateInfoState.message || "User updated successfully")
      setIsEditModalVisible(false)
      editForm.resetFields()
      setIsLoading(false)
      onRefresh?.()
    }
  }, [updateInfoState.success, updateInfoState.message])

  // Handle update info state - error
  useEffect(() => {
    if (!updateInfoState.success && updateInfoState.message) {
      message.error(updateInfoState.message)
      setIsLoading(false)
    }
  }, [updateInfoState.message, updateInfoState.success])

  // Handle ban user
  const handleBanUser = async (
    userId: string,
    currentStatus: string | boolean
  ) => {
    const formData = new FormData()
    formData.append("userId", userId)
    const statusString =
      typeof currentStatus === "boolean"
        ? currentStatus
          ? "active"
          : "inactive"
        : currentStatus

    formData.append("currentStatus", statusString)

    await banUserActionFunc(formData)
  }

  // Handle ban state - success
  useEffect(() => {
    if (banState.success && banState.message) {
      message.success(banState.message)
      onRefresh?.()
    }
  }, [banState.success, banState.message])

  // Handle ban state - error
  useEffect(() => {
    if (!banState.success && banState.message) {
      message.error(banState.message)
    }
  }, [banState.message, banState.success])

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Table columns
  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => <span>{text}</span>,
      sorter: (a: User, b: User) => a.email.localeCompare(b.email),
    },
    {
      title: "Full Name",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => <span>{text}</span>,
      sorter: (a: User, b: User) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (text: string) => {
        const roleEntry = Object.entries(RoleConfig).find(
          ([role, config]) => config.name === text
        )
        const label = roleEntry ? roleEntry[1].label : text
        return <Tag color="blue">{label}</Tag>
      },
      sorter: (a: User, b: User) =>
        (a.role_name || "").localeCompare(b.role_name || ""),
    },
    {
      title: "Department",
      dataIndex: "department_name",
      key: "department_name",
      render: (text: string | undefined) => <span>{text || "-"}</span>,
      sorter: (a: User, b: User) =>
        (a.department_name || "").localeCompare(b.department_name || ""),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: string | boolean) => {
        const active = isUserActive(isActive)
        return (
          <Tag color={active ? "green" : "red"}>
            {active ? "Active" : "Inactive"}
          </Tag>
        )
      },
      sorter: (a: User, b: User) => {
        const aActive = isUserActive(a.is_active) ? 1 : 0
        const bActive = isUserActive(b.is_active) ? 1 : 0
        return aActive - bActive
      },
    },
    {
      title: "Created Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string | Date) => {
        const date = new Date(text)
        return date.toLocaleDateString("vi-VN")
      },
      sorter: (a: User, b: User) => {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: User) => {
        const active = isUserActive(record.is_active)
        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              onClick={() => handleEditUser(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title={active ? "Deactivate Account" : "Activate Account"}
              description={
                active
                  ? "Are you sure you want to deactivate this account?"
                  : "Are you sure you want to activate this account?"
              }
              onConfirm={() =>
                handleBanUser(record.id, record.is_active ?? "inactive")
              }
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: active }}
            >
              <Button danger={active} size="small">
                {active ? "Deactivate" : "Activate"}
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Input
        placeholder="Search by email or name..."
        prefix={<SearchOutlined />}
        style={{ marginBottom: 16 }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        allowClear
      />

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />

      {/* Edit User Modal */}
      <Modal
        title="Edit User Information"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        confirmLoading={isLoading}
        okText="Save"
        onOk={() => editForm.submit()}
      >
        {selectedUser && (
          <Form form={editForm} layout="vertical" onFinish={handleSaveUserInfo}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: "Please enter full name" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  )
}
