"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loginAction } from "@/action/auth/authActions"
import { getUserRoleAction } from "@/action/user/userActions"
import { Form, Input, Button, Card, Alert, Checkbox } from "antd"
import useUserStore from "@/store/useUserStore"
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
} from "@ant-design/icons"
import React from "react"

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
        // ✅ Báo lỗi ra giao diện
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

  // useEffect(() => {
  //   if (state.success) {
  //     if (onSuccess) {
  //       onSuccess()
  //     } else if (callbackUrl) {
  //       window.location.replace(callbackUrl)
  //     } else {
  //       window.location.replace("/dashboard?loggedin=true")
  //     }
  //   }
  // }, [state.success, onSuccess, callbackUrl])
  return (
    <Card
      style={{
        width: 450,
        minWidth: 350,
        maxWidth: "90%",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        margin: "0 16px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MailOutlined style={{ fontSize: 24, color: "white" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              KMSPlus
            </h2>
            {/* <p style={{ margin: 0, fontSize: 12, color: "#667eea" }}>by bai</p> */}
          </div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Chào mừng👋!
        </h1>
      </div>
      {!state.success && state.message && (
        <Alert
          message={state.message}
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input
            name="email"
            size="large"
            placeholder="admin@company.com"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password
            name="password"
            size="large"
            placeholder="••••••••"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <Button
            type="link"
            style={{ padding: 0, height: "auto" }}
            onClick={onForgotPassword}
          >
            Quên mật khẩu?
          </Button>
        </div>
        <Form.Item style={{ marginTop: 0, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isLoading}
            style={{
              height: 44,
              borderRadius: 8,
              fontWeight: 500,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
