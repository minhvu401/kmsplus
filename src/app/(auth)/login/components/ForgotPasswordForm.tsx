"use client"

import { Form, Input, Button, Typography, Alert } from "antd"
import { forgotPasswordAction } from "@/action/auth/authActions"
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons"
import { useState } from "react"

const { Title, Text } = Typography

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void
}

export default function ForgotPasswordForm({
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full">
      {/* Back button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={onBackToLogin}
        className="!p-0 !h-auto text-gray-500 hover:!text-[#1677ff] mb-6"
      >
        Quay lại đăng nhập
      </Button>

      {/* Header */}
      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          style={{ background: "linear-gradient(135deg, #69b1ff 0%, #1677ff 100%)" }}
        >
          <LockOutlined className="text-3xl text-white" />
        </div>
        <Title level={2} className="!m-0 !text-gray-800 !font-bold">
          Quên mật khẩu?
        </Title>
        <Text className="text-gray-500 mt-2 block">
          Nhập email để đặt lại mật khẩu của bạn
        </Text>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert
          message={message}
          type={success ? "success" : "error"}
          showIcon
          className="mb-6 rounded-lg"
          closable
        />
      )}

      {/* Form */}
      <Form 
        form={form} 
        layout="vertical" 
        requiredMark={false} 
        size="large"
        onFinish={async (values) => {
          setLoading(true)
          setMessage("")
          try {
            const formData = new FormData()
            formData.append("email", values.email)
            formData.append("password", values.password)
            formData.append("confirmPassword", values.confirmPassword)

            const result = await forgotPasswordAction(formData)

            if (result.success) {
              setSuccess(true)
              setMessage(result.message)
              form.resetFields()
              // Redirect back to login after 2 seconds
              setTimeout(() => {
                onBackToLogin?.()
              }, 2000)
            } else {
              setSuccess(false)
              setMessage(result.message)
            }
          } catch (error) {
            setSuccess(false)
            setMessage("Có lỗi xảy ra. Vui lòng thử lại.")
            console.error("Forgot password error:", error)
          } finally {
            setLoading(false)
          }
        }}
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
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="admin@company.com"
            className="!rounded-lg"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="font-medium text-gray-700">Mật khẩu mới</span>
          }
          name="password"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Nhập mật khẩu mới"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            className="!rounded-lg"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="font-medium text-gray-700">Xác nhận mật khẩu</span>
          }
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("Mật khẩu không khớp!"))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Xác nhận mật khẩu mới"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            className="!rounded-lg"
          />
        </Form.Item>

        <Form.Item className="!mb-0 !mt-6">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className="!h-12 !rounded-lg !font-semibold !text-base"
            style={{ background: "linear-gradient(135deg, #69b1ff 0%, #1677ff 100%)", border: "none" }}
          >
            Đặt lại mật khẩu
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