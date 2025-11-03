"use client"

import { Form, Input, Button, Card, Space } from "antd"
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons"

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void
}

export default function ForgotPasswordForm({
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const [form] = Form.useForm()

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
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <LockOutlined style={{ fontSize: 24, color: "white" }} />
        </div>
        {/* <div style={{ marginBottom: 24 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackToLogin}
            style={{ marginBottom: 16, padding: 0 }}
          >
            Quay lại đăng nhập
          </Button>
          <h1 style={{ margin: 0, textAlign: "center" }}>Quên mật khẩu</h1>
        </div> */}
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Quên mật khẩu?
        </h1>
      </div>
      <Form
        form={form}
        layout="vertical" // onFinish={...} // Bạn sẽ thêm logic xử lý ở đây
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
            prefix={<MailOutlined style={{ color: "#aaa" }} />}
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item
          label="New Password"
          name="password"
          rules={[
            { required: true, message: "Please input your new password!" },
          ]}
        >
          <Input.Password
            name="password"
            size="large"
            placeholder="Enter new password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item
          label="Confirm New Password"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            {
              required: true,
              message: "Please confirm your new password!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error("The two passwords do not match!")
                )
              },
            }),
          ]}
        >
          <Input.Password
            name="confirmPassword"
            size="large"
            placeholder="Confirm new password"
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
            block // loading={...} // Bạn sẽ thêm state loading ở đây
            style={{
              height: 44,
              borderRadius: 8,
              fontWeight: 500,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            Reset Password
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBackToLogin}
          style={{ marginBottom: 16, padding: 0 }}
        >
          Quay lại đăng nhập
        </Button>
      </div>
    </Card>
  )
}
