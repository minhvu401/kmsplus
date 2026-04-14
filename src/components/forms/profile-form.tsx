"use client"

import { useState, useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import useUserStore from "@/store/useUserStore"
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar_url || null
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url || null)
  const { user: currentUser, setUser } = useUserStore()
  const router = useRouter()

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
      // Update user store with new data
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          full_name: form.getFieldValue("full_name") || currentUser.full_name,
        }
        // Only update avatar if it was changed
        if (avatarUrl && avatarUrl !== currentUser.avatar_url) {
          updatedUser.avatar_url = avatarUrl
        }
        setUser(updatedUser)
      }
      if (onSuccess) onSuccess()
      // Refresh server data so pages using server props get updated
      try {
        router.refresh()
      } catch (e) {
        // ignore if router not available
      }
    } else if (state.message && !isLoading && state.success === false) {
      message.error(state.message)
    }
  }, [state.success, state.message, isLoading, onSuccess, currentUser, avatarUrl, setUser, form])

  const handleAvatarChange = async (file: RcFile) => {
    setIsUploadingAvatar(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setAvatarUrl(data.data.avatarUrl)
        message.success("Avatar uploaded successfully")
      } else {
        message.error(data.message || "Failed to upload avatar")
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      message.error("Failed to upload avatar")
    } finally {
      setIsUploadingAvatar(false)
    }
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
      onFinish={async (values) => {
        setIsLoading(true)
        try {
          const formData = new FormData()
          formData.append("full_name", values.full_name)
          formData.append("email", values.email)
          if (avatarUrl) {
            formData.append("avatar_url", avatarUrl)
          }
          
          await formAction(formData)
        } finally {
          setIsLoading(false)
        }
      }}
    >
      <div style={{ marginBottom: "24px" }}>
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
            disabled={isUploadingAvatar}
          >
            <Button
              icon={<CameraOutlined />}
              type="default"
              loading={isUploadingAvatar}
            >
              Change Avatar
            </Button>
          </Upload>
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
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button
            type="default"
            size="middle"
            danger
            onClick={() => {
              form.resetFields()
              setAvatarPreview(user.avatar_url || null)
              setAvatarUrl(user.avatar_url || null)
              if (onSuccess) onSuccess()
            }}
            style={{ minWidth: 96, color: '#f5222d', borderColor: '#f5222d' }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading || isUploadingAvatar}
            size="middle"
            style={{ minWidth: 96 }}
          >
            Save Changes
          </Button>
        </div>
      </Form.Item>

      {state.message && !state.success && (
        <Text type="danger">{state.message}</Text>
      )}
    </Form>
  )
}
