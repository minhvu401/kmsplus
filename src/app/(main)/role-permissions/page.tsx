// src/app/(main)/role-permissions/page.tsx
"use client"

import React from "react"
import { Table, Card, Alert } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { Role } from "@/enum/role.enum"
import { Permission } from "@/enum/permission.enum"
import { rolePermissionsMap } from "@/config/RolePermission.config"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

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
  }
  return `role.${roleMap[role]}`
}

export default function RolePermissionPage() {
  const { language } = useLanguageStore()

  // Build data source from static rolePermissionsMap
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
        const rolePermissions = rolePermissionsMap[role] || []
        const isChecked = rolePermissions.includes(permission)

        return <div className="text-xl">{isChecked ? "✓" : "-"}</div>
      },
    })),
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {t("sidebar.role_permission", language)}
        </h1>
        <p className="text-gray-600 mt-2">
          {t("role_permission.page_subtitle", language)}
        </p>
      </div>

      {/* Alert: Static Configuration */}
      <Alert
        message={t("role_permission.static_config_title", language)}
        description={t("role_permission.static_config_desc", language)}
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        className="mb-6"
      />

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
            {t("role_permission.legend_title", language)}
          </span>{" "}
          {t("role_permission.legend_desc", language)}
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
    </div>
  )
}
