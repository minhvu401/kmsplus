'use client';

import React, { useState } from 'react';
// Import các icon cho thanh toolbar
import { Bold, Italic, Underline, List } from 'lucide-react';

export default function CreateArticlePage() {
  // State cho các trường input
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');

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
  );

  return (
    // Dùng layout và padding giống trang ArticleManagement của mày
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-auto px-8 py-6">
        {/* Box trắng chứa toàn bộ form */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Tiêu đề chính của trang */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Create An Article
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Xử lý logic submit ở đây
              console.log({ title, content, category });
            }}
            className="space-y-6"
          >
            {/* 1. PHẦN TITLE */}
            <div>
              <label htmlFor="title" className="block text-base font-medium text-gray-800 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Type something here..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150} // Set max length
                // Style input cơ bản, không viền, focus có viền xanh
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
              <label htmlFor="content" className="block text-base font-medium text-gray-800 mb-2">
                Content
              </label>
              <textarea
                id="content"
                placeholder="Type something here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={3000} // Set max length
                rows={10} // Chiều cao mặc định
                // Style giống input
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
              <label htmlFor="category" className="block text-base font-medium text-gray-800 mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                // Style select giống ArticleManagement
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Technology">Technology</option>
                <option value="Fun Fact">Fun Fact</option>
                <option value="Tutorial">Tutorial</option>
                <option value="News">News</option>
              </select>
            </div>

            {/* 4. PHẦN NÚT BẤM (ACTIONS) */}
            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                type="button" // type="button" để không submit form
                className="px-6 py-2 text-red-500 font-medium rounded-lg hover:bg-red-50"
              >
                Leave
              </button>
              <button
                type="submit"
                // Style nút "Post" giống nút "Create Article" của mày
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer (Copy từ code ArticleManagement của mày) */}
      <footer className="bg-white border-t px-8 py-4 mt-auto">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>© 2025 - KMSPlus. Designed by <span className="font-medium">KMS Team</span>. All rights reserved</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">FAQs</a>
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Terms & Condition</a>
          </div>
        </div>
      </footer>
    </div>
  );
}