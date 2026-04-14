"use client"

import { useEffect, useState } from "react"
import { List, Button, Modal, Typography, Space, Spin, Tooltip, Tag, Divider } from "antd"
import { EyeOutlined, ArrowRightOutlined } from "@ant-design/icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

type AnswerItem = {
  id: number | string
  question_id?: number | string
  question_title?: string | null
  content?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type AnswerGroup = {
  question_id?: number | string
  question_title?: string | null
  answers: AnswerItem[]
}

export default function AnswersTabContent({ initialItems = [], userId }: { initialItems?: AnswerItem[], userId?: number | string }) {
  const language = useLanguageStore((s) => s.language)
  const [items, setItems] = useState<AnswerItem[]>(initialItems)
  const [groups, setGroups] = useState<AnswerGroup[]>([])
  const [preview, setPreview] = useState<AnswerGroup | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    if ((items?.length ?? 0) > 0) return
    if (!userId) return

    ;(async () => {
      try {
        const res = await fetch(`/api/users/${userId}/answers`)
        const json = await res.json()
        if (!mounted) return
        if (json?.success && Array.isArray(json.data)) setItems(json.data)
      } catch (e) {
        console.error("AnswersTabContent: fallback fetch failed", e)
      }
    })()

    return () => {
      mounted = false
    }
  }, [userId])

  useEffect(() => {
    // group answers by question_id
    const map = new Map<string, AnswerItem[]>()
    for (const a of items) {
      const key = String(a.question_id ?? "_no_q")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    const grouped: AnswerGroup[] = []
    for (const [key, arr] of map.entries()) {
      grouped.push({ question_id: arr[0].question_id, question_title: arr[0].question_title ?? null, answers: arr })
    }
    setGroups(grouped)
  }, [items])

  return (
    <div>
      <Typography.Title level={4}>{t("profile.tab_answers", language)}</Typography.Title>
      <List
        itemLayout="horizontal"
        dataSource={groups}
        locale={{ emptyText: t("profile.activity_answers_empty", language) }}
        renderItem={(group) => (
          <List.Item
            actions={[
              <Link key="view" href={`/questions/${group.question_id}`}>
                <Button type="link" icon={<ArrowRightOutlined />}>{language === 'vi' ? 'Xem câu hỏi' : 'View question'}</Button>
              </Link>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Tooltip title={t("profile.preview_question", language)}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => setPreview(group)}
                  />
                </Tooltip>
              }
              title={<span className="font-medium">{group.question_title ?? (language === 'vi' ? 'Câu hỏi liên quan' : 'Related question')}</span>}
              description={<span className="text-sm text-gray-500">{group.answers.length} {language === 'vi' ? 'trả lời' : 'answers'}</span>}
            />
          </List.Item>
        )}
      />

      <Modal
        title={t("profile.tab_answers", language)}
        centered
        width={760}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={preview ? [
          <Button key="view-full" type="primary" onClick={() => router.push(`/questions/${preview?.question_id}`)}>
            {language === 'vi' ? 'Xem câu hỏi' : 'View Question'}
          </Button>,
          <Button key="close" onClick={() => setPreview(null)}>
            {t('common.close', language)}
          </Button>
        ] : null}
      >
        {preview && (
          <div className="space-y-4">
            {preview.question_title && (
              <div>
                <Typography.Text type="secondary">{t('quiz.review_label_title', language)}</Typography.Text>
                <div className="font-semibold text-base text-gray-900">{preview.question_title}</div>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <div className="space-y-6">
              {preview.answers.map((ans) => (
                <div key={ans.id} className="p-3 border rounded-md">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: ans.content || '' }} />
                  <div className="text-xs text-gray-500 mt-2">
                    <strong>{t("profile.created_at", language)}:</strong> {ans.created_at ? new Date(ans.created_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "N/A"}
                    {ans.updated_at && <span className="ml-4"><strong>{t("profile.updated_at", language)}:</strong> {new Date(ans.updated_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
