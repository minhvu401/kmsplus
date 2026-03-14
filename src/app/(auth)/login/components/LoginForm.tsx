"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { loginAction } from "@/action/auth/authActions"
import { getUserRoleAction } from "@/action/user/userActions"
import { Form, Input, Button, Alert, Checkbox, Typography, Divider } from "antd"
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
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      // Let NextAuth handle the full redirect flow
      const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"
      await signIn("google", {
        callbackUrl: callbackUrl,
        redirect: true, // Let NextAuth handle redirect after session is set
      })
    } catch (error) {
      console.error("Google login error:", error)
      setState((prev) => ({
        ...prev,
        message: "Google login failed. Please try again.",
      }))
      setIsGoogleLoading(false)
    }
  }

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

      {/* Divider */}
      <Divider className="!my-6">Hoặc</Divider>

      {/* Google Login Button */}
      <Button
        block
        size="large"
        className="!h-12 !rounded-lg !font-semibold !text-base !border-gray-300 hover:!bg-gray-50"
        onClick={handleGoogleSignIn}
        loading={isGoogleLoading}
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        }
      >
        <span className="ml-2">Đăng nhập bằng Google</span>
      </Button>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <Text className="text-gray-400 text-sm">
          © 2026 KMSPlus. All rights reserved.
        </Text>
      </div>
    </div>
  )
}