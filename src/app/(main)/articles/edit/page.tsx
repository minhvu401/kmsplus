"use client"

import React, { useState, useEffect } from "react"
// Import các icon cho thanh toolbar
import { Bold, Italic, Underline, List } from "lucide-react"

// Giả lập dữ liệu bài viết được fetch về
const fetchedArticle = {
  title: "Tại sao Trái đất chỉ có 70% là nước?",
  content:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...",
  category: "Fun Fact",
}

export default function EditArticlePage() {
  // State cho các trường input, được gán giá trị mặc định từ data fetch về
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Giả lập việc fetch data khi component được load
  useEffect(() => {
    // Trong thực tế, mày sẽ gọi API ở đây, ví dụ:
    // getArticleById(articleId).then(data => {
    //   setTitle(data.title);
    //   setContent(data.content);
    //   setCategory(data.category);
    //   setIsLoading(false);
    // });

    // Giả lập:
    setTitle(fetchedArticle.title)
    setContent(fetchedArticle.content)
    setCategory(fetchedArticle.category)
    setIsLoading(false)
  }, []) // Chạy 1 lần khi load trang

  // Hàm render thanh toolbar (giả lập theo UI)
  const renderToolbar = () => (
    <div className="flex items-center gap-4 mt-2">
      <button className="p-1 text-gray-600 hover:text-gray-900">
        <Bold className="w-4 h-4" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900">
        <Italic className="w-4 h-4" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900">
        <Underline className="w-4 h-4" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900">
        <List className="w-4 h-4" />
      </button>
    </div>
  )

  // Hiển thị loading trong khi chờ data
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p>Loading article data...</p>
      </div>
    )
  }

  return (
    // Dùng layout và padding giống trang ArticleManagement của mày
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-auto px-8 py-6">
        {/* Box trắng chứa toàn bộ form */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Tiêu đề chính của trang */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Edit An Article
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Xử lý logic submit (update) ở đây
              console.log("Saving changes:", { title, content, category })
            }}
            className="space-y-6"
          >
            {/* 1. PHẦN TITLE */}
            <div>
              <label
                htmlFor="title"
                className="block text-base font-medium text-gray-800 mb-2"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Type something here..."
                value={title} // Giá trị từ state (đã được fetch)
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-2">
                {renderToolbar()}
                <span className="text-sm text-gray-500">
                  {title.length} / 150
                </span>
              </div>
            </div>

            {/* Đường kẻ ngang phân cách */}
            <hr className="border-t border-gray-200" />

            {/* 2. PHẦN CONTENT */}
            <div>
              <label
                htmlFor="content"
                className="block text-base font-medium text-gray-800 mb-2"
              >
                Content
              </label>
              <textarea
                id="content"
                placeholder="Type something here..."
                value={content} // Giá trị từ state (đã được fetch)
                onChange={(e) => setContent(e.target.value)}
                maxLength={3000}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-2">
                {renderToolbar()}
                <span className="text-sm text-gray-500">
                  {content.length} / 3,000
                </span>
              </div>
            </div>

            {/* Đường kẻ ngang phân cách */}
            <hr className="border-t border-gray-200" />

            {/* 3. PHẦN CATEGORY */}
            <div>
              <label
                htmlFor="category"
                className="block text-base font-medium text-gray-800 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category} // Giá trị từ state (đã được fetch)
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Fun Fact">Fun Fact</option>
                <option value="Technology">Technology</option>
                <option value="Tutorial">Tutorial</option>
                <option value="News">News</option>
              </select>
            </div>

            {/* 4. PHẦN NÚT BẤM (ACTIONS) */}
            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                type="button"
                className="px-6 py-2 text-red-500 font-medium rounded-lg hover:bg-red-50"
              >
                Leave
              </button>
              <button
                type="submit"
                // Đổi text thành "Save"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer (Copy từ code ArticleManagement của mày) */}
      <footer className="bg-white border-t px-8 py-4 mt-auto">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>
            © 2025 - KMSPlus. Designed by{" "}
            <span className="font-medium">KMS Team</span>. All rights reserved
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">
              FAQs
            </a>
            <a href="#" className="hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-900">
              Terms & Condition
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
