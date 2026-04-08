// Sửa create-user-form.tsx - loại bỏ max-w-2xl wrapper
// src/components/forms/create-user-form.tsx
"use client"

import { useState, useActionState, startTransition, useEffect } from "react"
import {
  Form,
  Input,
  Select,
  Button,
  Typography,
  Space,
  message,
} from "antd"
import {
  UserManagementState,
  createUserByAdminAction,
} from "@/action/user/userManagementActions"
import { RoleConfig } from "@/enum/role.enum"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

const { Text } = Typography

interface CreateUserFormProps {
  roles: { id: number; name: string }[]
  departments: { id: number; name: string }[]
  onSuccess?: () => void
}

export default function CreateUserForm({
  roles,
  departments,
  onSuccess,
}: CreateUserFormProps) {
  const { language } = useLanguageStore()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)

  const initialState: UserManagementState = {
    success: false,
    message: "",
    errors: {},
  }

  const [state, createUserAction] = useActionState(
    createUserByAdminAction,
    initialState
  )

  // Handle state changes with useEffect
  useEffect(() => {
    if (state.success && state.message) {
      message.success(state.message)
      form.resetFields()
      onSuccess?.()
    }
  }, [state.success, state.message])

  useEffect(() => {
    if (!state.success && state.message) {
      message.error(state.message)
    }
  }, [state.success, state.message])

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append("email", values.email)
    formData.append("password", values.password)
    formData.append("fullName", values.fullName)
    formData.append("roleId", values.roleId)
    formData.append("departmentId", values.departmentId)

    startTransition(() => {
      createUserAction(formData)
    })

    setIsLoading(false)
  }

  return (
    <div style={{ width: "100%", maxWidth: "600px" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Email Field */}
        <Form.Item
          label={t("form.label_email", language)}
          name="email"
          rules={[
            { required: true, message: t("form.validation_email_required", language) },
            { type: "email", message: t("form.validation_email_invalid", language) },
          ]}
          help={state.errors?.email?.[0]}
          validateStatus={state.errors?.email ? "error" : ""}
        >
          <Input
            size="middle"
            placeholder={t("form.placeholder_email", language)}
            type="email"
            disabled={isLoading}
            autoComplete="off"
            className="rounded-md"
          />
        </Form.Item>

        {/* Password Field */}
        <Form.Item
          label={t("form.label_password", language)}
          name="password"
          rules={[
            { required: true, message: t("form.validation_password_required", language) },
            { min: 6, message: t("form.validation_password_min", language) },
          ]}
          help={state.errors?.password?.[0]}
          validateStatus={state.errors?.password ? "error" : ""}
        >
          <Input.Password
            size="middle"
            placeholder={t("form.placeholder_password", language)}
            disabled={isLoading}
            autoComplete="new-password"
            className="rounded-md"
          />
        </Form.Item>

        {/* Full Name Field */}
        <Form.Item
          label={t("form.label_full_name", language)}
          name="fullName"
          rules={[
            { required: true, message: t("form.validation_fullname_required", language) },
            { min: 2, message: t("form.validation_fullname_min", language) },
          ]}
          help={state.errors?.fullName?.[0]}
          validateStatus={state.errors?.fullName ? "error" : ""}
        >
          <Input
            size="middle"
            placeholder={t("form.placeholder_full_name", language)}
            disabled={isLoading}
            className="rounded-md"
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Field */}
          <Form.Item
            label={t("form.label_role", language)}
            name="roleId"
            rules={[
              { required: true, message: t("form.validation_role_required", language) },
            ]}
            help={state.errors?.roleId?.[0]}
            validateStatus={state.errors?.roleId ? "error" : ""}
          >
            <Select
              size="middle"
              placeholder={t("form.placeholder_role", language)}
              disabled={isLoading}
              className="rounded-md"
              options={Object.entries(RoleConfig).map(([_, config]) => ({
                label: config.label,
                value: config.id,
              }))}
            />
          </Form.Item>

          {/* Department Field */}
          <Form.Item
            label={t("form.label_department", language)}
            name="departmentId"
            rules={[
              {
                required: true,
                message: t("form.validation_department_required", language),
              },
            ]}
            help={state.errors?.departmentId?.[0]}
            validateStatus={state.errors?.departmentId ? "error" : ""}
          >
            <Select
              size="middle"
              placeholder={t("form.placeholder_department", language)}
              disabled={isLoading}
              className="rounded-md"
              options={departments.map((department) => ({
                label: department.name,
                value: department.id,
              }))}
            />
          </Form.Item>
        </div>

        {/* Submit Buttons */}
        <Form.Item className="mt-4">
          <Space className="w-full flex justify-end">
            <Button size="middle" onClick={() => form.resetFields()}>
              {t("form.btn_reset", language)}
            </Button>
            <Button
              size="middle"
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="px-8"
            >
              {t("form.btn_create_user", language)}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}