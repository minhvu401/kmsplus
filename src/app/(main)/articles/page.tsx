// List articles
'use client';

import React, { useState } from 'react';
// Import các icon cần thiết
import { 
  MessageSquare, // Icon cho bình luận
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

// Giả lập dữ liệu cho danh sách bài viết
const mockArticles = [
  {
    id: 1,
    date: '23/10/2025',
    title: 'Tại sao Trái Đất hình tròn?',
    snippet: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...',
    authorName: 'Nguyễn Văn A',
    authorAvatar: 'https://i.pravatar.cc/150?img=1', // Dùng ảnh avatar giả
    commentCount: 7,
    tag: 'Funny Fact',
    imageUrl: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&h=300&fit=crop' // Ảnh giả
  },
  {
    id: 2,
    date: '23/10/2025',
    title: 'Tại sao Trái Đất hình tròn?',
    snippet: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...',
    authorName: 'Nguyễn Văn A',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    commentCount: 7,
    tag: 'Funny Fact',
    imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    date: '23/10/2025',
    title: 'Tại sao Trái Đất hình tròn?',
    snippet: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...',
    authorName: 'Nguyễn Văn A',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    commentCount: 7,
    tag: 'Funny Fact',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop'
  },
  // Thêm 2 bài nữa cho giống ảnh
  {
    id: 4,
    date: '23/10/2025',
    title: 'Tại sao Trái Đất hình tròn?',
    snippet: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...',
    authorName: 'Nguyễn Văn A',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    commentCount: 7,
    tag: 'Funny Fact',
    imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop'
  },
  {
    id: 5,
    date: '23/10/2025',
    title: 'Tại sao Trái Đất hình tròn?',
    snippet: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...',
    authorName: 'Nguyễn Văn A',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    commentCount: 7,
    tag: 'Funny Fact',
    imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&h=300&fit=crop'
  },
];

export default function ViewArticlePage() {
  const [activeTag, setActiveTag] = useState('Funny Fact');
  const [currentPage, setCurrentPage] = useState(2);
  const totalPages = 50; // Giả lập tổng số trang

  // Hàm render phân trang, lấy từ code ArticleManagement của mày
  const renderPageNumbers = () => {
    const pages = [];
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < totalPages) pages.push(currentPage + 1);
    
    // Logic trong ảnh: 1, 2, 3... 49, 50
    // Logic này phức tạp hơn 1 chút, tạm dùng logic đơn giản
    // Để cho giống ảnh, ta fix cứng:
    if (currentPage === 1) return [1, 2, 3];
    if (currentPage === 2) return [1, 2, 3];
    if (currentPage === 3) return [1, 2, 3, 4];
    if (currentPage > 3 && currentPage < totalPages - 1) 
      return [currentPage - 1, currentPage, currentPage + 1];
    if (currentPage === totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    if (currentPage === totalPages) return [totalPages - 2, totalPages - 1, totalPages];
    
    return [1, 2, 3]; // Default
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50"> {/* Thêm bg-gray-50 cho nền */}
      <main className="flex-1 overflow-auto px-8 py-6">
        
        {/* Header: Tags và Nút Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 uppercase">RELATED TAGS</span>
            {/* Nút Tag */}
            {['Technical', 'Skills', 'Funny Fact'].map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Create Article
          </button>
        </div>

        {/* Danh sách bài viết */}
        <div className="space-y-6">
          {mockArticles.map(article => (
            <div 
              key={article.id} 
              className="bg-white rounded-lg shadow-sm p-5 flex gap-6 items-center"
            >
              {/* Phần Nội dung (bên trái) */}
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{article.date}</p>
                <h2 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 cursor-pointer">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {article.snippet}
                </p>
                
                {/* Footer của Card */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <img 
                        src={article.authorAvatar} 
                        alt={article.authorName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-700">{article.authorName}</span>
                    </div>
                    {/* Comments */}
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{article.commentCount} comments</span>
                    </div>
                  </div>
                  {/* Tag */}
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {article.tag}
                  </span>
                </div>
              </div>
              
              {/* Phần Ảnh (bên phải) */}
              <div className="w-1/3 max-w-xs">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Phân trang (Pagination) - Lấy từ code ArticleManagement */}
        <div className="flex justify-center items-center mt-8">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Logic hiển thị ... và số trang giống ảnh */}
            {currentPage > 3 && (
              <>
                <button onClick={() => setCurrentPage(1)} className="w-8 h-8 text-sm hover:bg-gray-100 rounded">
                  1
                </button>
                <span className="px-2 text-sm text-gray-500">...</span>
              </>
            )}

            {/* Các trang ở giữa */}
            {renderPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm rounded ${
                  page === currentPage 
                    ? 'bg-gray-300 font-medium' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Logic hiển thị ... và số trang cuối */}
            {currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-sm text-gray-500">...</span>
                <button onClick={() => setCurrentPage(49)} className="w-8 h-8 text-sm hover:bg-gray-100 rounded">
                  49
                </button>
                <button onClick={() => setCurrentPage(50)} className="w-8 h-8 text-sm hover:bg-gray-100 rounded">
                  50
                </button>
              </>
            )}

            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </main>

      {/* Footer (Copy từ code ArticleManagement) */}
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