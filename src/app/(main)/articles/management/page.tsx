"use client"

import React, { useState, useEffect } from "react"
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
// === SỬA ĐỔI 1: Import hàm 'searchArticle' ===
import {
  filterByTag,
  getAllTags,
} from "@/action/articles/articlesManagementAction"
// Bỏ import getAllArticles

// === THÊM MỚI 1: Hook 'useDebounce' ===
// Hook này giúp trì hoãn việc search cho đến khi người dùng gõ xong
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Hủy timeout nếu value thay đổi (người dùng gõ tiếp)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function ArticleManagement() {
  const [searchQuery, setSearchQuery] = useState("")

  // === THÊM MỚI 2: Tạo state "debounced" ===
  // Chỉ search khi người dùng ngừng gõ 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const [selectedTag, setSelectedTag] = useState("All Tags")
  const [currentPage, setCurrentPage] = useState(1)
  // ... (các state không cần thiết như users, loadingUsers có thể bỏ đi nếu không dùng)

  // Articles state
  const [articles, setArticles] = useState<any[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [articlesError, setArticlesError] = useState<string | null>(null)

  // Tags state
  const [tags, setTags] = useState<any[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // === SỬA ĐỔI 2: Đây là thay đổi quan trọng nhất ===
  // useEffect này sẽ tự động chạy lại mỗi khi 'debouncedSearchQuery' hoặc 'selectedTag' thay đổi
  useEffect(() => {
    ;(async () => {
      setArticlesError(null)
      setLoadingArticles(true)
      try {
        // Gọi hàm searchArticle với query và tag filter
        const res = await filterByTag(debouncedSearchQuery, selectedTag)
        setArticles((res as any[]) || [])
      } catch (err: any) {
        setArticlesError(err?.message || String(err))
        setArticles([])
      } finally {
        setLoadingArticles(false)
      }
    })()
  }, [debouncedSearchQuery, selectedTag]) // <-- Lắng nghe cả debouncedSearchQuery và selectedTag

  // Load tags từ database khi component mount
  useEffect(() => {
    ;(async () => {
      setLoadingTags(true)
      try {
        const res = await getAllTags()
        setTags((res as any[]) || [])
      } catch (err: any) {
        console.error("Error loading tags:", err)
        setTags([])
      } finally {
        setLoadingTags(false)
      }
    })()
  }, []) // Chỉ chạy 1 lần khi component mount

  const totalPages = 50 // Mày nên lấy số này từ server

  // ... (hàm renderPageNumbers giữ nguyên) ...
  const renderPageNumbers = () => {
    const pages = []
    if (currentPage > 1) pages.push(currentPage - 1)
    pages.push(currentPage)
    if (currentPage < totalPages) pages.push(currentPage + 1)
    return pages
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Search and Filter Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <label className="block text-sm text-gray-600 mb-1.5">
                  Search:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search any ..."
                    value={searchQuery}
                    // Input này chỉ cập nhật 'searchQuery', không gọi API
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              {/* ... (Phần Tags và Nút Create Article giữ nguyên) ... */}
              <div className="w-64">
                <label className="block text-sm text-gray-900 mb-1.5">
                  Tags:
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={loadingTags}
                >
                  <option className="text-gray-900" value="All Tags">
                    All Tags
                  </option>
                  {tags.map((tag) => (
                    <option
                      key={tag.id}
                      className="text-gray-900"
                      value={tag.name}
                    >
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Create Article
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* ... (Phần <thead> giữ nguyên) ... */}
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Article Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Tag
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Last Updated
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* === SỬA ĐỔI 3: Thêm logic loading và error === */}
                  {loadingArticles && (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  )}
                  {articlesError && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-red-500">
                        {articlesError}
                      </td>
                    </tr>
                  )}
                  {!loadingArticles &&
                    !articlesError &&
                    articles.map((article, idx) => (
                      // === SỬA ĐỔI 4: Dùng `article.id` làm key (tốt hơn `idx`) ===
                      <tr
                        key={article.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {article.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {article.title}
                        </td>
                        <td className="px-4 py-3">
                          {/* Mày đã sửa tên cột này đúng rồi */}
                          <span className="text-sm text-blue-500">
                            {article.article_tags}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-green-600 font-medium">
                            {article.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-orange-500">
                          {/* Mày đã sửa cột này đúng rồi */}
                          {new Date(article.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="p-1.5 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* ... (Phần Pagination và Footer giữ nguyên) ... */}
            <div className="flex justify-between items-center mt-6">
              {/* ... */}
            </div>
          </div>
        </div>

        <footer className="bg-white border-t px-8 py-4">{/* ... */}</footer>
      </div>
    </div>
  )
}
