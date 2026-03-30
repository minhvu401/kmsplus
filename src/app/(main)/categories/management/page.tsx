'use client';

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Typography, Card, Modal, Form, message, Select, Spin, Tag, Divider, Row, Col, Segmented, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, RollbackOutlined, InboxOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllCategories, createCategory, updateCategory, deleteCategory, restoreCategory, getCategoryById } from '@/action/categories/categoriesAction';
import { getAllDepartments } from '@/action/department/departmentActions';
import type { Category } from '@/service/categories.service';
import type { Department } from '@/service/department.service';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

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

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    const active = debouncedSearchQuery !== '' || filterStatus !== 'all';
    setHasActiveFilters(active);
  }, [debouncedSearchQuery, filterStatus]);

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

      setCategories(allCategories);
      setFilteredCategories(filtered);
    } catch (error) {
      console.error('Error loading categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const rows = await getAllDepartments();
      setDepartments(rows || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      message.error('Failed to load departments');
      setDepartments([]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
  };

  const handleCreateSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.department_id) {
        formData.append('department_id', values.department_id);
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
          department_id: result.data.department_id || undefined,
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
      if (values.department_id) {
        formData.append('department_id', values.department_id);
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-medium text-gray-900">{name}</span>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (_departmentName: string | null, record: Category) => {
        if (record.department_name) return record.department_name;
        if (!record.department_id) return <Text type="secondary">-</Text>;
        const department = departments.find((d) => d.id === record.department_id);
        return department ? department.name : <Text type="secondary">Unknown</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_deleted',
      key: 'is_deleted',
      width: 130,
      render: (is_deleted: boolean) => (
        <Tag color={is_deleted ? 'red' : 'green'} className="uppercase text-xs font-semibold">
          {is_deleted ? 'Archived' : 'Published'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: Date) => <span className="text-gray-600">{new Date(date).toLocaleDateString('vi-VN')}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, record) => {
        const isGeneralCategory = Number(record.id) === 1;
        const isEditDisabled = record.is_deleted || isGeneralCategory;

        return (
          <Space size="small">
          <Tooltip
            title={
              isGeneralCategory
                ? "'General' is a permanent category."
                : record.is_deleted
                ? 'Course is archived'
                : 'Edit Category'
            }
          >
            <span>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                disabled={isEditDisabled}
                className={
                  isEditDisabled
                    ? "!text-gray-400 cursor-not-allowed hover:!text-gray-400 hover:!bg-transparent"
                    : "text-blue-600 hover:!text-blue-700 hover:bg-blue-50"
                }
                onClick={() => openEditModal(Number(record.id))}
              />
            </span>
          </Tooltip>
          <Tooltip
            title={
              isGeneralCategory
                ? "'General' is a permanent category."
                : record.is_deleted
                ? 'Restore Category'
                : 'Archive Category'
            }
          >
            <span>
              <Button
                type="text"
                icon={record.is_deleted ? <RollbackOutlined /> : <InboxOutlined />}
                size="small"
                loading={deletingId === Number(record.id)}
                disabled={isGeneralCategory}
                onClick={() => handleDeleteClick(Number(record.id), record.is_deleted)}
                danger={!record.is_deleted && !isGeneralCategory}
                className={
                  isGeneralCategory
                    ? "!text-gray-400 cursor-not-allowed hover:!text-gray-400 hover:!bg-transparent"
                    : record.is_deleted
                    ? "text-green-600 hover:!text-green-700 hover:bg-green-50"
                    : "hover:bg-red-50"
                }
              />
            </span>
          </Tooltip>
        </Space>
        )
      },
    },
  ];

  const getDepartmentOptions = () => {
    return departments.map((department) => ({
      label: department.name,
      value: department.id,
    }));
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-4">
          Category Management
        </h1>
        <div className="flex align-center justify-between gap-6" style={{ marginBottom: 16 }}>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Manage and organize your categories
          </p>
          <Button
            style={{
              background: '#ffffff',
              borderColor: '#1e40af',
              borderWidth: '1.5px',
              borderRadius: '0.375rem',
              color: '#1e40af',
              fontSize: '12px',
              fontWeight: 500,
              height: '36px',
              paddingInline: '14px',
              boxShadow: '0 2px 8px rgba(30, 64, 175, 0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              setIsCreateModalOpen(true);
            }}
            onMouseEnter={(e) => {
              const button = e.currentTarget as HTMLButtonElement;
              button.style.background = '#f8fafc';
              button.style.boxShadow = '0 8px 20px rgba(30, 64, 175, 0.2)';
              button.style.borderColor = '#1e3a8a';
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget as HTMLButtonElement;
              button.style.background = '#ffffff';
              button.style.boxShadow = '0 2px 8px rgba(30, 64, 175, 0.12)';
              button.style.borderColor = '#1e40af';
            }}
          >
            Create Category
          </Button>
        </div>
        <Divider style={{ borderColor: 'rgba(37, 99, 235, 0.15)', margin: '16px 0' }} />
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="space-y-3">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder="Search categories..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="middle"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ marginBottom: 12 }}
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Status
              </Text>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Published', value: 'published' },
                  { label: 'Archived', value: 'archived' },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                Sort By
              </Text>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: 'Newest First', value: 'newest' },
                  { label: 'Oldest First', value: 'oldest' },
                ]}
                size="middle"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <Text type="secondary" className="text-sm font-medium mb-2">
                View Mode
              </Text>
              <Segmented
                size="middle"
                value={viewMode}
                onChange={(value) => setViewMode(value as 'list' | 'grid')}
                options={[
                  { label: 'List', value: 'list' },
                  { label: 'Grid', value: 'grid' },
                ]}
                block
              />
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col justify-end">
                <Tooltip title="Clear all filters">
                  <Button
                    type="dashed"
                    danger
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table/Grid View */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {viewMode === 'list' ? (
          <div className="p-6">
            <Table
              columns={columns}
              dataSource={filteredCategories}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                total: filteredCategories.length,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} categories`,
              }}
              bordered
              size="middle"
            />
          </div>
        ) : (
          <div className="p-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Spin spinning={loading} />
                <p className="text-gray-500 mt-4">No categories found</p>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredCategories.map((category) => {
                  const statusColor = category.is_deleted ? 'red' : 'green';
                  const statusLabel = category.is_deleted ? 'Archived' : 'Published';
                  const isGeneralCategory = Number(category.id) === 1;
                  const isEditDisabled = category.is_deleted || isGeneralCategory;
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={category.id}>
                      <Card
                        hoverable
                        className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                        extra={
                          <Tag color={statusColor} className="text-xs">
                            {statusLabel}
                          </Tag>
                        }
                      >
                        <Card.Meta
                          title={
                            <div className="text-blue-600 hover:text-blue-800 truncate font-medium">
                              {category.name}
                            </div>
                          }
                        />
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <Text type="secondary">Department:</Text>
                            <Text strong>
                              {category.department_name
                                ? category.department_name
                                : category.department_id
                                ? departments.find((d) => d.id === category.department_id)?.name || 'Unknown'
                                : '-'}
                            </Text>
                          </div>
                          <div className="flex justify-between">
                            <Text type="secondary">Created:</Text>
                            <Text strong>
                              {new Date(category.created_at).toLocaleDateString('vi-VN')}
                            </Text>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Tooltip
                            title={
                              isGeneralCategory
                                ? "'General' is a permanent category."
                                : category.is_deleted
                                ? 'Course is archived'
                                : 'Edit Category'
                            }
                          >
                            <span className="flex-1">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                className={
                                  isEditDisabled
                                    ? "w-full !text-gray-400 cursor-not-allowed hover:!text-gray-400 hover:!bg-transparent"
                                    : "w-full text-blue-600 hover:!text-blue-700"
                                }
                                disabled={isEditDisabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(Number(category.id));
                                }}
                              >
                                Edit
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              isGeneralCategory
                                ? "'General' is a permanent category."
                                : category.is_deleted
                                ? 'Restore Category'
                                : 'Archive Category'
                            }
                          >
                            <span className="flex-1">
                              <Button
                                type="text"
                                danger={!category.is_deleted && !isGeneralCategory}
                                size="small"
                                icon={category.is_deleted ? <RollbackOutlined /> : <InboxOutlined />}
                                disabled={isGeneralCategory}
                                className={
                                  isGeneralCategory
                                    ? "w-full !text-gray-400 cursor-not-allowed hover:!text-gray-400 hover:!bg-transparent"
                                    : category.is_deleted
                                    ? "w-full text-green-600 hover:!text-green-700 hover:bg-green-50"
                                    : "w-full"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(Number(category.id), category.is_deleted);
                                }}
                              >
                                {category.is_deleted ? 'Restore' : 'Archive'}
                              </Button>
                            </span>
                          </Tooltip>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        )}
      </div>

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
            label="Department"
            name="department_id"
            rules={[{ required: true, message: 'Please select department' }]}
          >
            <Select
              placeholder="Select department"
              showSearch
              optionFilterProp="label"
              options={getDepartmentOptions()}
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
            label="Department (Optional)"
            name="department_id"
          >
            <Select
              placeholder="Select department"
              allowClear
              showSearch
              optionFilterProp="label"
              options={getDepartmentOptions()}
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
    </div>
  );
}
