"use client"

import React from "react"
import useLanguageStore, { type Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import Link from "next/link"
import { Button, Tabs, Card, Image, Progress, Avatar } from "antd"
import { PlayCircleOutlined, UserOutlined, StarFilled } from "@ant-design/icons"
import CourseCurriculum from "@/app/(main)/courses/components/CourseCurriculum"
import EnrollButton from "@/app/(main)/courses/components/EnrollButton"

type Props = {
  id: string
  course: any
  enrollment: any
  creator: any
  related: any[]
  averageRating: string
  ratingsCount: number
}

export default function CourseDetail({
  id,
  course,
  enrollment,
  creator,
  related,
  averageRating,
  ratingsCount,
}: Props) {
  const { language: rawLanguage } = useLanguageStore()
  const language = rawLanguage as Language

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded shadow">
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>{t("course.by", language)}</span>
                  <Avatar size={20} src={creator?.avatar_url || undefined} icon={<UserOutlined />} />
                  <span>{creator?.full_name || t("course.unknown_creator", language)}</span>
                </div>
                <div>·</div>
                <div>{course.enrollment_count} {t("course.students", language)}</div>
                <div>·</div>
                <div className="flex items-center gap-1">
                  <StarFilled className="text-yellow-500" />
                  <span>{averageRating}</span>
                  <span className="text-gray-500">({ratingsCount})</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {course.thumbnail_url ? (
                    <Image src={course.thumbnail_url} alt={course.title} className="w-full h-72 object-cover rounded" preview />
                  ) : (
                    <div className="w-full h-72 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      {t("course.no_media", language)}
                    </div>
                  )}
                </div>

                <aside className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600 mt-2 mb-4">
                    {t("course.duration_label", language)}: {course.duration_hours ?? "0"} {t("course.hours_unit", language)}
                  </div>

                  {enrollment ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-600">{t("course.your_progress", language)}</span>
                        <span className="text-blue-600">{Number(enrollment.progress_percentage)}%</span>
                      </div>
                      <Progress percent={Number(enrollment.progress_percentage)} showInfo={false} strokeColor="#22c55e" status="active" />
                      <Link href={`/courses/${id}/learning`}>
                        <Button type="primary" size="large" block className="bg-blue-600 h-12 font-bold text-lg">
                          <PlayCircleOutlined /> {t("course.continue_learning", language)}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <EnrollButton courseId={Number(id)} courseTitle={course.title} courseStatus={course.status} />
                  )}
                </aside>
              </div>

              <div className="mt-6 border-t pt-4">
                <Tabs
                  defaultActiveKey="1"
                  items={[
                    {
                      key: "1",
                      label: t("course.tab_overview", language),
                      children: (
                        <section>
                          <h2 className="text-lg font-semibold mb-2">{t("course.description_title", language)}</h2>
                          <p className="text-gray-700 whitespace-pre-line">{course.description ?? t("course.no_description", language)}</p>
                        </section>
                      ),
                    },
                    {
                      key: "2",
                      label: t("course.tab_curriculum", language),
                      children: (
                        <section>
                          <h3 className="text-lg font-semibold mb-4 text-gray-800">{t("course.curriculum_title", language)}</h3>
                          <CourseCurriculum sections={(course as any).curriculum || []} />
                        </section>
                      ),
                    },
                    {
                      key: "3",
                      label: t("course.tab_instructor", language),
                      children: (
                        <section>
                          <h3 className="text-lg font-semibold mb-2">{t("course.instructor_title", language)}</h3>
                          <Card>
                            <div className="flex items-center gap-4">
                              <Avatar size={56} src={creator?.avatar_url || undefined} icon={<UserOutlined />} />
                              <div>
                                <p className="text-base font-semibold text-gray-800">{creator?.full_name || t("course.unknown_creator", language)}</p>
                                <p className="text-sm text-gray-600">{creator?.email || t("course.no_email", language)}</p>
                              </div>
                            </div>
                          </Card>
                        </section>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card title={t("course.related_courses", language)}>
              <div className="mt-3 space-y-3">
                {related.length === 0 && <p className="text-gray-400 text-sm">{t("course.related_none", language)}</p>}
                {related.map((r) => (
                  <Link key={r.id} href={`/courses/${r.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors">
                    <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {r.thumbnail_url ? <Image src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" preview={false} /> : null}
                    </div>
                    <div className="text-sm truncate font-medium text-gray-700">{r.title}</div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
