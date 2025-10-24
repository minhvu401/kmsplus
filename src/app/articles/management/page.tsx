'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Book, HelpCircle, Layers, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllArticles } from '@/action/articles-management/articlesManagementAction';

export default function ArticleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All Tags');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<any[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Articles state (loaded from server action)
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setArticlesError(null);
      setLoadingArticles(true);
      try {
        const res = await getAllArticles();
        setArticles((res as any[]) || []);
      } catch (err: any) {
        setArticlesError(err?.message || String(err));
        setArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    })();
  }, []);

  const totalPages = 50;

  const renderPageNumbers = () => {
    const pages = [];
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < totalPages) pages.push(currentPage + 1);
    
    return pages;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Article Management Section */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            
            {/* Search and Filter Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-end">
                <button
                  onClick={async () => {
                    setArticlesError(null);
                    setLoadingArticles(true);
                    try {
                      const res = await getAllArticles();
                      setArticles((res as any[]) || []);
                    } catch (err: any) {
                      setArticlesError(err?.message || String(err));
                    } finally {
                      setLoadingArticles(false);
                    }
                  }}
                  className="mr-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  {loadingArticles ? 'Loading...' : 'Reload Articles'}
                </button>
                {articlesError && <p className="text-sm text-red-500">{articlesError}</p>}
              </div>
              <div className="flex-1 relative">
                <label className="block text-sm text-gray-600 mb-1.5">Search:</label>
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Article Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tag</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Last Updated</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                      <tbody>
                        {articles.map((article, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{article.id ?? article.article_id}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{article.title ?? article.article_title}</td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-blue-500">{article.tag ?? article.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-green-600 font-medium">{article.status ?? article.state}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-orange-500">{article.lastUpdated ?? article.last_updated ?? article.updated_at}</td>
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
                    <button onClick={() => setCurrentPage(1)} className="w-8 h-8 text-sm hover:bg-gray-100 rounded">
                      1
                    </button>
                    {currentPage > 3 && <span className="px-2">...</span>}
                  </>
                )}

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

                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-2">...</span>}
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
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t px-8 py-4">
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
    </div>
  );
}

