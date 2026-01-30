'use client';

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Typography, Card, Modal, Form, message, Select, Spin } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, RollbackOutlined, InboxOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllCategories, createCategory, updateCategory, deleteCategory, restoreCategory, getCategoryById } from '@/action/categories/categoriesAction';
import type { Category } from '@/service/categories.service';

const { Text, Title } = Typography;

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

export default function CategoriesManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'archived'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState<{ id: number; isDeleted: boolean } | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [debouncedSearchQuery, filterStatus, sortOrder]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const allCategories = await getAllCategories();
      
      // Filter by search query
      let filtered = allCategories.filter(cat => 
        cat.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

      // Filter by status
      if (filterStatus === 'published') {
        filtered = filtered.filter(cat => !cat.is_deleted);
      } else if (filterStatus === 'archived') {
        filtered = filtered.filter(cat => cat.is_deleted);
      }

      // Sort by created_at
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

      setCategories(filtered);
    } catch (error) {
      console.error('Error loading categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.parent_id) {
        formData.append('parent_id', values.parent_id);
      }

      const result = await createCategory(formData);
      if (result.success) {
        message.success('Category created successfully');
        setIsCreateModalOpen(false);
        createForm.resetFields();
        loadCategories();
      } else {
        message.error(result.message || 'Failed to create category');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = async (categoryId: number) => {
    setEditingCategoryId(categoryId);
    setIsEditModalOpen(true);
    
    try {
      const result: any = await getCategoryById(categoryId);
      if (result.success && result.data) {
        // Prevent editing archived categories
        if (result.data.is_deleted) {
          message.error('Cannot edit archived categories');
          setIsEditModalOpen(false);
          return;
        }
        editForm.setFieldsValue({
          name: result.data.name,
          parent_id: result.data.parent_id || undefined,
        });
      } else {
        message.error('Failed to load category');
        setIsEditModalOpen(false);
      }
    } catch (error) {
      message.error('Failed to load category');
      setIsEditModalOpen(false);
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingCategoryId) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', String(editingCategoryId));
      formData.append('name', values.name);
      if (values.parent_id) {
        formData.append('parent_id', values.parent_id);
      }

      const result = await updateCategory(formData);
      if (result.success) {
        message.success('Category updated successfully');
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditingCategoryId(null);
        loadCategories();
      } else {
        message.error(result.message || 'Failed to update category');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (categoryId: number, isDeleted: boolean) => {
    setDeleteModalData({ id: categoryId, isDeleted });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteModalData) return;

    setDeletingId(deleteModalData.id);
    try {
      const result = deleteModalData.isDeleted 
        ? await restoreCategory(deleteModalData.id) 
        : await deleteCategory(deleteModalData.id);
      
      if (result.success) {
        message.success(result.message);
        setIsDeleteModalOpen(false);
        setDeleteModalData(null);
        loadCategories();
      } else {
        message.error(result.message || 'Operation failed');
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Parent Category',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parent_id: string | null) => {
        if (!parent_id) return <Text type="secondary">-</Text>;
        const parent = categories.find(c => c.id === parent_id);
        return parent ? parent.name : <Text type="secondary">Unknown</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_deleted',
      key: 'is_deleted',
      width: 120,
      render: (is_deleted: boolean) => (
        <Text type={is_deleted ? 'warning' : 'success'}>
          {is_deleted ? 'Archived' : 'Published'}
        </Text>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: Date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            disabled={record.is_deleted}
            onClick={() => openEditModal(Number(record.id))}
          />
          <Button
            type="text"
            icon={record.is_deleted ? <RollbackOutlined /> : <InboxOutlined />}
            size="small"
            loading={deletingId === Number(record.id)}
            onClick={() => handleDeleteClick(Number(record.id), record.is_deleted)}
            danger={!record.is_deleted}
          />
        </Space>
      ),
    },
  ];

  // Get available parent categories (excluding deleted and the current editing category)
  const getParentOptions = () => {
    return categories
      .filter(cat => !cat.is_deleted && cat.id !== String(editingCategoryId))
      .map(cat => ({
        label: cat.name,
        value: Number(cat.id),
      }));
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Title level={2}>Categories Management</Title>
        </div>

        {/* Filters */}
        <Space size="middle" className="mb-4" wrap>
          <Input
            placeholder="Search categories..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
          />
          
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Published', value: 'published' },
              { label: 'Archived', value: 'archived' },
            ]}
          />

          <Select
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: 150 }}
            options={[
              { label: 'Newest First', value: 'newest' },
              { label: 'Oldest First', value: 'oldest' },
            ]}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Category
          </Button>
        </Space>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
          }}
        />

        {/* Create Modal */}
        <Modal
          title="Create Category"
          open={isCreateModalOpen}
          onOk={() => createForm.submit()}
          onCancel={() => {
            setIsCreateModalOpen(false);
            createForm.resetFields();
          }}
          confirmLoading={submitting}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateSubmit}
          >
            <Form.Item
              label="Category Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter category name' },
                { max: 255, message: 'Name must be less than 255 characters' },
              ]}
            >
              <Input placeholder="Enter category name" />
            </Form.Item>

            <Form.Item
              label="Parent Category (Optional)"
              name="parent_id"
            >
              <Select
                placeholder="Select parent category"
                allowClear
                showSearch
                optionFilterProp="label"
                options={getParentOptions()}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit Category"
          open={isEditModalOpen}
          onOk={() => editForm.submit()}
          onCancel={() => {
            setIsEditModalOpen(false);
            editForm.resetFields();
            setEditingCategoryId(null);
          }}
          confirmLoading={submitting}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
          >
            <Form.Item
              label="Category Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter category name' },
                { max: 255, message: 'Name must be less than 255 characters' },
              ]}
            >
              <Input placeholder="Enter category name" />
            </Form.Item>

            <Form.Item
              label="Parent Category (Optional)"
              name="parent_id"
            >
              <Select
                placeholder="Select parent category"
                allowClear
                showSearch
                optionFilterProp="label"
                options={getParentOptions()}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Archive/Restore Modal */}
        <Modal
          title={deleteModalData?.isDeleted ? 'Restore Category' : 'Archive Category'}
          open={isDeleteModalOpen}
          onOk={confirmDeleteCategory}
          okText={deleteModalData?.isDeleted ? 'Restore' : 'Archive'}
          okType={deleteModalData?.isDeleted ? 'primary' : 'danger'}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeleteModalData(null);
          }}
          confirmLoading={deletingId !== null}
        >
          <p>
            {deleteModalData?.isDeleted
              ? 'Restore this category?'
              : 'Archive this category?'}
          </p>
        </Modal>
      </Card>
    </div>
  );
}
