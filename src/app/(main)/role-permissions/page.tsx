// src/app/(main)/role-permissions/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  Card,
  Checkbox,
  Button,
  Space,
  message,
  Modal,
  Spin,
} from "antd"
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import { rolePermissionsMap } from "@/config/RolePermission.config"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import {
  updateRolePermissionsAction,
  getRolePermissionsAction,
  getTableSchemaAction,
} from "@/action/role-permissions/rolePermissionActions"

interface PermissionGroup {
  module: Permission
  moduleKey: string
  permissions: Permission[]
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: Permission.LOGIN,
    moduleKey: "module.authentication",
    permissions: [Permission.LOGIN, Permission.LOGOUT, Permission.VIEW_PROFILE],
  },
  {
    module: Permission.READ_ARTICLE,
    moduleKey: "module.article",
    permissions: [
      Permission.VIEW_ARTICLE_LIST,
      Permission.SEARCH_ARTICLE,
      Permission.READ_ARTICLE,
      Permission.CREATE_ARTICLE,
      Permission.UPDATE_ARTICLE,
      Permission.DELETE_ARTICLE,
      Permission.COMMENT_ARTICLE,
      Permission.EDIT_ARTICLE_COMMENT,
      Permission.DELETE_ARTICLE_COMMENT,
      Permission.APPROVE_ARTICLE,
    ],
  },
  {
    module: Permission.READ_QUESTION,
    moduleKey: "module.question",
    permissions: [
      Permission.VIEW_QUESTION_LIST,
      Permission.SEARCH_QUESTION,
      Permission.READ_QUESTION,
      Permission.CREATE_QUESTION,
      Permission.UPDATE_QUESTION,
      Permission.DELETE_QUESTION,
      Permission.CREATE_ANSWER,
      Permission.EDIT_ANSWER,
      Permission.DELETE_ANSWER,
      Permission.OPEN_QUESTION,
      Permission.CLOSE_QUESTION,
      Permission.SHARE_QUESTION,
    ],
  },
  {
    module: Permission.READ_COURSE,
    moduleKey: "module.course",
    permissions: [
      Permission.CREATE_COURSE,
      Permission.VIEW_COURSE_LIST,
      Permission.SEARCH_COURSE,
      Permission.READ_COURSE,
      Permission.UPDATE_COURSE,
      Permission.DELETE_COURSE,
      Permission.ENROLL_COURSE,
      Permission.REVIEW_COURSE,
      Permission.APPROVE_COURSE,
      Permission.VIEW_COURSE_STATISTICS,
    ],
  },
  {
    module: Permission.CREATE_QUIZ,
    moduleKey: "module.quiz",
    permissions: [
      Permission.CREATE_QUIZ,
      Permission.VIEW_QUIZ,
      Permission.UPDATE_QUIZ,
      Permission.DELETE_QUIZ,
      Permission.CREATE_QUIZ_QUESTION,
      Permission.EDIT_QUIZ_QUESTION,
      Permission.DELETE_QUIZ_QUESTION,
      Permission.VIEW_QUIZ_QUESTION,
      Permission.VIEW_QUIZ_LIST,
      Permission.PARTICIPATE_QUIZ,
      Permission.VIEW_QUIZ_RESULT,
    ],
  },
  {
    module: Permission.VIEW_QUESTION_BANK,
    moduleKey: "module.learning",
    permissions: [
      Permission.VIEW_QUESTION_BANK,
      Permission.VIEW_PERSONAL_PROGRESS,
    ],
  },
  {
    module: Permission.CREATE_ACCOUNT,
    moduleKey: "module.user",
    permissions: [
      Permission.CREATE_ACCOUNT,
      Permission.VIEW_ACCOUNT_LIST,
      Permission.UPDATE_ACCOUNT,
      Permission.DEACTIVATE_ACCOUNT,
      Permission.SEARCH_ACCOUNT,
      Permission.MANAGE_USERS,
    ],
  },
  {
    module: Permission.CREATE_CATEGORY,
    moduleKey: "module.category",
    permissions: [
      Permission.CREATE_CATEGORY,
      Permission.VIEW_CATEGORY_LIST,
      Permission.UPDATE_CATEGORY,
      Permission.DELETE_CATEGORY,
      Permission.SEARCH_CATEGORY,
    ],
  },
  {
    module: Permission.MONITOR_ACTIVITY,
    moduleKey: "module.admin",
    permissions: [
      Permission.MONITOR_ACTIVITY,
      Permission.VIEW_STATISTICS,
      Permission.EXPORT_DATA,
    ],
  },
  {
    module: Permission.LANGUAGE_SETTING,
    moduleKey: "module.settings",
    permissions: [
      Permission.LANGUAGE_SETTING,
      Permission.VIEW_ROLE_PERMISSION,
      Permission.EDIT_ROLE_PERMISSION,
      Permission.MODERATE_CONTENT,
      Permission.AI_EXPLANATION,
      Permission.AI_RECOMMENDATION,
    ],
  },
]

const ROLE_ORDER = [
  Role.EMPLOYEE,
  Role.DASHBOARD_VIEWER,
  Role.CONTRIBUTOR,
  Role.TRAINING_MANAGER,
  Role.DIRECTOR,
  Role.ADMIN,
]

// Helper function to get correct translation key for role names
const getRoleTranslationKey = (role: Role): string => {
  const roleMap: Record<Role, string> = {
    [Role.EMPLOYEE]: "employee",
    [Role.CONTRIBUTOR]: "contributor",
    [Role.TRAINING_MANAGER]: "trainingmanager",
    [Role.DIRECTOR]: "director",
    [Role.ADMIN]: "admin",
    [Role.DASHBOARD_VIEWER]: "dashboardviewer",
  }
  return `role.${roleMap[role]}`
}

export default function RolePermissionPage() {
  const { language } = useLanguageStore()
  const [permissions, setPermissions] = useState<Record<Role, Permission[]>>({
    ...rolePermissionsMap,
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load permissions from database on component mount
  useEffect(() => {
    const loadRolePermissions = async () => {
      try {
        setIsLoading(true)

        const result = await getRolePermissionsAction()

        if (result.success && result.data) {
          // Convert database data to match state format
          const dbPermissions: Record<Role, Permission[]> = {
            [Role.EMPLOYEE]: [],
            [Role.CONTRIBUTOR]: [],
            [Role.TRAINING_MANAGER]: [],
            [Role.DASHBOARD_VIEWER]: [],
            [Role.DIRECTOR]: [],
            [Role.ADMIN]: [],
          }

          // Populate with data from DB
          // Database returns role names as strings (e.g., "EMPLOYEE", "EMPLOYEE", "ADMIN")
          // Map them to Role enum values
          Object.entries(result.data).forEach(([roleKey, permissions]) => {
            // Find matching role from enum - handle both uppercase and proper case formats
            const roleEnum = Object.values(Role).find(
              (r) =>
                r.toUpperCase().replace(/\s+/g, "_") ===
                roleKey.toUpperCase().replace(/\s+/g, "_")
            )
            if (roleEnum) {
              // Convert permission names from lowercase (DB format) to uppercase (enum format)
              const permArray = Array.isArray(permissions) ? permissions : []
              const normalizedPermissions = permArray.map((p: string) =>
                p.toUpperCase()
              ) as Permission[]
              dbPermissions[roleEnum as Role] = normalizedPermissions
            }
          })

          setPermissions(dbPermissions)
          setHasChanges(false)
        } else {
          // If database fetch fails, use config file as fallback
          setPermissions({ ...rolePermissionsMap })
        }
      } catch (error) {
        // Fallback to config file
        setPermissions({ ...rolePermissionsMap })
        message.warning(
          language === "vi"
            ? "Không thể tải quyền từ database, sử dụng cấu hình mặc định"
            : "Failed to load permissions from database, using default config"
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadRolePermissions()
  }, [])

  const handlePermissionChange = (
    role: Role,
    permission: Permission,
    checked: boolean
  ) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      if (checked) {
        if (!updated[role].includes(permission)) {
          updated[role] = [...updated[role], permission]
        }
      } else {
        updated[role] = updated[role].filter((p) => p !== permission)
      }
      setHasChanges(true)
      return updated
    })
  }

  const handleSave = async () => {
    // Use window.confirm() instead of Modal.confirm() due to React 19 compatibility issues
    const confirmed = window.confirm(
      language === "vi"
        ? "Bạn có chắc chắn muốn lưu những thay đổi này? Điều này sẽ ảnh hưởng đến toàn bộ hệ thống."
        : "Are you sure you want to save these changes? This will affect the entire system."
    )

    if (!confirmed) {
      return
    }

    try {
      setIsSaving(true)

      // Send role names as-is (they are already in proper case from Role enum)
      // Database stores roles as "Admin", "Contributor", "Training Manager", etc.
      // Convert permission names to lowercase (database stores them lowercase: login, logout, etc.)
      const normalizedPermissions: Record<string, string[]> = {}
      Object.entries(permissions).forEach(([role, perms]) => {
        // Convert permission names to lowercase to match database format
        const lowercasePerms = perms.map((p: string) => p.toLowerCase())
        normalizedPermissions[role] = lowercasePerms
      })

      const result = await updateRolePermissionsAction(normalizedPermissions)

      if (result.success) {
        message.success(
          language === "vi"
            ? "Lưu quyền thành công"
            : "Permissions saved successfully"
        )
        setHasChanges(false)

        // Reload permissions from DB to verify save
        const reloadResult = await getRolePermissionsAction()
        if (reloadResult.success && reloadResult.data) {
          const dbPermissions: Record<Role, Permission[]> = {
            [Role.EMPLOYEE]: [],
            [Role.CONTRIBUTOR]: [],
            [Role.TRAINING_MANAGER]: [],
            [Role.DASHBOARD_VIEWER]: [],
            [Role.DIRECTOR]: [],
            [Role.ADMIN]: [],
          }

          Object.entries(reloadResult.data).forEach(
            ([roleKey, permissions]) => {
              const roleEnum = Object.values(Role).find(
                (r) =>
                  r.toUpperCase().replace(/\s+/g, "_") ===
                  roleKey.toUpperCase().replace(/\s+/g, "_")
              )
              if (roleEnum) {
                const permArray = Array.isArray(permissions) ? permissions : []
                const normalizedPermissions = permArray.map((p: string) =>
                  p.toUpperCase()
                ) as Permission[]
                dbPermissions[roleEnum as Role] = normalizedPermissions
              }
            }
          )

          setPermissions(dbPermissions)
        }
      } else {
        message.error(result.message)
      }
    } catch (error) {
      console.error("Error saving permissions:", error)
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "N/A"
      )
      message.error(
        language === "vi" ? "Lỗi khi lưu quyền" : "Error saving permissions"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setPermissions({ ...rolePermissionsMap })
    setHasChanges(false)
    message.info(
      language === "vi" ? "Đã đặt lại về mặc định" : "Reset to default"
    )
  }

  const dataSource = PERMISSION_GROUPS.flatMap((group, groupIndex) => [
    {
      key: `group-${groupIndex}`,
      isGroup: true,
      module: t(group.moduleKey, language),
      children: group.permissions,
    },
    ...group.permissions.map((perm, permIndex) => ({
      key: `${groupIndex}-${permIndex}`,
      isGroup: false,
      module: t(`permission.${perm.toLowerCase()}`, language),
      permission: perm,
      groupIndex,
    })),
  ])

  const columns = [
    {
      title: t("sidebar.role_permission", language),
      dataIndex: "module",
      key: "module",
      width: "30%",
      render: (text: string, record: any) => {
        if (record.isGroup) {
          return <div className="font-bold text-blue-600 text-base">{text}</div>
        }
        return <div className="ml-6 text-gray-700">{text}</div>
      },
    },
    ...ROLE_ORDER.map((role) => ({
      title: t(getRoleTranslationKey(role), language),
      dataIndex: role,
      key: role,
      width: "14%",
      align: "center" as const,
      render: (_: any, record: any) => {
        if (record.isGroup) {
          return null
        }
        const permission = record.permission
        const rolePermissions = permissions[role] || []
        const isChecked = rolePermissions.includes(permission)

        return (
          <Checkbox
            checked={isChecked}
            onChange={(e) =>
              handlePermissionChange(role, permission, e.target.checked)
            }
            disabled={isSaving}
          />
        )
      },
    })),
  ]

  return (
    <div className="p-6">
      {/* Loading State */}
      {isLoading && (
        <Spin
          fullscreen
          size="large"
          tip={
            language === "vi" ? "Đang tải dữ liệu..." : "Loading permissions..."
          }
        />
      )}

      {!isLoading && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  {t("sidebar.role_permission", language)}
                </h1>
                <p className="text-gray-600 mt-2">
                  {language === "vi"
                    ? "Cấu hình quyền truy cập cho từng vai trò"
                    : "Configure access permissions for each role"}
                </p>
              </div>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                >
                  {language === "vi" ? "Đặt lại" : "Reset"}
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  loading={isSaving}
                >
                  {t("common.save", language)}
                </Button>
              </Space>
            </div>
          </div>

          {/* Matrix Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                bordered
                size="middle"
                rowKey="key"
                className="role-permission-table"
              />
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                {language === "vi" ? "Hướng dẫn:" : "Legend:"}
              </span>{" "}
              {language === "vi"
                ? "Đánh dấu các ô để cấp quyền cho vai trò tương ứng. Nhấn 'Lưu' để cập nhật cấu hình trên hệ thống."
                : "Check the boxes to assign permissions to the corresponding role. Click 'Save' to apply changes to the system."}
            </p>
          </div>

          <style>{`
            .role-permission-table {
              font-size: 14px;
            }
            .role-permission-table .ant-table-thead > tr > th {
              background-color: #fafafa;
              font-weight: 600;
              text-align: center;
            }
            .role-permission-table .ant-table-cell {
              padding: 12px !important;
            }
          `}</style>
        </>
      )}
    </div>
  )
}
