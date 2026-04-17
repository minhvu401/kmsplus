"use client"

import { useEffect, useState } from "react"
import {
  List,
  Button,
  Modal,
  Typography,
  Space,
  Spin,
  Tooltip,
  Tag,
  Divider,
} from "antd"
import { EyeOutlined, ArrowRightOutlined } from "@ant-design/icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

type QuestionItem = {
  id: number | string
  title: string
  content?: string | null
  created_at?: string | null
  updated_at?: string | null
  is_closed?: boolean | null
  category?: string | null
}

export default function QuestionsTabContent({
  initialItems = [],
  userId,
}: {
  initialItems?: QuestionItem[]
  userId?: number | string
}) {
  const language = useLanguageStore((s) => s.language)
  const [items, setItems] = useState<QuestionItem[]>(initialItems)
  const [preview, setPreview] = useState<QuestionItem | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    if ((items?.length ?? 0) > 0) return
    if (!userId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/users/${userId}/questions`)
        const json = await res.json()
        if (!mounted) return
        if (json?.success && Array.isArray(json.data)) setItems(json.data)
      } catch (e) {
        console.error("QuestionsTabContent: fallback fetch failed", e)
      }
    })()

    return () => {
      mounted = false
    }
  }, [userId])

  return (
    <div>
      <Typography.Title level={4}>
        {t("profile.tab_questions", language)}
      </Typography.Title>
      <List
        itemLayout="horizontal"
        dataSource={items}
        locale={{ emptyText: t("profile.activity_questions_empty", language) }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Link key="view" href={`/questions/${item.id}`}>
                <Button type="link" icon={<ArrowRightOutlined />}>
                  {t("profile.view_question", language)}
                </Button>
              </Link>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Tooltip title={t("profile.preview_question", language)}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => setPreview(item)}
                  />
                </Tooltip>
              }
              title={<span className="font-medium">{item.title}</span>}
              description={
                <Space direction="vertical" size={0}>
                  <span className="text-sm text-gray-600">
                    {item.category ?? ""}
                  </span>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title={t("profile.tab_questions", language)}
        centered
        width={760}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={
          preview
            ? [
                <Button
                  key="view-full"
                  type="primary"
                  onClick={() => router.push(`/questions/${preview.id}`)}
                >
                  {t("profile.view_full_question", language)}
                </Button>,
                <Button key="close" onClick={() => setPreview(null)}>
                  {t("common.close", language)}
                </Button>,
              ]
            : null
        }
      >
        {preview && (
          <div className="space-y-4">
            <div>
              <Typography.Text type="secondary">
                {t("quiz.review_label_title", language)}
              </Typography.Text>
              <div className="font-semibold text-base text-gray-900">
                {preview.title}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {preview.category && <Tag color="blue">{preview.category}</Tag>}
              <Tag color={preview.is_closed ? "red" : "green"}>
                {t(
                  preview.is_closed
                    ? "profile.question_closed"
                    : "profile.question_open",
                  language
                )}
              </Tag>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            <div>
              <Typography.Text type="secondary">
                {t("quiz.review_label_status", language) === "Trạng thái:"
                  ? t("quiz.review_label_status", language)
                  : "Content"}
              </Typography.Text>
              <div
                className="mt-2 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.content || "" }}
              />
            </div>

            <div className="text-sm text-gray-600 flex gap-6">
              <div>
                <strong>{t("profile.created_at", language)}:</strong>{" "}
                {preview.created_at
                  ? new Date(preview.created_at).toLocaleString(
                      language === "vi" ? "vi-VN" : "en-US"
                    )
                  : "N/A"}
              </div>
              <div>
                <strong>{t("profile.updated_at", language)}:</strong>{" "}
                {preview.updated_at
                  ? new Date(preview.updated_at).toLocaleString(
                      language === "vi" ? "vi-VN" : "en-US"
                    )
                  : "N/A"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
