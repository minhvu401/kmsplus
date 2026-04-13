"use client"

import { useEffect, useState } from "react"
import { Modal, Typography, Divider, Row, Col, Empty } from "antd"
import { CourseCard } from "@/components/ui/courses/course-card"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

export default function LearningTabContent({ initialItems = [], userId }: { initialItems?: any[], userId?: number | string }) {
  const language = useLanguageStore((s) => s.language)
  const [items, setItems] = useState<any[]>(initialItems || [])
  const [preview, setPreview] = useState<any | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if ((items?.length ?? 0) > 0) return
    if (!userId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/courses/resume`)
        const json = await res.json()
        if (json?.success && Array.isArray(json.courses)) setItems(json.courses)
      } catch (e) {
        // fallback ignored
      }
    })()
  }, [userId])

  const openPreview = async (courseId: number) => {
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/preview`)
      const json = await res.json()
      if (json?.success) setPreview(json.data)
    } catch (e) {
      console.error("Failed to load course preview", e)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div>
      <Typography.Title level={4}>{t("profile.tab_learning", language)}</Typography.Title>
      {items.length === 0 ? (
        <Empty description={t("profile.activity_learning_placeholder", language)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((course: any) => (
            <div key={course.id} onClick={() => openPreview(course.id)}>
              <CourseCard course={course} instructor={{ name: course.creator_name || course.creator_full_name || 'Instructor' }} description={course.description} rating={course.average_rating} students={course.rating_count} progress={0} />
            </div>
          ))}
        </div>
      )}

      <Modal
        title={preview?.title || t("profile.tab_learning", language)}
        centered
        width={900}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={null}
      >
        {previewLoading && <div>Loading...</div>}
        {preview && !previewLoading && (
          <div>
            <Row gutter={16}>
              <Col span={16}>
                <h2 className="text-xl font-semibold">{preview.title}</h2>
                <div className="text-sm text-gray-600 mb-2">{preview.category_name}</div>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-4">{preview.description}</div>

                <Divider />
                <h4 className="font-semibold">Curriculum</h4>
                <div className="space-y-3">
                  {Array.isArray(preview.curriculum) && preview.curriculum.slice(0,3).map((sec: any) => (
                    <div key={sec.id}>
                      <div className="font-medium">{sec.title}</div>
                      <ul className="list-disc ml-5 text-sm text-gray-700">
                        {sec.items && sec.items.slice(0,3).map((it: any) => (
                          <li key={it.id}>{it.title}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Col>
              <Col span={8}>
                <div className="space-y-3">
                  <div><strong>Instructor:</strong> {preview.creator_name || preview.creator_full_name || '—'}</div>
                  <div><strong>Duration:</strong> {preview.duration_hours ?? '—'}h</div>
                  <div><strong>Enrollment:</strong> {preview.enrollment_count ?? 0}</div>
                  <div><strong>Rating:</strong> {preview.average_rating ?? 0} ({preview.rating_count ?? 0})</div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}
