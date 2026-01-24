'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, Typography, Divider, Avatar, Input, Button, Space, Spin, message, Empty, Modal, Dropdown } from 'antd';
import { UserOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { getArticleById } from '@/action/articles/articlesManagementAction';
import { getComments, createComment, updateComment, deleteComment } from '@/action/comments/commentsAction';
import type { Comment } from '@/service/comments.service';
import { getCloudinaryContentImageUrl, getCloudinaryThumbnailUrl } from '@/lib/cloudinary';
import MarkdownIt from 'markdown-it';
// @ts-ignore
import markdownItUnderline from 'markdown-it-underline';
import 'react-markdown-editor-lite/lib/index.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

mdParser.use(markdownItUnderline);

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [updatingComment, setUpdatingComment] = useState(false);

  const renderedContent = useMemo(() => {
    if (!article?.content) return '';
    return mdParser.render(article.content);
  }, [article?.content]);

  useEffect(() => {
    loadArticleAndComments();
  }, [articleId]);

  const loadArticleAndComments = async () => {
    setLoading(true);
    try {
      const [articleRes, commentsRes] = await Promise.all([
        getArticleById(parseInt(articleId)),
        getComments(parseInt(articleId)),
      ]);

      if ((articleRes as any).success && (articleRes as any).data) {
        setArticle((articleRes as any).data);
      }
      setComments(commentsRes || []);
    } catch (err: any) {
      console.error('Error loading article:', err);
      message.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('article_id', articleId);
      formData.append('content', commentText);

      const result = await createComment(formData);
      if (result.success) {
        message.success('Comment posted successfully');
        setCommentText('');
        await loadArticleAndComments();
      } else {
        message.error(result.message || 'Failed to post comment');
      }
    } catch (error: any) {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      message.warning('Comment cannot be empty');
      return;
    }

    setUpdatingComment(true);
    try {
      const formData = new FormData();
      formData.append('id', commentId);
      formData.append('content', editingCommentText);

      const result = await updateComment(formData);
      if (result.success) {
        message.success('Comment updated successfully');
        setEditingCommentId(null);
        setEditingCommentText('');
        await loadArticleAndComments();
      } else {
        message.error(result.message || 'Failed to update comment');
      }
    } catch (error: any) {
      message.error('An error occurred');
    } finally {
      setUpdatingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Modal.confirm({
      title: 'Delete Comment',
      content: 'Are you sure you want to delete this comment?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await deleteComment(parseInt(commentId));
          if (result.success) {
            message.success('Comment deleted successfully');
            await loadArticleAndComments();
          } else {
            message.error(result.message || 'Failed to delete comment');
          }
        } catch (error: any) {
          message.error('An error occurred');
        }
      },
    });
  };

  const handleApprove = () => {
    Modal.confirm({
      title: 'Approve article',
      content: 'Are you sure you want to publish this article?',
      okText: 'Approve',
      cancelText: 'Cancel',
      okButtonProps: { type: 'primary', loading: approving, icon: <CheckCircleOutlined /> },
      onOk: async () => {
        setApproving(true);
        try {
          const res = await fetch('/api/articles/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: parseInt(articleId) }),
          }).then((r) => r.json());
          if (res.success) {
            message.success(res.message || 'Article approved');
            await loadArticleAndComments();
          } else {
            message.error(res.message || 'Failed to approve');
          }
        } catch (err: any) {
          message.error(err?.message || 'Failed to approve');
        } finally {
          setApproving(false);
        }
      },
    });
  };

  const handleReject = () => {
    Modal.confirm({
      title: 'Reject article',
      content: 'Are you sure you want to reject this article?',
      okText: 'Reject',
      cancelText: 'Cancel',
      okButtonProps: { danger: true, loading: rejecting, icon: <CloseCircleOutlined /> },
      onOk: async () => {
        setRejecting(true);
        try {
          const res = await fetch('/api/articles/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: parseInt(articleId) }),
          }).then((r) => r.json());
          if (res.success) {
            message.success(res.message || 'Article rejected');
            await loadArticleAndComments();
          } else {
            message.error(res.message || 'Failed to reject');
          }
        } catch (err: any) {
          message.error(err?.message || 'Failed to reject');
        } finally {
          setRejecting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large">
          <div className="mt-4 text-gray-600">Loading article...</div>
        </Spin>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Empty description="Article not found" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Article Content */}
        <Card className="mb-6">
          {/* Date */}
          <Text type="secondary" className="block mb-4">
            📅 {new Date(article.created_at).toLocaleDateString('vi-VN')}
          </Text>

          {/* Title */}
          <Title level={2} className="!mb-6">
            {article.title}
          </Title>

          {/* Thumbnail Placeholder */}
          <div className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg overflow-hidden">
            <img
              src={
                article.thumbnail_url 
                  ? article.thumbnail_url 
                  : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop"
              }
              alt="Article thumbnail"
              className="w-full h-64 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop"
              }}
            />
          </div>

          {/* Content */}
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        </Card>

        {/* Author Info */}
        <Card className="mb-6">
          <div className="flex items-center space-x-4">
            <Avatar size={64} icon={<UserOutlined />} className="bg-blue-500" />
            <div>
              <Title level={5} className="!mb-1">
                {article.author_name || 'Nguyễn Văn A'}
              </Title>
              <Text type="secondary">Dream Jobs, Analyist</Text>
              <br />
              <Button type="link" size="small" className="!px-0">
                Follow
              </Button>
            </div>
          </div>
        </Card>

        {/* Approval Actions (for pending articles) */}
        {article.status === 'pending' && (
          <div className="mb-6 flex justify-center">
            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                icon={<CheckCircleOutlined />} 
                loading={approving}
                onClick={handleApprove}
              >
                Approve
              </Button>
              <Button 
                danger 
                size="large"
                icon={<CloseCircleOutlined />} 
                loading={rejecting}
                onClick={handleReject}
              >
                Reject
              </Button>
            </Space>
          </div>
        )}

        {/* Comments Section */}
        {article.status !== 'pending' && (
          <Card title={<Title level={4} className="!mb-0">Comments ({comments.length})</Title>}>
            {/* Comment Input */}
            <div className="mb-6">
              <div className="flex items-start space-x-3">
                <Avatar icon={<UserOutlined />} className="bg-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <TextArea
                    placeholder="Comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    className="mb-2"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSubmitComment}
                      loading={submitting}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Show 1 comment text */}
            {comments.length > 0 && (
              <Button type="link" className="!px-0 mb-4">
                Show {comments.length} comment{comments.length > 1 ? 's' : ''}
              </Button>
            )}

            {/* Comments List */}
            <Space direction="vertical" size="large" className="w-full">
              {comments.map((comment) => {
                const isEditing = editingCommentId === comment.id;
                const menuItems: MenuProps['items'] = [
                  {
                    key: 'edit',
                    label: 'Edit',
                    icon: <EditOutlined />,
                    onClick: () => handleEditComment(comment.id, comment.content),
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDeleteComment(comment.id),
                  },
                ];

                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar icon={<UserOutlined />} className="bg-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input.TextArea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            autoSize={{ minRows: 2, maxRows: 6 }}
                          />
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleUpdateComment(comment.id)}
                              loading={updatingComment}
                            >
                              Save
                            </Button>
                            <Button size="small" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                          </Space>
                        </div>
                      ) : (
                        <>
                          <div className="bg-gray-100 rounded-lg p-3 relative">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Text strong className="block mb-1">
                                  {comment.user_name || 'Anonymous User'}
                                </Text>
                                <Text>{comment.content}</Text>
                              </div>
                              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<MoreOutlined />}
                                  className="ml-2"
                                />
                              </Dropdown>
                            </div>
                          </div>
                          <Text type="secondary" className="text-xs mt-1 block">
                            {new Date(comment.created_at).toLocaleDateString('vi-VN')} at{' '}
                            {new Date(comment.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </Space>

            {comments.length === 0 && (
              <Empty description="No comments yet. Be the first to comment!" />
            )}
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-8 py-6 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <Text type="secondary">
              © 2025 - KMSPlus. Designed by <Text strong>KMS Team</Text>. All rights reserved
            </Text>
            <Space size="large">
              <a href="#" className="text-gray-600 hover:text-gray-900">FAQs</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms & Condition</a>
            </Space>
          </div>
        </footer>
      </div>
    </div>
  );
}
