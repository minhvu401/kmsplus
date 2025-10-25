"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loginAction } from "@/action/auth/authActions"
import { Form, Input, Button, Card, Alert } from "antd"
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
} from "@ant-design/icons"

export default function LoginPage() {
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialState = {
    success: false,
    message: "",
    errors: {} as Record<string, string[]>,
  }
  const [state, formAction] = useActionState(loginAction, initialState)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (state.success) {
      const cb = searchParams?.get("callbackUrl") || "/dashboard"
      // Reload page để browser nhận cookie mới, sau đó redirect
      window.location.replace(cb)
    }
  }, [state.success, searchParams])

  useEffect(() => {
    if (state.errors) {
      form.setFields(
        Object.entries(state.errors).map(([name, errors]) => ({
          name,
          errors,
        }))
      )
    }
  }, [state.errors, form])

  const handleSubmit = async (values: { email: string; password: string }) => {
    const formData = new FormData()
    formData.append("email", values.email)
    formData.append("password", values.password)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "16px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 450,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo và Header */}
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
              <p style={{ margin: 0, fontSize: 12, color: "#667eea" }}>
                by bai
              </p>
            </div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Welcome Back!
          </h1>
        </div>

        {/* Error Message */}
        {!state.success && state.message && (
          <Alert
            message={state.message}
            type="error"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        {/* Form */}
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
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              name="password"
              size="large"
              placeholder="admin123"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isPending}
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 500,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
