"use client"

import { useState, useActionState, useEffect } from "react"
import {
  Form,
  Input,
  Button,
  Typography,
  Flex,
  message,
  Upload,
  Avatar,
  Space,
} from "antd"
import { UserOutlined, CameraOutlined } from "@ant-design/icons"
import {
  updateProfileAction,
  ProfileActionState,
} from "@/action/user/profileActions"
import type { RcFile } from "antd/es/upload"

const { Text, Title } = Typography

interface ProfileFormProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url?: string
  }
  onSuccess?: () => void
}

export default function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar_url || null
  )

  const initialState: ProfileActionState = {
    success: false,
    message: "",
  }

  const [state, formAction] = useActionState<ProfileActionState, FormData>(
      (prevState: ProfileActionState, formData: FormData) => updateProfileAction(formData),
      initialState
    )

  useEffect(() => {
    if (state.success) {
      message.success(state.message)
      if (onSuccess) onSuccess()
    } else if (state.message && !isLoading) {
      message.error(state.message)
    }
  }, [state.success, state.message, isLoading, onSuccess])

  const handleAvatarChange = (file: RcFile) => {
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
      form.setFieldValue("avatar_url", reader.result as string)
    }
    reader.readAsDataURL(file)
    return false
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        full_name: user.full_name || "",
        email: user.email,
      }}
      action={formAction}
    >
      <div style={{ marginBottom: "24px" }}>
        <Title level={4}>Avatar</Title>
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <Avatar
            size={120}
            icon={<UserOutlined />}
            src={avatarPreview}
            style={{ backgroundColor: "#1890ff" }}
          />
          <Upload
            maxCount={1}
            accept="image/*"
            beforeUpload={handleAvatarChange}
            showUploadList={false}
            customRequest={() => {}} // Prevent default upload behavior
          >
            <Button
              icon={<CameraOutlined />}
              type="default"
              loading={isLoading}
            >
              Change Avatar
            </Button>
          </Upload>
          <Input
            type="hidden"
            name="avatar_url"
            value={avatarPreview || ""}
            hidden
          />
        </Space>
      </div>

      <Form.Item
        label="Full Name"
        name="full_name"
        rules={[
          { required: true, message: "Please enter your full name" },
          { min: 2, message: "Full name must be at least 2 characters" },
        ]}
      >
        <Input placeholder="Enter your full name" />
      </Form.Item>

      <Form.Item label="Email" name="email">
        <Input disabled placeholder="Email cannot be changed" />
      </Form.Item>

      <Form.Item>
        <Flex gap="middle">
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Save Changes
          </Button>
        </Flex>
      </Form.Item>

      {state.message && !state.success && (
        <Text type="danger">{state.message}</Text>
      )}
    </Form>
  )
}
