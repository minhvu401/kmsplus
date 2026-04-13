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
  Input,
  Divider,
  Typography,
} from "antd"
import {
  ReloadOutlined,
  UserAddOutlined,
  TeamOutlined,
  ApartmentOutlined,
  UserOutlined,
  SearchOutlined,
  ClearOutlined,
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
import { Role, RoleConfig } from "@/enum/role.enum"

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: Date
  department_id?: number
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

  // Filter states
  const [searchInput, setSearchInput] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedDepartmentsList, setSelectedDepartmentsList] = useState<
    string[]
  >([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

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
        err?.message || t("user_mgmt.msg_fetch_failed", language)
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
      message.error(err?.message || t("user_mgmt.msg_fetch_failed", language))
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

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("")
    setSelectedRoles([])
    setSelectedDepartmentsList([])
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
      message.error(err?.message || t("user_mgmt.msg_fetch_failed", language))
    } finally {
      setEligibleHeadsLoading(false)
    }

    setAssignModalOpen(true)
  }

  const handleAssignHead = async () => {
    if (!selectedDepartment) return
    if (!selectedHeadUserId) {
      message.warning(t("user_mgmt.msg_select_hod", language))
      return
    }

    setAssignSubmitting(true)
    try {
      const result = await assignHeadOfDepartment(
        selectedDepartment.id,
        Number(selectedHeadUserId)
      )

      if (result.success) {
        message.success(t("user_mgmt.msg_success", language))
        setAssignModalOpen(false)
        setSelectedDepartment(null)
        setEligibleHeads([])
        await fetchDepartmentsWithHead()
      } else {
        message.error(result.message || t("user_mgmt.msg_failed", language))
      }
    } catch (err: any) {
      message.error(err?.message || t("user_mgmt.msg_failed", language))
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

  // Filter users whenever users data or filters change
  useEffect(() => {
    const filtered = users.filter((user) => {
      // Search filter - check email, full_name
      const searchLower = searchInput.toLowerCase()
      const matchesSearch =
        searchInput === "" ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower)

      // Role filter
      const matchesRole =
        selectedRoles.length === 0 ||
        (user.role_name && selectedRoles.includes(user.role_name))

      // Department filter
      const matchesDepartment =
        selectedDepartmentsList.length === 0 ||
        (user.department_id &&
          selectedDepartmentsList.includes(String(user.department_id)))

      return matchesSearch && matchesRole && matchesDepartment
    })

    setFilteredUsers(filtered)
  }, [users, searchInput, selectedRoles, selectedDepartmentsList])

  // Get available roles from RoleConfig
  const availableRoles = Object.entries(RoleConfig).map(([key, config]) => ({
    id: config.id,
    name: config.name,
  }))

  const tabs = [
    {
      key: "create",
      label: t("user_mgmt.tab_create", language),
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
      label: t("user_mgmt.tab_manage", language),
      icon: <TeamOutlined />,
      children: (
        <div className="pt-4">
          <Flex vertical gap={16}>
            {/* Filter Card */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="space-y-3">
                {/* Search Bar - Full Width */}
                <Input.Search
                  placeholder={t("user_mgmt.search_placeholder", language)}
                  prefix={<SearchOutlined />}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  size="middle"
                  allowClear
                  enterButton={<SearchOutlined />}
                  style={{ marginBottom: 12 }}
                />

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Typography.Text
                      type="secondary"
                      className="text-sm font-medium mb-2"
                    >
                      {t("user_mgmt.filter_role", language)}
                    </Typography.Text>
                    <Select
                      mode="multiple"
                      placeholder={t(
                        "user_mgmt.filter_role_placeholder",
                        language
                      )}
                      value={selectedRoles}
                      onChange={setSelectedRoles}
                      showSearch
                      optionFilterProp="label"
                      options={availableRoles.map((role) => ({
                        label: role.name,
                        value: role.name,
                      }))}
                      maxTagCount="responsive"
                      size="middle"
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Typography.Text
                      type="secondary"
                      className="text-sm font-medium mb-2"
                    >
                      {t("user_mgmt.filter_department", language)}
                    </Typography.Text>
                    <Select
                      mode="multiple"
                      placeholder={t(
                        "user_mgmt.filter_department_placeholder",
                        language
                      )}
                      value={selectedDepartmentsList}
                      onChange={setSelectedDepartmentsList}
                      showSearch
                      optionFilterProp="label"
                      options={departments.map((dept) => ({
                        label: dept.name,
                        value: String(dept.id),
                      }))}
                      maxTagCount="responsive"
                      size="middle"
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <Button
                      icon={<ClearOutlined />}
                      onClick={handleClearFilters}
                      size="middle"
                    >
                      {t("user_mgmt.btn_clear_filters", language)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
              >
                {t("user_mgmt.btn_refresh", language)}
              </Button>
            </Space>

            {error && <Alert message={error} type="error" showIcon closable />}

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Spin />
              </div>
            ) : (
              <UserListTable
                users={filteredUsers}
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
      label: t("user_mgmt.tab_assign_hod", language),
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
                {t("user_mgmt.btn_refresh", language)}
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
              <Empty description={t("user_mgmt.no_departments", language)} />
            ) : (
              <div className="space-y-3">
                {departmentRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("user_mgmt.label_department", language)}
                      </p>
                      <p className="font-medium text-gray-900">{row.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar
                        src={row.head_avatar_url || undefined}
                        icon={
                          !row.head_avatar_url ? <UserOutlined /> : undefined
                        }
                      >
                        {!row.head_avatar_url
                          ? getInitials(row.head_name)
                          : null}
                      </Avatar>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {t("user_mgmt.label_current_hod", language)}
                        </p>
                        <p className="font-medium text-gray-900">
                          {row.head_name || t("user_mgmt.unassigned", language)}
                        </p>
                      </div>
                      <Button size="small" onClick={() => openAssignModal(row)}>
                        {row.head_of_department_id
                          ? t("user_mgmt.btn_reassign", language)
                          : t("user_mgmt.btn_assign", language)}
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
              {t("user_mgmt.page_subtitle", language)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <Card>
        <Tabs items={tabs} defaultActiveKey="create" />
      </Card>

      <Modal
        title={t("user_mgmt.modal_title_assign_hod", language)}
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false)
          setSelectedDepartment(null)
          setEligibleHeads([])
        }}
        onOk={handleAssignHead}
        okText={t("common.save", language)}
        cancelText={t("common.cancel", language)}
        confirmLoading={assignSubmitting}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {t("user_mgmt.modal_label_department", language)}:{" "}
            <span className="font-medium text-gray-900">
              {selectedDepartment?.name || "-"}
            </span>
          </p>

          <Select
            showSearch
            placeholder={t("user_mgmt.modal_select_hod", language)}
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
              {t("user_mgmt.modal_no_managers", language)}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
