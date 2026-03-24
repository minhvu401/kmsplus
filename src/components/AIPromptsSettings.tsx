"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  Space,
  Divider,
  Button,
  Modal,
  Input,
  message,
  Spin,
  Empty,
} from "antd"
import TextArea from "antd/es/input/TextArea"
import { EditOutlined } from "@ant-design/icons"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

interface AIPrompt {
  id: number
  prompt_key: string
  title: string
  description: string
  content: string
  created_at: Date
  updated_at: Date
}

export default function AIPromptsSettings() {
  const { language } = useLanguageStore()
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
  })

  // Fetch prompts on mount
  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/prompts")
      const data = await response.json()

      if (data.success) {
        setPrompts(data.data)
      } else {
        message.error(
          language === "vi" ? "Không thể tải prompts" : "Failed to load prompts"
        )
      }
    } catch (error) {
      console.error("Error fetching prompts:", error)
      message.error(
        language === "vi" ? "Lỗi khi tải prompts" : "Error loading prompts"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (prompt: AIPrompt) => {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
    })
    setIsModalVisible(true)
  }

  const handleSave = async () => {
    if (!editingPrompt) return

    if (!formData.title.trim() || !formData.content.trim()) {
      message.error(
        language === "vi"
          ? "Vui lòng nhập tất cả các trường bắt buộc"
          : "Please fill in all required fields"
      )
      return
    }

    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptKey: editingPrompt.prompt_key,
          title: formData.title,
          description: formData.description,
          content: formData.content,
        }),
      })

      const data = await response.json()

      if (data.success) {
        message.success(
          language === "vi"
            ? "Prompt đã được cập nhật thành công"
            : "Prompt updated successfully"
        )
        setIsModalVisible(false)
        fetchPrompts()
      } else {
        message.error(data.error || "Failed to save prompt")
      }
    } catch (error) {
      console.error("Error saving prompt:", error)
      message.error(
        language === "vi" ? "Lỗi khi lưu prompt" : "Error saving prompt"
      )
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingPrompt(null)
    setFormData({ title: "", description: "", content: "" })
  }

  return (
    <Card className="mt-6">
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Header */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold">
              {language === "vi"
                ? "Quản lý AI Prompts"
                : "AI Prompts Management"}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {language === "vi"
                ? "Chỉnh sửa system prompts cho các tính năng AI"
                : "Edit system prompts for AI features"}
            </p>
          </div>
        </div>

        <Divider />

        {/* Prompts List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : prompts.length === 0 ? (
          <Empty
            description={
              language === "vi" ? "Không có prompts nào" : "No prompts found"
            }
          />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {prompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="bg-gray-50 border border-gray-200"
                hoverable
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-base mb-1">{prompt.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">
                      {prompt.description}
                    </p>
                    <p className="text-gray-500 text-xs font-mono">
                      Key: {prompt.prompt_key}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {language === "vi"
                        ? `Cập nhật lần cuối: ${new Date(
                            prompt.updated_at
                          ).toLocaleDateString("vi-VN")}`
                        : `Last updated: ${new Date(
                            prompt.updated_at
                          ).toLocaleDateString("en-US")}`}
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(prompt)}
                    className="ml-4"
                  >
                    {language === "vi" ? "Chỉnh sửa" : "Edit"}
                  </Button>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Space>

      {/* Edit Modal */}
      <Modal
        title={
          language === "vi"
            ? `Chỉnh sửa: ${editingPrompt?.title}`
            : `Edit: ${editingPrompt?.title}`
        }
        open={isModalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={900}
        okText={language === "vi" ? "Lưu" : "Save"}
        cancelText={language === "vi" ? "Hủy" : "Cancel"}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "vi" ? "Tiêu đề" : "Title"} *
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={
                language === "vi" ? "Nhập tiêu đề prompt" : "Enter prompt title"
              }
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "vi" ? "Mô tả" : "Description"}
            </label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={
                language === "vi"
                  ? "Nhập mô tả prompt"
                  : "Enter prompt description"
              }
            />
          </div>

          {/* Content Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "vi" ? "Nội dung Prompt" : "Prompt Content"} *
            </label>
            <TextArea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder={
                language === "vi"
                  ? "Nhập nội dung prompt"
                  : "Enter prompt content"
              }
              rows={12}
              style={{ fontFamily: "monospace" }}
            />
            <p className="text-gray-500 text-xs mt-2">
              {language === "vi" ? "Tổng cộng: " : "Total: "}
              {formData.content.length}{" "}
              {language === "vi" ? "ký tự" : "characters"}
            </p>
          </div>
        </Space>
      </Modal>
    </Card>
  )
}
