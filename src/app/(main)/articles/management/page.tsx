'use client';

import React, { useState, useEffect, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Table, Input, Select, Button, Space, Flex, Typography, Tag as AntTag, Card, Alert, Segmented, Row, Col, Spin, Modal, Form, Divider, message, Tooltip, Upload } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, CloseOutlined, SaveOutlined, RollbackOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import { filterByTagAndCategory, getAllTags, deleteArticle, getAllCategories, createArticle, getArticleById, updateArticle, restoreArticle } from '@/action/articles/articlesManagementAction';
import type { Article, Tag } from '@/service/articles.service';
import { uploadImageToCloudinary, getCloudinaryThumbnailUrl } from '@/lib/cloudinary';
import QuillEditor from '@/components/QuillEditor';

if (typeof window !== 'undefined') {
  (window as any).React = React;
}

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

  return debouncedValue
}

// Selection save/restore helpers
const saveSelection = (ref: React.MutableRefObject<Range | null>) => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    ref.current = selection.getRangeAt(0)
    return true
  }
  return false
}

const restoreSelection = (ref: React.MutableRefObject<Range | null>) => {
  const selection = window.getSelection()
  if (selection && ref.current) {
    try {
      selection.removeAllRanges()
      selection.addRange(ref.current)
    } catch (e) {
      console.log("Could not restore selection")
    }
  }
}

const focusEditor = (editorRef: React.RefObject<HTMLDivElement>) => {
  editorRef.current?.focus({ preventScroll: true })
}

const applyFormat = (
  command: string,
  editorRef: React.RefObject<HTMLDivElement>,
  selectionRef: React.MutableRefObject<Range | null>
) => {
  restoreSelection(selectionRef)
  document.execCommand(command, false)
  focusEditor(editorRef)
}

const applyHeading = (
  level: string,
  editorRef: React.RefObject<HTMLDivElement>,
  selectionRef: React.MutableRefObject<Range | null>
) => {
  restoreSelection(selectionRef)
  document.execCommand("formatBlock", false, level)
  focusEditor(editorRef)
}

const applyQuote = (
  editorRef: React.RefObject<HTMLDivElement>,
  selectionRef: React.MutableRefObject<Range | null>
) => {
  restoreSelection(selectionRef)
  document.execCommand("formatBlock", false, "<blockquote>")
  focusEditor(editorRef)
}

export default function ArticleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedTag, setSelectedTag] = useState('All Tags');
  const [selectedCategory, setSelectedCategory] = useState<number | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [titleContent, setTitleContent] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState(''); // New: Cloudinary thumbnail
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'draft' | 'published' | 'pending'>('published');
  const [creatingArticle, setCreatingArticle] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false); // New
  const titleEditorRef = useRef<HTMLDivElement>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [editForm] = Form.useForm();
  const [editTitleContent, setEditTitleContent] = useState('');
  const [editContentValue, setEditContentValue] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editSubmitStatus, setEditSubmitStatus] = useState<'draft' | 'published' | 'pending'>('published');
  const [editingArticle, setEditingArticle] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [editThumbnailUrl, setEditThumbnailUrl] = useState(''); // New
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false); // New

  const statusColors: Record<string, string> = {
    published: 'green',
    draft: 'blue',
    pending: 'gold',
    rejected: 'red',
    archived: 'red',
  };

  const refreshCurrentArticles = async (showLoader: boolean = true) => {
    setArticlesError(null);
    if (showLoader) setLoadingArticles(true);
    try {
      const catId = selectedCategory === 'All' ? undefined : selectedCategory;
      let statusFilter = selectedStatus === 'All' ? undefined : selectedStatus;
      let isDeletedFilter: 'all' | boolean = 'all';
      
      // If status filter is 'archived', set isDeletedFilter to true and reset statusFilter
      if (statusFilter === 'archived') {
        isDeletedFilter = true;
        statusFilter = undefined;
      }
      
      const res = await filterByTagAndCategory(debouncedSearchQuery, selectedTag, catId, statusFilter, isDeletedFilter);
      
      // Sort articles based on sortOrder
      const sortedArticles = (res || []).sort((a, b) => {
        const dateA = new Date((a as any).created_at).getTime();
        const dateB = new Date((b as any).created_at).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
      
      setArticles(sortedArticles);
    } catch (err: any) {
      setArticlesError(err?.message || String(err));
      setArticles([]);
    } finally {
      if (showLoader) setLoadingArticles(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setContentValue(value);
    
    const imgRegex = /<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>/g;
    let match;
    let firstImage = '';

    while ((match = imgRegex.exec(value)) !== null) {
      if (match[1]) {
        firstImage = match[1];
        break;
      }
    }

    setImageUrl(firstImage);
  };

  // New: Handle thumbnail upload
  const handleThumbnailUpload = async (file: File) => {
    console.log('Starting thumbnail upload...', file.name, file.type, file.size);
    setUploadingThumbnail(true);
    try {
      const result = await uploadImageToCloudinary(file, 'article-thumbnails');
      console.log('Upload successful:', result);
      setThumbnailUrl(result.secure_url);
      message.success('Thumbnail uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error?.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // New: Handle edit thumbnail upload
  const handleEditThumbnailUpload = async (file: File) => {
    console.log('Starting edit thumbnail upload...', file.name, file.type, file.size);
    setUploadingEditThumbnail(true);
    try {
      const result = await uploadImageToCloudinary(file, 'article-thumbnails');
      console.log('Upload successful:', result);
      setEditThumbnailUrl(result.secure_url);
      message.success('Thumbnail uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error?.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingEditThumbnail(false);
    }
  };

  useEffect(() => {
    refreshCurrentArticles();
  }, [debouncedSearchQuery, selectedTag, selectedCategory, selectedStatus, sortOrder]);

  useEffect(() => {
    (async () => {
      try {
        setUserRoles([]);
        setIsAdmin(false);
      } catch (err) {
        console.error('Error loading user roles:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingTags(true);
      try {
        const res = await getAllTags();
        setTags((res as Tag[]) || []);
      } catch (err: any) {
        console.error('Error loading tags:', err);
        setTags([]);
      } finally {
        setLoadingTags(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingCategories(true);
      try {
        const res = await getAllCategories();
        setCategories(res || []);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
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
      render: (title: string, record: Article) => (
        <a 
          href={`/articles/${record.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
        >
          {title}
        </a>
      ),
    },
    {
      title: 'Tag',
      dataIndex: 'article_tags',
      key: 'article_tags',
      width: 150,
      render: (tagString: string) => {
        if (!tagString) return <Text type="secondary">No tags</Text>;
        const tagList = tagString
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        
        const visibleTags = tagList.slice(0, 2);
        const hiddenTags = tagList.slice(2);
        
        return (
          <Space size={[4, 4]} wrap>
            {visibleTags.map((tag) => (
              <AntTag key={tag} color="blue">{tag}</AntTag>
            ))}
            {hiddenTags.length > 0 && (
              <Tooltip title={hiddenTags.join(', ')}>
                <AntTag color="default">+{hiddenTags.length}</AntTag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 150,
      render: (category: string | null) => <Text>{category || 'null'}</Text>,
    },
    // New: Thumbnail column
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      width: 120,
      render: (thumbnailUrl: string, record: Article) => {
        const src = thumbnailUrl || record.image_url;
        if (!src) {
          return <Text type="secondary">No image</Text>;
        }

        return (
          <img 
            src={src}
            alt="Thumbnail" 
            className="w-20 h-16 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x60?text=No+Image";
            }}
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: Article) => {
        const displayStatus = record.is_deleted ? 'archived' : status;
        const displayText = record.is_deleted ? 'Archived' : status;
        return <AntTag color={statusColors[displayStatus] || 'default'}>{displayText}</AntTag>;
      },
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
            onClick={() => openEditModal(Number(record.id))}
          />
          <Button
            type="text"
            danger={!record.is_deleted}
            icon={record.is_deleted ? <RollbackOutlined /> : <DeleteOutlined />}
            size="small"
            loading={deletingId === Number(record.id)}
            onClick={() => handleArchiveClick(Number(record.id), !!record.is_deleted)}
          />
        </Space>
      ),
    },
  ];

  const tagOptions = [
    { label: 'All Tags', value: 'All Tags' },
    ...tags.map((tag) => ({ label: tag.name, value: tag.name })),
  ];

  const categoryOptions = [
    { label: 'All Categories', value: 'All' },
    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
  ];

  const statusOptions = [
    { label: 'All Status', value: 'All' },
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Archived', value: 'archived' },
  ];

  const handleArchiveClick = async (articleId: number, isDeleted: boolean) => {
    const confirmText = isDeleted
      ? 'Restore this article?'
      : 'Archive this article? (This will mark it as archived)';
    const ok = window.confirm(confirmText);
    if (!ok) return;
    try {
      setDeletingId(articleId);
      const res = isDeleted ? await restoreArticle(articleId) : await deleteArticle(articleId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to update');
      }
      await refreshCurrentArticles(false);
    } catch (err: any) {
      setArticlesError(err?.message || 'Failed to update');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = async (articleId: number) => {
    setEditingArticleId(articleId);
    setIsEditModalOpen(true);
    setLoadingEditData(true);
    
    try {
      const result: any = await getArticleById(articleId);
      if (result.success && result.data) {
        const article = result.data;
        console.log('📋 Edit Modal - Fetched article:', { id: articleId, title: article.title, contentLength: article.content?.length || 0, content: article.content });
        setEditTitleContent(article.title || '');
        setEditContentValue(article.content || '');
        setEditImageUrl(article.image_url || '');
        setEditThumbnailUrl(article.thumbnail_url || '');
        setEditSelectedTags(article.tags || []);
        
        editForm.setFieldsValue({
          title: article.title,
          content: article.content,
          categoryId: article.category_id,
          tags: article.tags,
        });
      } else {
        message.error('Failed to load article');
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      message.error('Failed to load article');
      setIsEditModalOpen(false);
    } finally {
      setLoadingEditData(false);
    }
  };

  const handleEditEditorChange = (value: string) => {
    setEditContentValue(value);
    
    const imgRegex = /<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>/g;
    let match;
    let firstImage = '';

    while ((match = imgRegex.exec(value)) !== null) {
      if (match[1]) {
        firstImage = match[1];
        break;
      }
    }

    setEditImageUrl(firstImage);
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingArticleId) return;
    setEditingArticle(true);
    
    try {
      const formData = new FormData();
      formData.append('id', String(editingArticleId));
      formData.append('title', editTitleContent);
      formData.append('content', editContentValue);
      formData.append('status', editSubmitStatus);
      formData.append('tags', JSON.stringify(editSelectedTags));
      formData.append('category_id', values?.categoryId ? String(values.categoryId) : '');
      formData.append('image_url', editImageUrl);
      // New: Add thumbnail from Cloudinary
      if (editThumbnailUrl) {
        formData.append('thumbnail_url', editThumbnailUrl);
      }

      const result = await updateArticle(formData);
      if (result.success) {
        message.success(result.message || 'Article updated successfully!');
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditTitleContent('');
        setEditContentValue('');
        setEditImageUrl('');
        setEditThumbnailUrl(''); // Reset thumbnail
        setEditSelectedTags([]);
        setEditingArticleId(null);
        setEditSubmitStatus('published');
        await refreshCurrentArticles(false);
      } else {
        message.error(result.message || 'Failed to update article');
      }
    } catch (error: any) {
      message.error(error?.message || 'An error occurred');
    } finally {
      setEditingArticle(false);
    }
  };

  return (
    <Flex vertical className="flex-1 bg-gray-50">
      <main className="flex-1 overflow-auto px-8 py-6">
        <Card>
          <Flex justify="space-between" align="center" className="!mb-4">
            <Title level={3} className="!mb-0">
              Article Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                createForm.resetFields();
                setTitleContent('');
                setContentValue('');
                setSelectedTagsForCreate([]);
                setSubmitStatus('published');
                setIsModalOpen(true);
              }}
            >
              Create Article
            </Button>
          </Flex>

          <Space direction="vertical" size="middle" className="w-full mb-6">
            {/* Search Bar - Full Width */}
            <Flex gap="middle">
              <Space direction="vertical" className="w-full">
                <Text type="secondary">Search:</Text>
                <Input
                  placeholder="Search any..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  allowClear
                />
              </Space>
            </Flex>

            {/* Filters Row */}
            <Flex gap="middle" align="end" wrap>
              <Space direction="vertical" style={{ minWidth: 160, flex: 1 }}>
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

              <Space direction="vertical" style={{ minWidth: 160, flex: 1 }}>
                <Text type="secondary">Category:</Text>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categoryOptions}
                  loading={loadingCategories}
                  size="large"
                  className="w-full"
                />
              </Space>

              <Space direction="vertical" style={{ minWidth: 140, flex: 1 }}>
                <Text type="secondary">Status:</Text>
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  size="large"
                  className="w-full"
                />
              </Space>

              <Space direction="vertical" style={{ minWidth: 140, flex: 1 }}>
                <Text type="secondary">Sort by:</Text>
                <Select
                  value={sortOrder}
                  onChange={setSortOrder}
                  options={[
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Oldest First', value: 'oldest' },
                  ]}
                  size="large"
                  className="w-full"
                />
              </Space>
            </Flex>
          </Space>

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

          {/* View Mode Segmented - Above List */}
          <Flex justify="flex-end" className="mb-4">
            <Segmented
              size="large"
              value={viewMode}
              onChange={(value) => setViewMode(value as 'list' | 'grid')}
              options={[
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
              ]}
            />
          </Flex>

          {viewMode === 'list' ? (
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
          ) : (
            <Spin spinning={loadingArticles}>
              <Row gutter={[16, 16]}>
                {articles.map((article) => {
                  const tagList = (article.article_tags || '')
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const displayStatus = article.is_deleted ? 'archived' : article.status;
                  const displayText = article.is_deleted ? 'Deleted' : article.status;
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={article.id}>
                      <Card
                        hoverable
                        title={article.title}
                        extra={<AntTag color={statusColors[displayStatus] || 'default'}>{displayText}</AntTag>}
                        cover={(
                          <img
                            src={article.thumbnail_url || article.image_url || 'https://via.placeholder.com/240x160?text=No+Image'}
                            alt="Thumbnail"
                            className="h-40 w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/240x160?text=No+Image';
                            }}
                          />
                        )}
                      >
                        <Space direction="vertical" size="small" className="w-full">
                          <Text type="secondary">
                            Updated: {new Date(article.updated_at).toLocaleDateString()}
                          </Text>
                          <div>
                            <Text type="secondary" strong>Category: </Text>
                            <Text>{article.category_name || 'null'}</Text>
                          </div>
                          <Space wrap size={[4, 4]}>
                            {tagList.length === 0 && <Text type="secondary">No tags</Text>}
                            {tagList.map((tag) => (
                              <AntTag key={`${article.id}-${tag}`} color="blue">{tag}</AntTag>
                            ))}
                          </Space>
                          <Space>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              size="small"
                              onClick={() => openEditModal(Number(article.id))}
                            />
                            <Button
                              type="text"
                              danger={!article.is_deleted}
                              icon={article.is_deleted ? <RollbackOutlined /> : <DeleteOutlined />}
                              size="small"
                              loading={deletingId === Number(article.id)}
                              onClick={() => handleArchiveClick(Number(article.id), !!article.is_deleted)}
                            />
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
                {!loadingArticles && articles.length === 0 && (
                  <Col span={24}>
                    <Alert message="No articles found" type="info" showIcon />
                  </Col>
                )}
              </Row>
            </Spin>
          )}
        </Card>
      </main>

      <Modal
        title={<Title level={3} className="!mb-0">Create An Article</Title>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          createForm.resetFields();
          setTitleContent('');
          setContentValue('');
          setSelectedTagsForCreate([]);
          setSubmitStatus('published');
        }}
        footer={null}
        width={900}
        style={{ maxHeight: '90vh', overflow: 'auto' }}
        getContainer={() => document.body}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            setCreatingArticle(true);
            try {
              const formData = new FormData();
              formData.append('title', titleContent);
              formData.append('content', contentValue);
              formData.append('status', submitStatus);
              formData.append('tags', JSON.stringify(selectedTagsForCreate));
              formData.append('category_id', values?.categoryId ? String(values.categoryId) : '');
              formData.append('image_url', imageUrl);
              // New: Add thumbnail from Cloudinary
              if (thumbnailUrl) {
                formData.append('thumbnail_url', thumbnailUrl);
              }

              const result = await createArticle(formData);
              if (result.success) {
                message.success(result.message || 'Article created successfully!');
                setIsModalOpen(false);
                createForm.resetFields();
                setTitleContent('');
                setContentValue('');
                setImageUrl('');
                setThumbnailUrl(''); // Reset thumbnail
                setSelectedTagsForCreate([]);
                setSubmitStatus('published');
                await refreshCurrentArticles(false);
              } else {
                message.error(result.message || 'Failed to create article');
              }
            } catch (error: any) {
              message.error(error?.message || 'An error occurred');
            } finally {
              setCreatingArticle(false);
            }
          }}
          validateTrigger="onBlur"
        >
          <Form.Item
            label={<Text strong className="text-xl">Title</Text>}
            name="title"
            rules={[
              { 
                required: true, 
                validator: (_, value) => {
                  const textContent = titleContent.replace(/<[^>]*>/g, '').trim();
                  if (!textContent) {
                    return Promise.reject('Please enter a title');
                  }
                  if (textContent.length > 150) {
                    return Promise.reject('Title must be less than 150 characters');
                  }
                  return Promise.resolve();
                }
              },
            ]}
          >
            <div
              ref={titleEditorRef}
              contentEditable
              onInput={() => {
                if (titleEditorRef.current) {
                  setTitleContent(titleEditorRef.current.innerText);
                }
              }}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain').replace(/\s+/g, ' ').trim();
                document.execCommand('insertText', false, text);
              }}
              className="border border-gray-300 rounded p-3 min-h-[60px] focus:outline-none focus:border-blue-500 text-lg font-medium"
              style={{ backgroundColor: 'white' }}
            />
          </Form.Item>

          <Flex justify="flex-end" align="center" className="mt-2 mb-4">
            <Text type="secondary" className="text-sm">
              {titleContent.replace(/<[^>]*>/g, '').trim().length} / 150
            </Text>
          </Flex>

          {/* New: Thumbnail Upload */}
          <Form.Item
            label={<Text strong className="text-base">Thumbnail Image</Text>}
            name="thumbnail"
          >
            <Flex vertical gap="middle">
              {thumbnailUrl && (
                <img 
                  src={thumbnailUrl} 
                  alt="Thumbnail preview" 
                  className="w-40 h-30 object-cover rounded-lg border"
                />
              )}
              <Upload
                maxCount={1}
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleThumbnailUpload(file);
                  return false;
                }}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploadingThumbnail}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? 'Uploading...' : 'Click to Upload Thumbnail'}
                </Button>
              </Upload>
            </Flex>
          </Form.Item>

          <Divider />

          <Form.Item
            label={<Text strong className="text-base">Content</Text>}
            name="content"
            rules={[
              { 
                required: true, 
                validator: (_, value) => {
                  const stripHtml = (html: string) => {
                    const tmp = document.createElement('DIV');
                    tmp.innerHTML = html;
                    return tmp.textContent || tmp.innerText || '';
                  }
                  const textContent = stripHtml(contentValue).trim();
                  if (!textContent) {
                    return Promise.reject('Please enter content');
                  }
                  if (textContent.length > 5000) {
                    return Promise.reject('Content must be less than 5000 characters');
                  }
                  return Promise.resolve();
                }
              },
            ]}
          >
            <QuillEditor
              value={contentValue}
              onChange={handleEditorChange}
              placeholder="Write your content here..."
              height={400}
            />
          </Form.Item>

          <Flex justify="flex-end" align="center" className="mt-2 mb-4">
            <Text type="secondary" className="text-sm">
              {contentValue.replace(/<[^>]*>/g, '').trim().length} / 5,000
            </Text>
          </Flex>

          <Divider />

          <Form.Item
            label={<Text strong className="text-base">Category</Text>}
            name="categoryId"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              size="large"
              placeholder="Select a category"
              loading={loadingCategories}
              options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
              optionFilterProp="label"
              showSearch
              allowClear
            />
          </Form.Item>

          <Divider />

          <Form.Item
            label={<Text strong className="text-base">Tags</Text>}
            name="tags"
          >
            <Select
              mode="tags"
              options={tags.map((tag) => ({ label: tag.name, value: tag.name }))}
              size="large"
              loading={loadingTags}
              placeholder="Type to search or add new tags"
              value={selectedTagsForCreate}
              onChange={setSelectedTagsForCreate}
              maxTagCount="responsive"
              showSearch
              tokenSeparators={[',']}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item className="!mb-0">
            <Flex justify="flex-end" gap="middle" className="pt-4">
              <Button
                size="large"
                icon={<SendOutlined />}
                onClick={() => setSubmitStatus('draft')}
                htmlType="submit"
                loading={creatingArticle}
              >
                Save Draft
              </Button>
              <Button
                size="large"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsModalOpen(false);
                  createForm.resetFields();
                  setTitleContent('');
                  setContentValue('');
                  setSelectedTagsForCreate([]);
                  setSubmitStatus('published');
                }}
                disabled={creatingArticle}
              >
                Cancel
              </Button>
              {isAdmin ? (
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => setSubmitStatus('published')}
                  loading={creatingArticle}
                >
                  Post
                </Button>
              ) : (
                <Tooltip title="Only Admin can publish. Your article will be pending for approval.">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={() => setSubmitStatus('pending')}
                    loading={creatingArticle}
                  >
                    Submit for Review
                  </Button>
                </Tooltip>
              )}
            </Flex>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Article"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          editForm.resetFields();
          setEditTitleContent('');
          setEditContentValue('');
          setEditSelectedTags([]);
          setEditingArticleId(null);
          setEditSubmitStatus('published');
        }}
        footer={null}
        width={900}
        style={{ maxHeight: '90vh', overflow: 'auto' }}
        getContainer={() => document.body}
      >
        <Spin spinning={loadingEditData} tip="Loading article...">
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
            validateTrigger="onBlur"
          >
            <Form.Item
              label={<Text strong className="text-xl">Title</Text>}
              name="title"
              rules={[
                { 
                  required: true, 
                  validator: (_, value) => {
                    const textContent = editTitleContent.replace(/<[^>]*>/g, '').trim();
                    if (!textContent) {
                      return Promise.reject('Please enter a title');
                    }
                    if (textContent.length > 150) {
                      return Promise.reject('Title must be less than 150 characters');
                    }
                    return Promise.resolve();
                  }
                },
              ]}
            >
              <div
                contentEditable
                onInput={() => {
                  const div = document.querySelector('[contentEditable]') as HTMLDivElement;
                  if (div) {
                    setEditTitleContent(div.innerText);
                  }
                }}
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text/plain').replace(/\s+/g, ' ').trim();
                  document.execCommand('insertText', false, text);
                }}
                className="border border-gray-300 rounded p-3 min-h-[60px] focus:outline-none focus:border-blue-500 text-lg font-medium"
                style={{ backgroundColor: 'white' }}
                suppressContentEditableWarning
              >
                {editTitleContent}
              </div>
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {editTitleContent.replace(/<[^>]*>/g, '').trim().length} / 150
              </Text>
            </Flex>

            {/* New: Edit Thumbnail Upload */}
            <Form.Item
              label={<Text strong className="text-base">Thumbnail Image</Text>}
              name="editThumbnail"
            >
              <Flex vertical gap="middle">
                {editThumbnailUrl && (
                  <img 
                    src={editThumbnailUrl} 
                    alt="Thumbnail preview" 
                    className="w-40 h-30 object-cover rounded-lg border"
                  />
                )}
                <Upload
                  maxCount={1}
                  accept="image/*"
                  beforeUpload={(file) => {
                    handleEditThumbnailUpload(file);
                    return false;
                  }}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploadingEditThumbnail}
                    disabled={uploadingEditThumbnail}
                  >
                    Click to Upload Thumbnail
                  </Button>
                </Upload>
              </Flex>
            </Form.Item>

            <Divider />

            <Form.Item
              label={<Text strong className="text-base">Content</Text>}
              name="content"
              rules={[
                { 
                  required: true, 
                  validator: (_, value) => {
                    const textContent = editContentValue.replace(/<[^>]*>/g, '').trim();
                    if (!textContent) {
                      return Promise.reject('Please enter content');
                    }
                    if (textContent.length > 5000) {
                      return Promise.reject('Content must be less than 5000 characters');
                    }
                    return Promise.resolve();
                  }
                },
              ]}
            >
              {loadingEditData ? (
                <Spin tip="Loading content..." style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              ) : (
                <QuillEditor
                  value={editContentValue}
                  onChange={handleEditEditorChange}
                  placeholder="Write your content here..."
                  height={400}
                />
              )}
            </Form.Item>

            <Flex justify="flex-end" align="center" className="mt-2 mb-4">
              <Text type="secondary" className="text-sm">
                {editContentValue.replace(/<[^>]*>/g, '').trim().length} / 5,000
              </Text>
            </Flex>

            <Divider />

            <Form.Item
              label={<Text strong className="text-base">Category</Text>}
              name="categoryId"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select
                size="large"
                placeholder="Select a category"
                loading={loadingCategories}
                options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
                optionFilterProp="label"
                showSearch
                allowClear
              />
            </Form.Item>

            <Divider />

            <Form.Item
              label={<Text strong className="text-base">Tags</Text>}
              name="tags"
            >
              <Select
                mode="tags"
                options={tags.map((tag) => ({ label: tag.name, value: tag.name }))}
                size="large"
                loading={loadingTags}
                placeholder="Type to search or add new tags"
                value={editSelectedTags}
                onChange={setEditSelectedTags}
                maxTagCount="responsive"
                showSearch
                tokenSeparators={[',']}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item className="!mb-0">
              <Flex justify="flex-end" gap="middle" className="pt-4">
                <Button
                  size="large"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    editForm.resetFields();
                    setEditTitleContent('');
                    setEditContentValue('');
                    setEditSelectedTags([]);
                    setEditingArticleId(null);
                    setEditSubmitStatus('published');
                  }}
                  disabled={editingArticle}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={() => setEditSubmitStatus('published')}
                  loading={editingArticle}
                >
                  Update
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

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
