"use client"

import { useState, useActionState, startTransition, useEffect } from "react"
import {
  Form,
  Input,
  Select,
  Button,
  Typography,
  Flex,
  Divider,
  message,
} from "antd"
import {
  UserManagementState,
  createUserByAdminAction,
} from "@/action/user/userManagementActions"
import { RoleConfig, Role } from "@/enum/role.enum"

const { Text, Title } = Typography
const { TextArea } = Input

interface CreateUserFormProps {
  roles: { id: number; name: string }[]
  onSuccess?: () => void
}

export default function CreateUserForm({
  roles,
  onSuccess,
}: CreateUserFormProps) {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)

  const initialState: UserManagementState = {
    success: false,
    message: "",
    errors: {},
  }

  const [state, createUserAction] = useActionState(
    createUserByAdminAction,
    initialState
  )

  // Handle state changes with useEffect
  useEffect(() => {
    if (state.success && state.message) {
      message.success(state.message)
      form.resetFields()
      onSuccess?.()
    }
  }, [state.success, state.message])

  useEffect(() => {
    if (!state.success && state.message) {
      message.error(state.message)
    }
  }, [state.success, state.message])

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append("email", values.email)
    formData.append("password", values.password)
    formData.append("fullName", values.fullName)
    formData.append("roleId", values.roleId)

    startTransition(() => {
      createUserAction(formData)
    })

    setIsLoading(false)
  }

  // Get role label for display
  const getRoleLabel = (value: string | number) => {
    const roleEntry = Object.entries(RoleConfig).find(
      ([_, config]) => config.id === Number(value)
    )
    return roleEntry ? roleEntry[1].label : ""
  }

  return (
    <Flex
      justify="center"
      align="center"
      style={{ width: "100%", minHeight: "600px" }}
    >
      <Flex vertical gap={15} style={{ width: "100%", maxWidth: "600px" }}>
        <Title level={4} style={{ color: "#1677ff", marginBottom: 0 }}>
          Create New User Account
        </Title>

        <Divider style={{ margin: "8px 0 16px" }} />

        <Form
          form={form}
          layout="vertical"
          style={{ width: "100%" }}
          onFinish={handleSubmit}
        >
          {/* Email Field */}
          <Form.Item
            label={<Text strong>Email Address:</Text>}
            name="email"
            rules={[
              { required: true, message: "Please enter email address" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
            help={state.errors?.email?.[0]}
            validateStatus={state.errors?.email ? "error" : ""}
          >
            <Input
              placeholder="user@company.com"
              type="email"
              size="large"
              disabled={isLoading}
            />
          </Form.Item>

          {/* Password Field */}
          <Form.Item
            label={<Text strong>Password:</Text>}
            name="password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
            help={state.errors?.password?.[0]}
            validateStatus={state.errors?.password ? "error" : ""}
          >
            <Input.Password
              placeholder="At least 6 characters"
              size="large"
              disabled={isLoading}
            />
          </Form.Item>

          {/* Full Name Field */}
          <Form.Item
            label={<Text strong>Full Name:</Text>}
            name="fullName"
            rules={[
              { required: true, message: "Please enter full name" },
              { min: 2, message: "Full name must be at least 2 characters" },
            ]}
            help={state.errors?.fullName?.[0]}
            validateStatus={state.errors?.fullName ? "error" : ""}
          >
            <Input placeholder="John Doe" size="large" disabled={isLoading} />
          </Form.Item>

          {/* Role Field */}
          <Form.Item
            label={<Text strong>Role:</Text>}
            name="roleId"
            rules={[{ required: true, message: "Please select a role" }]}
            help={state.errors?.roleId?.[0]}
            validateStatus={state.errors?.roleId ? "error" : ""}
          >
            <Select
              placeholder="Select a role for the user"
              size="large"
              disabled={isLoading}
              options={Object.entries(RoleConfig).map(([_, config]) => ({
                label: config.label,
                value: config.id,
              }))}
            />
          </Form.Item>

          {/* Submit Buttons */}
          <Flex gap={8} justify="center" style={{ marginTop: "24px" }}>
            <Button size="large" onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoading}
            >
              Create User
            </Button>
          </Flex>
        </Form>
      </Flex>
    </Flex>
  )
}
