'use client';

import { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Space, Flex, Typography, Tag, Card, Alert } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { filterByTag, getAllTags } from '@/action/articles/articlesManagementAction';
import type { Article } from '@/service/articles.service';

const { Text } = Typography;

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TagOption {
  id: string;
  name: string;
}

export default function ArticleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedTag, setSelectedTag] = useState('All Tags');
  const [currentPage, setCurrentPage] = useState(1);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const [tags, setTags] = useState<TagOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    (async () => {
      setArticlesError(null);
      setLoadingArticles(true);
      try {
        const res = await filterByTag(debouncedSearchQuery, selectedTag);
        setArticles(res || []);
      } catch (err: any) {
        setArticlesError(err?.message || String(err));
        setArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    })();
  }, [debouncedSearchQuery, selectedTag]);

  useEffect(() => {
    (async () => {
      setLoadingTags(true);
      try {
        const res = await getAllTags();
        setTags((res as TagOption[]) || []);
      } catch (err: any) {
        console.error('Error loading tags:', err);
        setTags([]);
      } finally {
        setLoadingTags(false);
      }
    })();
  }, []);

  const columns: ColumnsType<Article> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Article Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Tag',
      dataIndex: 'article_tags',
      key: 'article_tags',
      width: 150,
      render: (tag: string) => <Tag color="blue">{tag}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color="success">{status}</Tag>,
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date: Date) => (
        <Text type="warning">{new Date(date).toLocaleDateString()}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const tagOptions = [
    { label: 'All Tags', value: 'All Tags' },
    ...tags.map(tag => ({ label: tag.name, value: tag.name })),
  ];

  return (
    <Flex vertical className="flex-1 bg-gray-50">
      <main className="flex-1 overflow-auto px-8 py-6">
        <Card>
          {/* Search and Filter Bar */}
          <Space direction="vertical" size="middle" className="w-full mb-4">
            <Flex gap="middle" align="end">
              <Space direction="vertical" className="flex-1">
                <Text type="secondary">Search:</Text>
                <Input
                  placeholder="Search any ..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  allowClear
                />
              </Space>

              <Space direction="vertical" style={{ width: 250 }}>
                <Text type="secondary">Tags:</Text>
                <Select
                  value={selectedTag}
                  onChange={setSelectedTag}
                  options={tagOptions}
                  loading={loadingTags}
                  size="large"
                  className="w-full"
                />
              </Space>

              <Button type="primary" icon={<PlusOutlined />} size="large">
                Create Article
              </Button>
            </Flex>
          </Space>

          {/* Error Alert */}
          {articlesError && (
            <Alert
              message="Error"
              description={articlesError}
              type="error"
              showIcon
              closable
              className="mb-4"
            />
          )}

          {/* Table */}
          <Table
            columns={columns}
            dataSource={articles}
            loading={loadingArticles}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: 10,
              total: articles.length,
              onChange: setCurrentPage,
              showSizeChanger: false,
            }}
          />
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-8 py-4">
        <Flex justify="space-between" align="center">
          <Text type="secondary" className="text-sm">
            © 2025 - KMSPlus. Designed by <Text strong>KMS Team</Text>. All rights reserved
          </Text>
          <Space size="large">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">FAQs</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms & Condition</a>
          </Space>
        </Flex>
      </footer>
    </Flex>
  );
}