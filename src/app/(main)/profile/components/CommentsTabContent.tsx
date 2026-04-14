"use client"

import { useEffect, useState } from "react"
import { List, Button, Modal, Typography, Tooltip, Divider } from "antd"
import { EyeOutlined, ArrowRightOutlined } from "@ant-design/icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

type CommentItem = {
  id: number | string
  article_id?: number | string
  article_title?: string | null
  content?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type CommentGroup = {
  article_id?: number | string
  article_title?: string | null
  comments: CommentItem[]
}

export default function CommentsTabContent({ initialItems = [], userId }: { initialItems?: CommentItem[], userId?: number | string }) {
  const language = useLanguageStore((s) => s.language)
  const [items, setItems] = useState<CommentItem[]>(initialItems)
  const [groups, setGroups] = useState<CommentGroup[]>([])
  const [preview, setPreview] = useState<CommentGroup | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    if ((items?.length ?? 0) > 0) return
    if (!userId) return

    ;(async () => {
      try {
        const res = await fetch(`/api/users/${userId}/comments`)
        const json = await res.json()
        if (!mounted) return
        if (json?.success && Array.isArray(json.data)) setItems(json.data)
      } catch (e) {
        console.error("CommentsTabContent: fallback fetch failed", e)
      }
    })()

    return () => {
      mounted = false
    }
  }, [userId])

  useEffect(() => {
    const map = new Map<string, CommentItem[]>()
    for (const c of items) {
      const key = String(c.article_id ?? "_no_a")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    const grouped: CommentGroup[] = []
    for (const [key, arr] of map.entries()) {
      grouped.push({ article_id: arr[0].article_id, article_title: arr[0].article_title ?? null, comments: arr })
    }
    setGroups(grouped)
  }, [items])

  return (
    <div>
      <Typography.Title level={4}>{t("profile.tab_comments", language)}</Typography.Title>
      <List
        itemLayout="horizontal"
        dataSource={groups}
        locale={{ emptyText: t("profile.activity_comments_empty", language) }}
        renderItem={(group) => (
          <List.Item
            actions={[
              <Link key="view" href={`/articles/${group.article_id}`}>
                <Button type="link" icon={<ArrowRightOutlined />}>{language === 'vi' ? 'Xem bài viết' : 'View article'}</Button>
              </Link>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Tooltip title={t("profile.preview_comment", language)}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => setPreview(group)}
                  />
                </Tooltip>
              }
              title={<span className="font-medium">{group.article_title ?? (language === 'vi' ? 'Bài viết liên quan' : 'Related article')}</span>}
              description={<span className="text-sm text-gray-500">{group.comments.length} {language === 'vi' ? 'bình luận' : 'comments'}</span>}
            />
          </List.Item>
        )}
      />

      <Modal
        title={t("profile.tab_comments", language)}
        centered
        width={760}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={preview ? [
          <Button key="view-full" type="primary" onClick={() => router.push(`/articles/${preview?.article_id}`)}>
            {language === 'vi' ? 'Xem bài viết' : 'View Article'}
          </Button>,
          <Button key="close" onClick={() => setPreview(null)}>
            {t('common.close', language)}
          </Button>
        ] : null}
      >
        {preview && (
          <div className="space-y-4">
            {preview.article_title && (
              <div>
                <Typography.Text type="secondary">{t('article.title', language)}</Typography.Text>
                <div className="font-semibold text-base text-gray-900">{preview.article_title}</div>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <div className="space-y-6">
              {preview.comments.map((c) => (
                <div key={c.id} className="p-3 border rounded-md">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: c.content || '' }} />
                  <div className="text-xs text-gray-500 mt-2">
                    <strong>{t("profile.created_at", language)}:</strong> {c.created_at ? new Date(c.created_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "N/A"}
                    {c.updated_at && <span className="ml-4"><strong>{t("profile.updated_at", language)}:</strong> {new Date(c.updated_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</span>}
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
