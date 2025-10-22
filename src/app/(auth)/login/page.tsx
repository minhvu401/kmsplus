"use client"

import { useActionState, useEffect } from "react"
import { loginAction } from "@/action/auth/authActions"
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Space,
  Typography,
  notification,
} from "antd"
import { AppstoreOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

const { Title, Text } = Typography

const initialState = {
  success: false,
  message: "",
  errors: {},
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const reason = searchParams?.get("reason")
    if (reason === "session_expired") {
      notification.warning({
        message: "Đăng nhập lại",
        description: "Phiên đăng nhập đã kết thúc, vui lòng đăng nhậ lại.",
        placement: "topRight",
      })
    }

    if (state.success) {
      notification.success({
        message: "Login Successful",
        description: state.message,
        placement: "topRight",
      })
      // Redirect after successful login
      const callbackUrl = searchParams?.get("callbackUrl") || "/login"
      router.push(callbackUrl)
    }
  }, [state, router, searchParams])

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "100vh", background: "#e6f4ff" }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}
      >
        <Flex vertical align="center" gap="large">
          <Space direction="vertical" align="center" size={4}>
            <AppstoreOutlined style={{ fontSize: 32, color: "#1677ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Courseflow
            </Title>
          </Space>

          <Title level={4} style={{ margin: 0, textAlign: "center" }}>
            Login to your Account!
          </Title>

          {state.message && !state.success && (
            <Alert
              message={state.message}
              type="error"
              showIcon
              style={{ width: "100%" }}
            />
          )}

          <Form
            name="login"
            action={formAction}
            layout="vertical"
            style={{ width: "100%" }}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input your Email!" },
                { type: "email", message: "The input is not valid E-mail!" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="admin@company.com"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="admin123"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>

          <Text type="secondary">
            Don't have an account?{" "}
            <Link
              href="#"
              style={{ color: "#1677ff", opacity: 0.5, cursor: "not-allowed" }}
            >
              Register
            </Link>
          </Text>
        </Flex>
      </Card>
    </Flex>
  )
}
