"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { loginAction } from "@/action/auth/authActions"
import { getUserRoleAction } from "@/action/user/userActions"
import { Form, Input, Button, Alert, Checkbox, Typography } from "antd"
import useUserStore from "@/store/useUserStore"
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons"
import React from "react"

const { Title, Text } = Typography

interface LoginFormProps {
  callbackUrl?: string | null
  onSuccess?: () => void
  onForgotPassword?: () => void
}

export default function LoginForm({
  callbackUrl,
  onSuccess,
  onForgotPassword,
}: LoginFormProps) {
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialState = {
    success: false,
    message: "",
    errors: {} as Record<string, string[]>,
  }

  const [state, setState] = React.useState(initialState)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (values: {
    email: string
    password: string
    remember?: boolean
  }) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("email", values.email)
      formData.append("password", values.password)
      if (values.remember) {
        formData.append("remember", "true")
      }

      const result = await loginAction(initialState, formData)

      if (result.errors) {
        form.setFields(
          Object.entries(result.errors).map(([name, errors]) => ({
            name,
            errors,
          }))
        )
        setState((prev) => ({ ...prev, errors: result.errors || {} }))
      }

      if (result.success && result.user) {
        const { setUser, setUserRole } = useUserStore.getState()
        setUser(result.user)

        // Get user role from server
        try {
          const role = await getUserRoleAction()
          if (role) {
            setUserRole(role)
          }
        } catch (error) {
          console.error("Error getting user role:", error)
        }

        if (onSuccess) {
          onSuccess()
        } else {
          const url = callbackUrl || searchParams?.get("callbackUrl")
          window.location.replace(url || "/dashboard?loggedin=true")
        }
      } else if (!result.success && result.message) {
        setState((prev) => ({
          ...prev,
          message: result.message,
        }))
      }
    } catch (error) {
      console.error("Login error:", error)
      setState((prev) => ({
        ...prev,
        message: "An error occurred during login. Please try again.",
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img 
            src="/logo.png" 
            alt="KMSPlus Logo" 
            className="w-12 h-12 rounded-xl object-contain shadow-lg"
          />
          <div className="text-left">
            <Title level={4} className="!m-0 !text-gray-800">
              KMSPlus
            </Title>
            <Text className="text-xs text-[#1677ff]">
              Knowledge Management System
            </Text>
          </div>
        </div>
        <Title level={2} className="!m-0 !text-gray-800 !font-bold">
          Đăng nhập
        </Title>
        <Text className="text-gray-500 mt-2 block">
          Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.
        </Text>
      </div>

      {/* Error Alert */}
      {!state.success && state.message && (
        <Alert
          message={state.message}
          type="error"
          showIcon
          className="mb-6 rounded-lg"
        />
      )}

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          label={<span className="font-medium text-gray-700">Email</span>}
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="admin@company.com"
            className="!rounded-lg"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Mật khẩu</span>}
          name="password"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="••••••••"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            className="!rounded-lg"
          />
        </Form.Item>

        <div className="flex justify-between items-center mb-6">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-gray-600">Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <Button
            type="link"
            onClick={onForgotPassword}
            className="!p-0 !h-auto"
          >
            Quên mật khẩu?
          </Button>
        </div>

        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isLoading}
            className="!h-12 !rounded-lg !font-semibold !text-base"
            style={{ background: "linear-gradient(135deg, #69b1ff 0%, #1677ff 100%)", border: "none" }}
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <Text className="text-gray-400 text-sm">
          © 2026 KMSPlus. All rights reserved.
        </Text>
      </div>
    </div>
  )
}