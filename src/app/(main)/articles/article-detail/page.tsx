'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';

// Giả lập dữ liệu chi tiết bài viết
const mockArticleDetail = {
  date: '23/10/2026',
  title: 'Tại sao Trái Đất hình tròn?',
  intro: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit...',
  imageUrl: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&fit=crop',
  author: {
    name: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'Business Analyst', 
    tags: ['Staff'] 
  },
};

// Cập nhật mock Related Articles (category sẽ không được dùng)
const mockRelatedArticles = [
  { id: 1, title: 'Tại sao Trái Đất hình tròn?', category: 'Funny Fact', date: '22/10/2026' },
  { id: 2, title: 'Một bài viết liên quan khác', category: 'Technical', date: '21/10/2026' },
  { id: 3, title: 'Khám phá mới về vũ trụ', category: 'News', date: '20/10/2026' },
];

export default function ArticleDetailPage() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <main className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================================== */}
          {/* CỘT NỘI DUNG CHÍNH (TRÁI)     */}
          {/* ================================== */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 lg:p-10">
            {/* Header bài viết */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <CalendarDays className="w-4 h-4" />
              <span>{mockArticleDetail.date}</span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {mockArticleDetail.title}
            </h1>
            <p className="text-lg italic text-gray-600 mb-6">
              {mockArticleDetail.intro}
            </p>

            {/* Ảnh chính */}
            <img 
              src={mockArticleDetail.imageUrl} 
              alt={mockArticleDetail.title}
              className="w-full h-auto object-cover rounded-lg mb-8"
            />

            {/* Nội dung bài viết (Rich Text) */}
            <div className="space-y-6 text-gray-700 leading-relaxed text-base">
              <h2 className="text-xl font-semibold text-gray-800 mt-4">
                1. Vai trò chính của Lực hấp dẫn
              </h2>
              <p>
                Một hòn đá có khối lượng đều tạo ra lực hấp dẫn, và lực này hút mọi vật chất khác về phía nó.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  <strong>Sự hình thành ban đầu:</strong> Khoảng 4.5 tỷ năm trước...
                </li>
                <li>
                  <strong>Vật chất bị nén chặt:</strong> Khi khối vật chất này ngày càng lớn dần...
                </li>
                <li>
                  <strong>Hình cầu là kết quả tự nhiên:</strong> Hình dạng duy nhất...
                </li>
              </ul>
              <p>
                Ví dụ dễ hiểu: Một giọt nước lơ lửng trong không gian...
              </p>
              <h2 className="text-xl font-semibold text-gray-800 mt-4">
                2. Trái Đất không phải là một hình cầu hoàn hảo
              </h2>
              <p>
                Mặc dù chúng ta nói Trái Đất hình tròn...
              </p>
              <h2 className="text-xl font-semibold text-gray-800 mt-4">
                3. Vậy còn núi và vực thẳm thì sao?
              </h2>
              <p>
                Bạn có thể thắc mắc...
              </p>
            </div>

            {/* Tác giả (cuối bài) */}
            <hr className="my-8 border-t border-gray-200" />
            <div className="flex items-center gap-3">
              <img 
                src={mockArticleDetail.author.avatar}
                alt={mockArticleDetail.author.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{mockArticleDetail.author.name}</p>
              </div>
            </div>

            {/* Khung bình luận */}
            <div className="mt-10">
              <textarea
                placeholder="Write a comment..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end mt-2">
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Post
                </button>
              </div>
            </div>

          </div>

          {/* ================================== */}
          {/* CỘT SIDEBAR (PHẢI)         */}
          {/* ================================== */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Card Tác giả (Giữ nguyên) */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Author</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">{mockArticleDetail.author.name}</p>
                  <p className="text-sm text-gray-500 mb-2">{mockArticleDetail.author.role}</p>
                  
                  {mockArticleDetail.author.tags && mockArticleDetail.author.tags.includes('Staff') && (
                    <span className="bg-orange-400 text-white px-3 py-1 rounded-md text-xs font-medium">
                      Staff
                    </span>
                  )}
                </div>
                <img 
                  src={mockArticleDetail.author.avatar}
                  alt={mockArticleDetail.author.name}
                  className="w-12 h-12 rounded-full flex-shrink-0 ml-4"
                />
              </div>
            </div>

            {/* Card Bài viết liên quan (ĐÃ SỬA) */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Related Articles</h3>
              
              {/* Bỏ space-y và dùng flex flex-col */}
              <div className="flex flex-col">
                {mockRelatedArticles.map((article, index) => (
                  // Dùng React.Fragment để bọc item và đường kẻ ngang
                  <React.Fragment key={article.id}>
                    
                    {/* ===== THÊM MỚI: Thêm đường kẻ ngang (không thêm trước item đầu tiên) ===== */}
                    {index > 0 && (
                      <hr className="my-4 border-t border-gray-100" />
                    )}

                    {/* Thêm padding y để tạo khoảng cách với đường kẻ ngang */}
                    <div className="py-2"> 
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarDays className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{article.date}</span>
                      </div>
                      
                      <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 leading-tight">
                        {article.title}
                      </a>
                      
                      {/* ===== ĐÃ XÓA: Bỏ category (tag) ===== */}
                    </div>

                  </React.Fragment>
                ))}
              </div>
            </div>

          </div> {/* Hết cột sidebar */}
        </div> {/* Hết grid layout */}
      </main>

      {/* Footer (Giữ nguyên) */}
      <footer className="bg-white border-t px-8 py-4 mt-auto">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>© 2026 - KMSPlus. Designed by <span className="font-medium">KMS Team</span>. All rights reserved</p>
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