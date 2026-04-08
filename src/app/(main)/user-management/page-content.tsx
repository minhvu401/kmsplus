// src/app/(main)/user-management/page-content.tsx
"use client"

import { useEffect, useState } from "react"
import {
  Card,
  Tabs,
  Spin,
  Alert,
  Button,
  Space,
  Flex,
  Avatar,
  Empty,
  Modal,
  Select,
  message,
} from "antd"
import {
  ReloadOutlined,
  UserAddOutlined,
  TeamOutlined,
  ApartmentOutlined,
  UserOutlined,
} from "@ant-design/icons"
import CreateUserForm from "@/components/forms/create-user-form"
import UserListTable from "@/components/forms/user-list-table"
import { getAllUsersForManagementAction } from "@/action/user/userManagementActions"
import {
  getDepartmentsWithHeads,
  assignHeadOfDepartment,
  getEligibleHeadsForDepartment,
  getAllDepartments,
} from "@/action/department/departmentActions"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"
import useUserStore from "@/store/useUserStore"

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: Date
  department_name?: string
  role_name?: string
  role_id?: string
  status?: string
}

interface DepartmentWithHead {
  id: number
  name: string
  head_of_department_id: number | null
  head_name: string | null
  head_avatar_url: string | null
}

interface DepartmentOption {
  id: number
  name: string
}

interface EligibleHeadOption {
  id: number
  full_name: string
  avatar_url: string | null
}

export default function UserManagementPageContent() {
  const { language } = useLanguageStore()
  const { user: currentUser } = useUserStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departmentRows, setDepartmentRows] = useState<DepartmentWithHead[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [departmentLoading, setDepartmentLoading] = useState(false)
  const [departmentError, setDepartmentError] = useState<string | null>(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentWithHead | null>(null)
  const [selectedHeadUserId, setSelectedHeadUserId] = useState<string>()
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [eligibleHeads, setEligibleHeads] = useState<EligibleHeadOption[]>([])
  const [eligibleHeadsLoading, setEligibleHeadsLoading] = useState(false)

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

  const fetchDepartmentsWithHead = async () => {
    setDepartmentLoading(true)
    setDepartmentError(null)

    try {
      const rows = await getDepartmentsWithHeads()
      setDepartmentRows(rows || [])
    } catch (err: any) {
      setDepartmentError(
        err?.message ||
          (language === "vi"
            ? "Không thể tải danh sách phân công trưởng phòng"
            : "Failed to fetch head-of-department assignments")
      )
    } finally {
      setDepartmentLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const rows = await getAllDepartments()
      setDepartments(rows || [])
    } catch (err: any) {
      message.error(
        err?.message ||
          (language === "vi"
            ? "Không thể tải danh sách phòng ban"
            : "Failed to fetch departments")
      )
      setDepartments([])
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "?"
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?"
    )
  }

  const openAssignModal = async (department: DepartmentWithHead) => {
    setSelectedDepartment(department)
    setSelectedHeadUserId(
      department.head_of_department_id
        ? String(department.head_of_department_id)
        : undefined
    )
    setEligibleHeadsLoading(true)

    try {
      const rows = await getEligibleHeadsForDepartment(department.id)
      setEligibleHeads(rows || [])
    } catch (err: any) {
      setEligibleHeads([])
      message.error(
        err?.message ||
          (language === "vi"
            ? "Không thể tải danh sách ứng viên trưởng phòng"
            : "Failed to fetch eligible head candidates")
      )
    } finally {
      setEligibleHeadsLoading(false)
    }

    setAssignModalOpen(true)
  }

  const handleAssignHead = async () => {
    if (!selectedDepartment) return
    if (!selectedHeadUserId) {
      message.warning(
        language === "vi"
          ? "Vui lòng chọn trưởng phòng"
          : "Please select a head of department"
      )
      return
    }

    setAssignSubmitting(true)
    try {
      const result = await assignHeadOfDepartment(
        selectedDepartment.id,
        Number(selectedHeadUserId)
      )

      if (result.success) {
        message.success(
          language === "vi" ? "Cập nhật thành công" : "Updated successfully"
        )
        setAssignModalOpen(false)
        setSelectedDepartment(null)
        setEligibleHeads([])
        await fetchDepartmentsWithHead()
      } else {
        message.error(
          result.message ||
            (language === "vi"
              ? "Không thể cập nhật trưởng phòng"
              : "Failed to update head of department")
        )
      }
    } catch (err: any) {
      message.error(
        err?.message ||
          (language === "vi"
            ? "Không thể cập nhật trưởng phòng"
            : "Failed to update head of department")
      )
    } finally {
      setAssignSubmitting(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
    fetchDepartmentsWithHead()
    fetchDepartments()
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
            departments={departments}
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
              <UserListTable 
                users={users} 
                onRefresh={fetchUsers}
                currentUserId={currentUser?.id}
                departments={departments}
              />
            )}
          </Flex>
        </div>
      ),
    },
    {
      key: "assign-hod",
      label:
        language === "vi"
          ? "Phân công trưởng phòng"
          : "Assign Head of Department",
      icon: <ApartmentOutlined />,
      children: (
        <div className="pt-4">
          <Flex vertical gap={16}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchDepartmentsWithHead}
                loading={departmentLoading}
              >
                {language === "vi" ? "Làm mới" : "Refresh"}
              </Button>
            </Space>

            {departmentError && (
              <Alert message={departmentError} type="error" showIcon closable />
            )}

            {departmentLoading ? (
              <div className="flex justify-center items-center py-10">
                <Spin />
              </div>
            ) : departmentRows.length === 0 ? (
              <Empty
                description={
                  language === "vi"
                    ? "Không có phòng ban để hiển thị"
                    : "No departments to display"
                }
              />
            ) : (
              <div className="space-y-3">
                {departmentRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-xs text-gray-500">
                        {language === "vi" ? "Phòng ban" : "Department"}
                      </p>
                      <p className="font-medium text-gray-900">{row.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar
                        src={row.head_avatar_url || undefined}
                        icon={!row.head_avatar_url ? <UserOutlined /> : undefined}
                      >
                        {!row.head_avatar_url ? getInitials(row.head_name) : null}
                      </Avatar>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {language === "vi"
                            ? "Trưởng phòng hiện tại"
                            : "Current Head of Department"}
                        </p>
                        <p className="font-medium text-gray-900">
                          {row.head_name ||
                            (language === "vi" ? "Chưa phân công" : "Unassigned")}
                        </p>
                      </div>
                      <Button
                        size="small"
                        onClick={() => openAssignModal(row)}
                      >
                        {row.head_of_department_id
                          ? language === "vi"
                            ? "Đổi"
                            : "Reassign"
                          : language === "vi"
                          ? "Phân công"
                          : "Assign"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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

      <Modal
        title={
          language === "vi"
            ? "Phân công trưởng phòng"
            : "Assign Head of Department"
        }
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false)
          setSelectedDepartment(null)
          setEligibleHeads([])
        }}
        onOk={handleAssignHead}
        okText={language === "vi" ? "Lưu" : "Save"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
        confirmLoading={assignSubmitting}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {language === "vi" ? "Phòng ban" : "Department"}: {" "}
            <span className="font-medium text-gray-900">
              {selectedDepartment?.name || "-"}
            </span>
          </p>

          <Select
            showSearch
            placeholder={
              language === "vi"
                ? "Chọn trưởng phòng"
                : "Select head of department"
            }
            value={selectedHeadUserId}
            onChange={(value) => setSelectedHeadUserId(value)}
            optionFilterProp="label"
            className="w-full"
            loading={eligibleHeadsLoading}
            options={eligibleHeads.map((user) => ({
              value: String(user.id),
              label: user.full_name,
            }))}
          />
          {!eligibleHeadsLoading && eligibleHeads.length === 0 && (
            <p className="text-xs text-gray-500">
              {language === "vi"
                ? "Không có Training Manager thuộc phòng ban này"
                : "No Training Manager found in this department"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}