"use client"

import { useState, useActionState, useEffect, startTransition } from "react"
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
  updateUserWithRoleAction,
} from "@/action/user/userManagementActions"
import { RoleConfig } from "@/enum/role.enum"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: Date
  department_name?: string
  department_id?: number
  role_name?: string
  role_id?: string
  status?: string
}

interface UserListTableProps {
  users: User[]
  onRefresh?: () => void
  onSearch?: (query: string) => void
  currentUserId?: string
  departments?: { id: number; name: string }[]
}

export default function UserListTable({
  users,
  onRefresh,
  onSearch,
  currentUserId,
  departments = [],
}: UserListTableProps) {
  const language = useLanguageStore((state) => state.language)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editForm] = Form.useForm()

  // Helper function to check if user is active
  const isUserActive = (status: string | undefined) => {
    return status?.toLowerCase() === "active"
  }

  // Update user with role action
  const initialUpdateInfoState: UserManagementState = {
    success: false,
    message: "",
  }

  const [updateInfoState, updateUserActionDispatch] = useActionState(
    updateUserWithRoleAction,
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
    setSelectedRole(user.role_id ? parseInt(user.role_id) : null)
    editForm.setFieldsValue({
      email: user.email,
      fullName: user.full_name,
      roleId: user.role_id ? parseInt(user.role_id) : undefined,
      departmentId: user.department_id ? parseInt(String(user.department_id)) : undefined,
    })
    setIsEditModalVisible(true)
  }

  // Handle save user info with role and department
  const handleSaveUserInfo = (values: any) => {
    if (!selectedUser) return

    setIsLoading(true)

    const formData = new FormData()
    formData.append("userId", selectedUser.id)
    formData.append("email", values.email)
    formData.append("fullName", values.fullName)
    if (values.roleId) {
      formData.append("roleId", values.roleId)
    }
    if (values.departmentId) {
      formData.append("departmentId", values.departmentId)
    }

    startTransition(() => {
      updateUserActionDispatch(formData)
    })
  }

  // Handle update info state - success
  useEffect(() => {
    if (updateInfoState.success) {
      message.success(updateInfoState.message || t("user.updated_success", language))
      setIsEditModalVisible(false)
      editForm.resetFields()
      setIsLoading(false)
      onRefresh?.()
    }
  }, [updateInfoState.success, updateInfoState.message, language])

  // Handle update info state - error
  useEffect(() => {
    if (!updateInfoState.success && updateInfoState.message) {
      message.error(updateInfoState.message)
      setIsLoading(false)
    }
  }, [updateInfoState.message, updateInfoState.success])

  // Handle ban user
  const handleBanUser = (
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

    startTransition(() => {
      banUserActionFunc(formData)
    })
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
      title: t("user.table_email", language),
      dataIndex: "email",
      key: "email",
      render: (text: string) => <span>{text}</span>,
      sorter: (a: User, b: User) => a.email.localeCompare(b.email),
    },
    {
      title: t("user.table_full_name", language),
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => <span>{text}</span>,
      sorter: (a: User, b: User) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: t("user.table_role", language),
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
      title: t("user.table_department", language),
      dataIndex: "department_name",
      key: "department_name",
      render: (text: string | undefined) => <span>{text || "-"}</span>,
      sorter: (a: User, b: User) =>
        (a.department_name || "").localeCompare(b.department_name || ""),
    },
    {
      title: t("user.table_status", language),
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const active = isUserActive(status)
        return (
          <Tag color={active ? "green" : "red"}>
            {active
              ? t("user.status_active", language)
              : t("user.status_inactive", language)}
          </Tag>
        )
      },
      sorter: (a: User, b: User) => {
        const aActive = isUserActive(a.status) ? 1 : 0
        const bActive = isUserActive(b.status) ? 1 : 0
        return aActive - bActive
      },
    },
    {
      title: t("user.table_created_date", language),
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
      title: t("user.table_actions", language),
      key: "actions",
      render: (_: any, record: User) => {
        const active = isUserActive(record.status)
        const isCurrentUser = currentUserId === record.id
        const isAdminUser = record.role_name === "Admin"
        const isCurrentAdmin = isCurrentUser && isAdminUser

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              onClick={() => handleEditUser(record)}
              disabled={isCurrentAdmin}
              title={isCurrentAdmin ? t("user.cannot_edit_own", language) : ""}
            >
              {t("user.btn_edit", language)}
            </Button>
            <Popconfirm
              title={
                active
                  ? t("user.confirm_deactivate", language)
                  : t("user.confirm_activate", language)
              }
              description={
                active
                  ? t("user.confirm_deactivate_msg", language)
                  : t("user.confirm_activate_msg", language)
              }
              onConfirm={() =>
                handleBanUser(record.id, record.status ?? "inactive")
              }
              okText={t("common.yes", language)}
              cancelText={t("common.no", language)}
              okButtonProps={{ danger: active }}
              disabled={isCurrentAdmin && active}
            >
              <Button
                danger={active}
                size="small"
                disabled={isCurrentAdmin && active}
                title={
                  isCurrentAdmin && active
                    ? t("user.cannot_deactivate_admin", language)
                    : ""
                }
              >
                {active
                  ? t("user.btn_deactivate", language)
                  : t("user.btn_activate", language)}
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
        placeholder={t("user.search_placeholder", language)}
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
        title={t("user.modal_edit_title", language)}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        confirmLoading={isLoading}
        okText={t("common.save", language)}
        cancelText={t("common.cancel", language)}
        onOk={() => editForm.submit()}
      >
        {selectedUser && (
          <Form form={editForm} layout="vertical" onFinish={handleSaveUserInfo}>
            <Form.Item
              label={t("user.form_email", language)}
              name="email"
              rules={[
                { required: true, message: t("form.please_enter", language) + " " + t("user.form_email", language) },
                { type: "email", message: t("form.invalid_email", language) },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t("user.form_full_name", language)}
              name="fullName"
              rules={[{ required: true, message: t("form.please_enter", language) + " " + t("user.form_full_name", language) }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t("user.form_role", language)}
              name="roleId"
              rules={[{ required: true, message: t("form.please_select", language) + " " + t("user.form_role", language) }]}
            >
              <Select
                placeholder={t("common.select_placeholder", language)}
                options={Object.entries(RoleConfig).map(([_, config]) => ({
                  label: config.label,
                  value: config.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={t("user.form_department", language)}
              name="departmentId"
              rules={[{ required: true, message: t("form.please_select", language) + " " + t("user.form_department", language) }]}
            >
              <Select
                placeholder={t("common.select_placeholder", language)}
                options={departments.map((dept) => ({
                  label: dept.name,
                  value: dept.id,
                }))}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  )
}
