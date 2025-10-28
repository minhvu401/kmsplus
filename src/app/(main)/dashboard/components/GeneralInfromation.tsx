"use client"

import React, { useState } from "react"
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("All Tags")
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data - 10 articles
  const articles = Array(10)
    .fill(null)
    .map((_, idx) => ({
      id: "QU001",
      title: "Tại sao Trái Đất hình tròn?",
      answer: "nó có tròn đâu?",
      tag: "Fun Fact",
      status: "Published",
      lastUpdated: "9/10/2025 14:00:00",
    }))

  const totalPages = 50

  const renderPageNumbers = () => {
    const pages = []
    if (currentPage > 1) pages.push(currentPage - 1)
    pages.push(currentPage)
    if (currentPage < totalPages) pages.push(currentPage + 1)

    return pages
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Article Management</h2>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="w-64">
            <label className="block text-sm text-gray-600 mb-1.5">Tags:</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Tags</option>
              <option>Fun Fact</option>
              <option>Tutorial</option>
              <option>News</option>
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
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Article Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tag</th>
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
              {articles.map((article, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {article.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {article.title}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {article.answer}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-blue-500">{article.tag}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-green-600 font-medium">
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-500">
                    {article.lastUpdated}
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

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">10/100 article</p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentPage > 2 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-8 h-8 text-sm hover:bg-gray-100 rounded"
                >
                  1
                </button>
                {currentPage > 3 && <span className="px-2">...</span>}
              </>
            )}

            {renderPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm rounded ${
                  page === currentPage
                    ? "bg-gray-300 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(49)}
                  className="w-8 h-8 text-sm hover:bg-gray-100 rounded"
                >
                  49
                </button>
                <button
                  onClick={() => setCurrentPage(50)}
                  className="w-8 h-8 text-sm hover:bg-gray-100 rounded"
                >
                  50
                </button>
              </>
            )}

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
