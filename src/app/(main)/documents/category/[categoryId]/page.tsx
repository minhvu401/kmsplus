"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  FileTextOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  FileSyncOutlined,
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import {
  Input,
  Select,
  Button,
  Row,
  Col,
  Empty,
  Spin,
  Card,
  Typography,
} from "antd"
import { t } from "@/lib/i18n"
import useLanguageStore from "@/store/useLanguageStore"

interface Document {
  id: string
  title: string
  version: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  description?: string
}

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const { language } = useLanguageStore()
  const [categoryId, setCategoryId] = useState<string>("")
  const [category, setCategory] = useState<Category | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filterSearch, setFilterSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("updated_at_desc")
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { categoryId: id } = await params
        setCategoryId(id)

        // Fetch category and documents
        const response = await fetch(`/api/documents/category/${id}`)
        if (!response.ok) {
          notFound()
        }

        const data = await response.json()
        setCategory(data.category)
        setDocuments(data.documents || [])
      } catch (error) {
        console.error("Error loading category:", error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params])

  // Filter & Sort Documents
  const getFilteredDocuments = () => {
    let filtered = documents

    // Filter by search text
    if (filterSearch) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(filterSearch.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "updated_at_desc":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        case "updated_at_asc":
          return (
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          )
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "title_desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return filtered
  }

  const handleClearFilters = () => {
    setFilterSearch("")
    setSortBy("updated_at_desc")
  }

  useEffect(() => {
    const active = filterSearch !== ""
    setHasActiveFilters(active)
  }, [filterSearch])

  const filteredDocuments = getFilteredDocuments()

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  if (!category) {
    return notFound()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/documents"
          className="text-gray-500 hover:text-blue-600 transition-colors flex items-center font-medium"
        >
          <ArrowLeftOutlined className="mr-2" /> Quay lại Thư mục gốc
        </Link>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
          {filteredDocuments.length} tài liệu xuất bản
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {category.name}
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          {category.description ||
            "Thư mục này chứa văn bản nội quy quy định liên quan."}
        </p>
      </div>

      {/* Filter Section */}
      <Card className="shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="space-y-4">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder={t("document.filter_search_placeholder", language)}
            prefix={<SearchOutlined />}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            size="middle"
            allowClear
            enterButton={<SearchOutlined />}
            className="mb-2"
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sort Filter */}
            <div className="flex flex-col">
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("document.sort_label", language)}
              </Typography.Text>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                size="middle"
                options={[
                  {
                    label: t("document.sort_updated_newest", language),
                    value: "updated_at_desc",
                  },
                  {
                    label: t("document.sort_updated_oldest", language),
                    value: "updated_at_asc",
                  },
                  {
                    label: t("document.sort_title_asc", language),
                    value: "title_asc",
                  },
                  {
                    label: t("document.sort_title_desc", language),
                    value: "title_desc",
                  },
                ]}
              />
            </div>

            {/* Empty spacer */}
            <div className="flex flex-col"></div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex flex-col justify-end">
                <Button
                  type="dashed"
                  danger
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  {t("document.btn_clear_filter", language)}
                </Button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex justify-end items-center mt-2">
            <Typography.Text type="secondary" className="text-sm">
              {filteredDocuments.length}{" "}
              {language === "vi" ? "tài liệu" : "documents"}
            </Typography.Text>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <Empty
            description={t("document.no_results", language)}
            className="py-20"
          />
        ) : (
          filteredDocuments.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="block group"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start mb-4 md:mb-0">
                  <div className="bg-blue-50 p-3 rounded-full mr-5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileTextOutlined className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <FileSyncOutlined className="mr-1" /> Phiên bản{" "}
                        {doc.version}
                      </span>
                      <span className="flex items-center">
                        <CalendarOutlined className="mr-1" /> Cập nhật{" "}
                        {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-blue-600 font-medium">
                  Đọc nội dung{" "}
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
