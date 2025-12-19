'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Space, Flex, Typography, Divider, message } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  CloseOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getAllTags, createArticle } from '@/action/articles/articlesManagementAction';
import type { Tag } from '@/service/articles.service';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CreateArticlePage() {
  const [form] = Form.useForm();
  const [titleLength, setTitleLength] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const router = useRouter();

  // Load tags từ database khi component mount
  useEffect(() => {
    (async () => {
      setLoadingTags(true);
      try {
        const res = await getAllTags();
        setTags(res || []);
      } catch (err: any) {
        console.error('Error loading tags:', err);
        message.error('Failed to load categories');
        setTags([]);
      } finally {
        setLoadingTags(false);
      }
    })();
  }, []);

  const handleSubmit = async (values: any) => {
    console.log('Form values:', values);
    setLoading(true);
    
    try {
      // Tạo FormData để gửi lên server
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      formData.append('category', values.category);

      console.log('Sending data:', {
        title: values.title,
        content: values.content,
        category: values.category
      });

      // Gọi server action
      const result = await createArticle(formData);
      
      console.log('Create article result:', result);

      if (result.success) {
        message.success(result.message || 'Article created successfully!');
        form.resetFields();
        setTitleLength(0);
        setContentLength(0);
        
        // Redirect về trang management sau 1 giây
        setTimeout(() => {
          router.push('/articles/management');
        }, 1000);
      } else {
        console.error('Failed to create article:', result.message);
        message.error(result.message || 'Failed to create article');
      }
    } catch (error: any) {
      console.error('Error creating article:', error);
      message.error(error?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const ToolbarButtons = () => (
    <Space size="small">
      <Button type="text" icon={<BoldOutlined />} size="small" />
      <Button type="text" icon={<ItalicOutlined />} size="small" />
      <Button type="text" icon={<UnderlineOutlined />} size="small" />
      <Button type="text" icon={<UnorderedListOutlined />} size="small" />
    </Space>
  );

  return (
    <Flex vertical className="flex-1">
      <main className="flex-1 overflow-auto px-8 py-6">
        <Card className="max-w-4xl mx-auto">
          <Title level={2} className="!mb-6">
            Create An Article
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {/* Title Field */}
            <Form.Item
              label={<Text strong className="text-base">Title</Text>}
              name="title"
              rules={[
                { required: true, message: 'Please enter a title' },
                { max: 150, message: 'Title must be less than 150 characters' },
              ]}
            >
              <Input
                placeholder="Type something here..."
                maxLength={150}
                onChange={(e) => setTitleLength(e.target.value.length)}
                size="large"
              />
            </Form.Item>

            <Flex justify="space-between" align="center" className="mt-2 mb-4">
              <ToolbarButtons />
              <Text type="secondary" className="text-sm">
                {titleLength} / 150
              </Text>
            </Flex>

            <Divider />

            {/* Content Field */}
            <Form.Item
              label={<Text strong className="text-base">Content</Text>}
              name="content"
              rules={[
                { required: true, message: 'Please enter content' },
                { max: 3000, message: 'Content must be less than 3000 characters' },
              ]}
            >
              <TextArea
                placeholder="Type something here..."
                maxLength={3000}
                rows={10}
                onChange={(e) => setContentLength(e.target.value.length)}
                size="large"
              />
            </Form.Item>

            <Flex justify="space-between" align="center" className="mt-2 mb-4">
              <ToolbarButtons />
              <Text type="secondary" className="text-sm">
                {contentLength} / 3,000
              </Text>
            </Flex>

            <Divider />

            {/* Category Field */}
            <Form.Item
              label={<Text strong className="text-base">Category</Text>}
              name="category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select
                options={tags.map(tag => ({ label: tag.name, value: tag.name }))}
                size="large"
                loading={loadingTags}
                placeholder="Select a category"
              />
            </Form.Item>

            {/* Action Buttons */}
            <Form.Item className="!mb-0">
              <Flex justify="flex-end" gap="middle" className="pt-4">
                <Button
                  size="large"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    form.resetFields();
                    setTitleLength(0);
                    setContentLength(0);
                  }}
                  disabled={loading}
                >
                  Leave
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  loading={loading}
                >
                  Post
                </Button>
              </Flex>
            </Form.Item>
          </Form>
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