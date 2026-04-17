"use client"

import { useState, useEffect } from "react"
import { Form, Input, Button, Typography, message, Alert } from "antd"
import { LockOutlined } from "@ant-design/icons"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

const { Text, Title } = Typography

interface PasswordFormProps {
  onSuccess?: () => void
}

export default function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const language = useLanguageStore((state) => state.language)

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true)

      // Validate passwords match
      if (values.newPassword !== values.confirmPassword) {
        message.error(t("password.passwords_not_match", language))
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
        message.error(data.message || t("password.change_error", language))
        return
      }

      message.success(data.message || t("password.change_success", language))
      form.resetFields()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error updating password:", error)
      message.error(t("password.change_error", language))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Alert
        message={t("password.reset_title", language)}
        description="Make sure to use a strong password with a mix of uppercase, lowercase, numbers, and special characters."
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Form.Item
        label={t("password.old_password", language)}
        name="currentPassword"
        rules={[
          {
            required: true,
            message: t("form.validation_password_required", language),
          },
        ]}
      >
        <Input.Password
          placeholder={t("password.old_password", language)}
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={t("password.new_password", language)}
        name="newPassword"
        rules={[
          {
            required: true,
            message: t("form.validation_password_required", language),
          },
          { min: 6, message: t("form.validation_password_min", language) },
        ]}
      >
        <Input.Password
          placeholder={t("password.new_password", language)}
          prefix={<LockOutlined />}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={t("password.confirm_password", language)}
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          {
            required: true,
            message: t("form.validation_password_required", language),
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve()
              }
              return Promise.reject(
                new Error(t("password.passwords_not_match", language))
              )
            },
          }),
        ]}
      >
        <Input.Password
          placeholder={t("password.confirm_password", language)}
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
          {t("password.change_success", language).split(" ")[0]}
        </Button>
      </Form.Item>
    </Form>
  )
}
