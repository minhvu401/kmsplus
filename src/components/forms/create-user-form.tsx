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
  onSuccess?: () => void
}

export default function CreateUserForm({
  roles,
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
          label={<Text strong>{language === "vi" ? "Địa chỉ email" : "Email Address"}</Text>}
          name="email"
          rules={[
            { required: true, message: language === "vi" ? "Vui lòng nhập email" : "Please enter email address" },
            { type: "email", message: language === "vi" ? "Vui lòng nhập email hợp lệ" : "Please enter a valid email address" },
          ]}
          help={state.errors?.email?.[0]}
          validateStatus={state.errors?.email ? "error" : ""}
        >
          <Input
            placeholder="user@company.com"
            type="email"
            disabled={isLoading}
          />
        </Form.Item>

        {/* Password Field */}
        <Form.Item
          label={<Text strong>{language === "vi" ? "Mật khẩu" : "Password"}</Text>}
          name="password"
          rules={[
            { required: true, message: language === "vi" ? "Vui lòng nhập mật khẩu" : "Please enter password" },
            { min: 6, message: language === "vi" ? "Mật khẩu phải có ít nhất 6 ký tự" : "Password must be at least 6 characters" },
          ]}
          help={state.errors?.password?.[0]}
          validateStatus={state.errors?.password ? "error" : ""}
        >
          <Input.Password
            placeholder={language === "vi" ? "Tối thiểu 6 ký tự" : "At least 6 characters"}
            disabled={isLoading}
          />
        </Form.Item>

        {/* Full Name Field */}
        <Form.Item
          label={<Text strong>{language === "vi" ? "Họ và tên" : "Full Name"}</Text>}
          name="fullName"
          rules={[
            { required: true, message: language === "vi" ? "Vui lòng nhập họ và tên" : "Please enter full name" },
            { min: 2, message: language === "vi" ? "Họ và tên phải có ít nhất 2 ký tự" : "Full name must be at least 2 characters" },
          ]}
          help={state.errors?.fullName?.[0]}
          validateStatus={state.errors?.fullName ? "error" : ""}
        >
          <Input
            placeholder={language === "vi" ? "Ví dụ: Nguyễn Văn A" : "John Doe"}
            disabled={isLoading}
          />
        </Form.Item>

        {/* Role Field */}
        <Form.Item
          label={<Text strong>{language === "vi" ? "Vai trò" : "Role"}</Text>}
          name="roleId"
          rules={[
            { required: true, message: language === "vi" ? "Vui lòng chọn vai trò" : "Please select a role" },
          ]}
          help={state.errors?.roleId?.[0]}
          validateStatus={state.errors?.roleId ? "error" : ""}
        >
          <Select
            placeholder={language === "vi" ? "Chọn vai trò cho người dùng" : "Select a role for the user"}
            disabled={isLoading}
            options={Object.entries(RoleConfig).map(([_, config]) => ({
              label: config.label,
              value: config.id,
            }))}
          />
        </Form.Item>

        {/* Submit Buttons */}
        <Form.Item>
          <Space>
            <Button onClick={() => form.resetFields()}>
              {language === "vi" ? "Xóa" : "Reset"}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
            >
              {language === "vi" ? "Tạo người dùng" : "Create User"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}