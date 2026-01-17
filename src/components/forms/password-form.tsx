"use client"

import { useState, useEffect } from "react"
import { Form, Input, Button, Typography, message, Alert } from "antd"
import { LockOutlined } from "@ant-design/icons"

const { Text, Title } = Typography

interface PasswordFormProps {
  onSuccess?: () => void
}

export default function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true)

      // Validate passwords match
      if (values.newPassword !== values.confirmPassword) {
        message.error("New passwords do not match")
        return
      }

      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        message.error(data.message || "Failed to update password")
        return
      }

      message.success(data.message || "Password updated successfully")
      form.resetFields()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error updating password:", error)
      message.error("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Alert
        message="Password Security"
        description="Make sure to use a strong password with a mix of uppercase, lowercase, numbers, and special characters."
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Form.Item
        label="Current Password"
        name="currentPassword"
        rules={[
          { required: true, message: "Please enter your current password" },
        ]}
      >
        <Input.Password
          placeholder="Enter your current password"
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="New Password"
        name="newPassword"
        rules={[
          { required: true, message: "Please enter a new password" },
          { min: 6, message: "Password must be at least 6 characters" },
        ]}
      >
        <Input.Password
          placeholder="Enter your new password"
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="Confirm New Password"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "Please confirm your new password" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error("Passwords do not match"))
            },
          }),
        ]}
      >
        <Input.Password
          placeholder="Confirm your new password"
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          danger
          htmlType="submit"
          loading={isLoading}
          block
          size="large"
          icon={<LockOutlined />}
        >
          Update Password
        </Button>
      </Form.Item>
    </Form>
  )
}
