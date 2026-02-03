'use client'

import { useState, useActionState, startTransition } from 'react';
import { Flex, Typography, Divider, Card, Avatar, Dropdown, Button, Modal, Spin } from "antd";
import { EditOutlined, DeleteOutlined, EllipsisOutlined, LockOutlined, MessageOutlined, DownOutlined, UpOutlined, CommentOutlined } from '@ant-design/icons';
import { updateAnswer, deleteAnswer, createReply, fetchFullDiscussionThread, State } from '@/action/question/questionActions';
import CreateAnswerForm from "@/components/forms/create-answer-form";
import { Answer, AnswerWithReplies } from "@/service/question.service";
import Pagination from "@/components/ui/questions/pagination";
import PageSizeSelector from "@/components/ui/questions/page-size-selector";
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns/formatDistanceToNowStrict';
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Title, Text } = Typography;

// Type for nested reply structure
type NestedAnswer = Answer & { replies?: NestedAnswer[], reply_count?: number, has_deep_replies?: boolean };

export default function AnswerSection({
    questionId,
    answer_count,
    is_closed,
    answers,
    paginatedAnswers,
    totalPages: serverTotalPages,
}: {
    questionId: number,
    answer_count: number,
    is_closed: boolean,
    answers: Answer[],
    paginatedAnswers: AnswerWithReplies[],
    totalPages?: number,
}) {
    const userId = 1; // TEMP: Replace with actual user ID from session/context
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('limit')) || 5
    const totalItems = Number(answer_count) || 0
    const totalPages = serverTotalPages || Math.max(1, Math.ceil(totalItems / pageSize))

    const initialState: State = { message: null, errors: {} };
    const [updateState, updateAnswerAction] = useActionState(updateAnswer, initialState);

    const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [editingCount, setEditingCount] = useState(0);

    // Reply state
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyCount, setReplyCount] = useState(0);

    // Collapsed replies state
    const [collapsedReplies, setCollapsedReplies] = useState<Set<number>>(new Set());

    // Discussion modal state
    const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
    const [discussionThread, setDiscussionThread] = useState<AnswerWithReplies | null>(null);
    const [discussionLoading, setDiscussionLoading] = useState(false);
    const [discussionRootId, setDiscussionRootId] = useState<number | null>(null);
    const [modalCollapsedIds, setModalCollapsedIds] = useState<Set<number>>(new Set());

    const toggleModalCollapse = (id: number) => {
        setModalCollapsedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const beginEdit = (answer: Answer) => {
        const content = answer.content ?? '';
        setEditingAnswerId(answer.id);
        setEditingContent(content);
        const plainText = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        setEditingCount(plainText.length);
    };

    const cancelEdit = () => {
        setEditingAnswerId(null);
        setEditingContent('');
        setEditingCount(0);
    };

    const handleSaveEdit = (answerId: number) => {
        const formData = new FormData();
        formData.append('content', editingContent);
        formData.append('answer_id', answerId.toString());
        formData.append('question_id', questionId.toString());

        startTransition(() => {
            updateAnswerAction(formData);
        });
        cancelEdit();
    };

    const beginReply = (answerId: number) => {
        setReplyingToId(answerId);
        setReplyContent('');
        setReplyCount(0);
    };

    const cancelReply = () => {
        setReplyingToId(null);
        setReplyContent('');
        setReplyCount(0);
    };

    const handleSubmitReply = async (parentId: number) => {
        const formData = new FormData();
        formData.append('content', replyContent);
        formData.append('user_id', userId.toString());
        formData.append('question_id', questionId.toString());
        formData.append('parent_id', parentId.toString());
        
        startTransition(async () => {
            await createReply(formData);
            
            // If discussion modal is open, refresh the thread
            if (discussionModalOpen && discussionRootId) {
                try {
                    const updatedThread = await fetchFullDiscussionThread(discussionRootId);
                    setDiscussionThread(updatedThread);
                } catch (error) {
                    console.error('Failed to refresh discussion thread:', error);
                }
            }
        });
        cancelReply();
    };

    const toggleReplies = (answerId: number) => {
        setCollapsedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(answerId)) {
                newSet.delete(answerId);
            } else {
                newSet.add(answerId);
            }
            return newSet;
        });
    };

    const openDiscussionModal = async (answerId: number) => {
        setDiscussionModalOpen(true);
        setDiscussionLoading(true);
        setDiscussionRootId(answerId);
        try {
            const thread = await fetchFullDiscussionThread(answerId);
            setDiscussionThread(thread);
        } catch (error) {
            console.error('Failed to fetch discussion thread:', error);
        } finally {
            setDiscussionLoading(false);
        }
    };

    const closeDiscussionModal = () => {
        setDiscussionModalOpen(false);
        setDiscussionThread(null);
        setDiscussionRootId(null);
        setModalCollapsedIds(new Set());
    };

    const contentError = updateState?.errors?.content?.[0];

    return (
        <>
            <Flex vertical align="left" gap={12} style={{ marginTop: 6 }}>
                {/* Title */}
                <Flex
                    align="flex-start"
                    justify="space-between"
                    style={{ position: "relative", width: "100%", marginBottom: 4, marginLeft: 30 }}
                >
                    <Title level={4} style={{ color: "black", textAlign: "left", margin: 0 }}>
                        Answers ({answer_count})
                    </Title>
                </Flex>

                {/* Create Answer Form */}
                <Flex
                    align="center"
                    justify="center"
                    style={{ position: "relative", width: "100%", marginBottom: 4 }}
                >
                    {is_closed ? (
                        <LockedAnswerBox message='This question is closed. No new answers can be submitted.' />
                    ) : (
                        <CreateAnswerForm
                            userId={userId}
                            questionId={questionId}
                        />
                    )}
                </Flex>

                {/* Answer Section & Pagination */}
                <Flex vertical gap={8}>
                    {paginatedAnswers.length === 0 && (
                        <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                            No answers yet. Be the first to answer!
                        </Text>
                    )}

                    {paginatedAnswers.map((answer) => (
                        <AnswerThread
                            key={answer.id}
                            answer={answer}
                            userId={userId}
                            questionId={questionId}
                            is_closed={is_closed}
                            editingAnswerId={editingAnswerId}
                            editingContent={editingContent}
                            editingCount={editingCount}
                            contentError={contentError}
                            replyingToId={replyingToId}
                            replyContent={replyContent}
                            replyCount={replyCount}
                            collapsedReplies={collapsedReplies}
                            onBeginEdit={beginEdit}
                            onCancelEdit={cancelEdit}
                            onSaveEdit={handleSaveEdit}
                            onSetEditingContent={(val) => {
                                setEditingContent(val);
                                const plainText = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                                setEditingCount(plainText.length);
                            }}
                            onBeginReply={beginReply}
                            onCancelReply={cancelReply}
                            onSubmitReply={handleSubmitReply}
                            onSetReplyContent={(val) => {
                                setReplyContent(val);
                                const plainText = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                                setReplyCount(plainText.length);
                            }}
                            onToggleReplies={toggleReplies}
                            onViewDiscussion={openDiscussionModal}
                            depth={0}
                            maxDepth={4}
                        />
                    ))}

                    <Flex className="flex justify-end my-6">
                        <PageSizeSelector currentPageSize={pageSize} />
                    </Flex>

                    <Flex className="flex justify-center mt-8">
                        <Pagination totalPages={totalPages} />
                    </Flex>

                    <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
                        Showing {paginatedAnswers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} answers
                    </Flex>
                </Flex>
            </Flex>

            {/* Discussion Modal */}
            <Modal
                title={
                    <Flex align="center" gap={8}>
                        <CommentOutlined />
                        <span>Full Discussion Thread</span>
                    </Flex>
                }
                open={discussionModalOpen}
                onCancel={closeDiscussionModal}
                footer={null}
                width={800}
                styles={{
                    body: {
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        padding: '16px 24px',
                    }
                }}
            >
                {discussionLoading ? (
                    <Flex justify="center" align="center" style={{ padding: 40 }}>
                        <Spin size="large" />
                    </Flex>
                ) : discussionThread ? (
                    <DiscussionThreadView
                        thread={discussionThread}
                        userId={userId}
                        questionId={questionId}
                        is_closed={is_closed}
                        onBeginReply={beginReply}
                        onCancelReply={cancelReply}
                        onSubmitReply={handleSubmitReply}
                        replyingToId={replyingToId}
                        replyContent={replyContent}
                        replyCount={replyCount}
                        onSetReplyContent={(val) => {
                            setReplyContent(val);
                            const plainText = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                            setReplyCount(plainText.length);
                        }}
                        collapsedIds={modalCollapsedIds}
                        onToggleCollapse={toggleModalCollapse}
                    />
                ) : (
                    <Text type="secondary">Failed to load discussion thread.</Text>
                )}
            </Modal>
        </>
    );
}

// Reddit-style threaded answer component
function AnswerThread({
    answer,
    userId,
    questionId,
    is_closed,
    editingAnswerId,
    editingContent,
    editingCount,
    contentError,
    replyingToId,
    replyContent,
    replyCount,
    collapsedReplies,
    onBeginEdit,
    onCancelEdit,
    onSaveEdit,
    onSetEditingContent,
    onBeginReply,
    onCancelReply,
    onSubmitReply,
    onSetReplyContent,
    onToggleReplies,
    onViewDiscussion,
    depth = 0,
    maxDepth = 2,
}: {
    answer: NestedAnswer;
    userId: number;
    questionId: number;
    is_closed: boolean;
    editingAnswerId: number | null;
    editingContent: string;
    editingCount: number;
    contentError?: string;
    replyingToId: number | null;
    replyContent: string;
    replyCount: number;
    collapsedReplies: Set<number>;
    onBeginEdit: (answer: Answer) => void;
    onCancelEdit: () => void;
    onSaveEdit: (answerId: number) => void;
    onSetEditingContent: (val: string) => void;
    onBeginReply: (answerId: number) => void;
    onCancelReply: () => void;
    onSubmitReply: (parentId: number) => void;
    onSetReplyContent: (val: string) => void;
    onToggleReplies: (answerId: number) => void;
    onViewDiscussion: (answerId: number) => void;
    depth?: number;
    maxDepth?: number;
}) {
    const isEditing = editingAnswerId === answer.id;
    const isReplying = replyingToId === answer.id;
    const replies = answer.replies || [];
    const hasReplies = replies.length > 0;
    const isCollapsed = collapsedReplies.has(answer.id);
    const isReply = depth > 0;
    const atMaxDepth = depth >= maxDepth;
    const isTopLevel = depth === 0;
    const hasDeepReplies = answer.has_deep_replies || false;

    // Thread line colors for different depths
    const threadColors = ['#0079d3', '#ff4500', '#00a86b', '#9b59b6', '#ff66ac'];
    const threadColor = threadColors[depth % threadColors.length];

    return (
        <Flex vertical style={{ width: '100%' }}>
            {/* Main answer card */}
            <Flex style={{ width: '100%' }}>
                {/* Reddit-style thread line - shown for all levels */}
                <Flex
                    align="stretch"
                    style={{
                        width: 24,
                        flexShrink: 0,
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: 11,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            backgroundColor: threadColor,
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onClick={() => onToggleReplies(answer.id)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                            e.currentTarget.style.width = '5px';
                            e.currentTarget.style.left = '10px';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.width = '3px';
                            e.currentTarget.style.left = '11px';
                        }}
                    />
                </Flex>

                <Card
                    style={{
                        flex: 1,
                        backgroundColor: isReply ? '#fafafa' : '#fff',
                        border: 'none',
                        boxShadow: 'none',
                    }}
                    styles={{
                        body: {
                            padding: isReply ? "12px 14px" : "16px 16px",
                        },
                    }}
                >
                    {/* Header */}
                    <Flex justify="space-between" align="center">
                        <Flex align="center" gap={8}>
                            <Avatar size={isReply ? 28 : 32}>
                                {answer.user_name.charAt(0).toUpperCase()}
                            </Avatar>

                            <Text strong style={{ fontSize: isReply ? 13 : 14 }}>
                                {answer.user_name}
                            </Text>

                            <Text type="secondary" style={{ fontSize: isReply ? 12 : 13 }}>
                                {formatDistanceToNowStrict(new Date(answer.created_at), {
                                    addSuffix: true,
                                })}
                            </Text>

                            {isReply && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    (reply)
                                </Text>
                            )}
                        </Flex>

                        <Flex
                            style={{
                                opacity: Number(answer.user_id) === userId ? 1 : 0.3,
                                pointerEvents: Number(answer.user_id) === userId ? 'auto' : 'none',
                            }}
                        >
                            <AnswerMenu
                                answer={answer}
                                onEdit={() => onBeginEdit(answer)}
                                isEditing={isEditing}
                            />
                        </Flex>
                    </Flex>

                    <Divider style={{ margin: "1px 0" }} />

                    {/* Answer content / inline editor */}
                    <Flex style={{ marginLeft: isReply ? 36 : 40 }}>
                        {isEditing ? (
                            <Flex vertical style={{ width: '100%' }} gap={8}>
                                <RichTextEditor
                                    value={editingContent}
                                    onChange={onSetEditingContent}
                                    placeholder="Enter your answer here..."
                                />
                                <Flex justify="space-between" align="center">
                                    <Text type={contentError ? 'danger' : 'secondary'}>
                                        {contentError ? contentError : `Character limit ${editingCount} / 600`}
                                    </Text>

                                    <Flex gap={8}>
                                        <Button onClick={onCancelEdit}>Cancel</Button>
                                        <Button
                                            type="primary"
                                            onClick={() => onSaveEdit(answer.id)}
                                            disabled={editingCount < 15}
                                        >
                                            Save
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Flex>
                        ) : (
                            <div
                                className="prose prose-sm max-w-none"
                                style={{
                                    marginBottom: 0,
                                    fontSize: isReply ? 14 : 15,
                                    wordBreak: 'break-word',
                                    lineHeight: 1.6,
                                }}
                                dangerouslySetInnerHTML={{ __html: answer.content }}
                            />
                        )}
                    </Flex>

                    {/* Action buttons */}
                    {!isEditing && (
                        <Flex style={{ marginLeft: isReply ? 36 : 40, marginTop: 8 }} gap={16}>
                            {/* Reply button */}
                            {!is_closed && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MessageOutlined />}
                                    onClick={() => onBeginReply(answer.id)}
                                    style={{
                                        color: '#787c7e',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        padding: '4px 8px',
                                    }}
                                >
                                    Reply
                                </Button>
                            )}

                            {/* Toggle replies button */}
                            {hasReplies && !atMaxDepth && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
                                    onClick={() => onToggleReplies(answer.id)}
                                    style={{
                                        color: '#787c7e',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        padding: '4px 8px',
                                    }}
                                >
                                    {isCollapsed ? `Show ${replies.length} replies` : `Hide replies`}
                                </Button>
                            )}

                            {/* View discussion button - show on top-level answers with deep replies */}
                            {isTopLevel && hasDeepReplies && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CommentOutlined />}
                                    onClick={() => onViewDiscussion(answer.id)}
                                    style={{
                                        color: '#0079d3',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        padding: '4px 8px',
                                    }}
                                >
                                    View full discussion
                                </Button>
                            )}
                        </Flex>
                    )}

                    {/* Inline reply form */}
                    {isReplying && (
                        <Flex vertical style={{ marginLeft: isReply ? 36 : 40, marginTop: 12 }} gap={8}>
                            <RichTextEditor
                                value={replyContent}
                                onChange={onSetReplyContent}
                                placeholder={`Reply to ${answer.user_name}...`}
                            />
                            <Flex justify="space-between" align="center">
                                <Text type="secondary">
                                    {`Character limit ${replyCount} / 600`}
                                </Text>
                                <Flex gap={8}>
                                    <Button onClick={onCancelReply}>Cancel</Button>
                                    <Button
                                        type="primary"
                                        onClick={() => onSubmitReply(answer.id)}
                                        disabled={replyCount < 15}
                                    >
                                        Reply
                                    </Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    )}
                </Card>
            </Flex>

            {/* Nested replies - only show up to maxDepth */}
            {hasReplies && !isCollapsed && !atMaxDepth && (
                <Flex vertical gap={4} style={{ marginLeft: 24, marginTop: 4 }}>
                    {replies.map((reply) => (
                        <AnswerThread
                            key={reply.id}
                            answer={reply}
                            userId={userId}
                            questionId={questionId}
                            is_closed={is_closed}
                            editingAnswerId={editingAnswerId}
                            editingContent={editingContent}
                            editingCount={editingCount}
                            contentError={contentError}
                            replyingToId={replyingToId}
                            replyContent={replyContent}
                            replyCount={replyCount}
                            collapsedReplies={collapsedReplies}
                            onBeginEdit={onBeginEdit}
                            onCancelEdit={onCancelEdit}
                            onSaveEdit={onSaveEdit}
                            onSetEditingContent={onSetEditingContent}
                            onBeginReply={onBeginReply}
                            onCancelReply={onCancelReply}
                            onSubmitReply={onSubmitReply}
                            onSetReplyContent={onSetReplyContent}
                            onToggleReplies={onToggleReplies}
                            onViewDiscussion={onViewDiscussion}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    );
}

// Discussion thread view for modal (shows full depth)
function DiscussionThreadView({
    thread,
    userId,
    questionId,
    is_closed,
    onBeginReply,
    onCancelReply,
    onSubmitReply,
    replyingToId,
    replyContent,
    replyCount,
    onSetReplyContent,
    collapsedIds,
    onToggleCollapse,
    depth = 0,
}: {
    thread: NestedAnswer;
    userId: number;
    questionId: number;
    is_closed: boolean;
    onBeginReply: (answerId: number) => void;
    onCancelReply: () => void;
    onSubmitReply: (parentId: number) => void;
    replyingToId: number | null;
    replyContent: string;
    replyCount: number;
    onSetReplyContent: (val: string) => void;
    collapsedIds: Set<number>;
    onToggleCollapse: (id: number) => void;
    depth?: number;
}) {
    const isReplying = replyingToId === thread.id;
    const replies = thread.replies || [];
    const hasReplies = replies.length > 0;
    const isCollapsed = collapsedIds.has(thread.id);

    // Thread line colors for different depths
    const threadColors = ['#0079d3', '#ff4500', '#00a86b', '#9b59b6', '#ff66ac'];
    const threadColor = threadColors[depth % threadColors.length];

    return (
        <Flex vertical style={{ width: '100%' }}>
            <Flex style={{ width: '100%' }}>
                {/* Thread line for all levels */}
                <Flex
                    align="stretch"
                    style={{
                        width: 20,
                        flexShrink: 0,
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: 9,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            backgroundColor: threadColor,
                            borderRadius: 2,
                            cursor: hasReplies ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                        }}
                        onClick={() => hasReplies && onToggleCollapse(thread.id)}
                        onMouseEnter={(e) => {
                            if (hasReplies) {
                                e.currentTarget.style.opacity = '0.7';
                                e.currentTarget.style.width = '5px';
                                e.currentTarget.style.left = '8px';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.width = '3px';
                            e.currentTarget.style.left = '9px';
                        }}
                        title={hasReplies ? (isCollapsed ? 'Show replies' : 'Hide replies') : undefined}
                    />
                </Flex>

                <Card
                    style={{
                        flex: 1,
                        backgroundColor: depth > 0 ? '#fafafa' : '#fff',
                        border: 'none',
                        boxShadow: 'none',
                        marginBottom: 8,
                    }}
                    styles={{
                        body: {
                            padding: depth > 0 ? "10px 12px" : "14px 16px",
                        },
                    }}
                >
                    {/* Header */}
                    <Flex align="center" gap={8}>
                        <Avatar size={depth > 0 ? 24 : 28}>
                            {thread.user_name.charAt(0).toUpperCase()}
                        </Avatar>

                        <Text strong style={{ fontSize: depth > 0 ? 12 : 13 }}>
                            {thread.user_name}
                        </Text>

                        <Text type="secondary" style={{ fontSize: depth > 0 ? 11 : 12 }}>
                            {formatDistanceToNowStrict(new Date(thread.created_at), {
                                addSuffix: true,
                            })}
                        </Text>
                    </Flex>

                    <Divider style={{ margin: "1px 0" }} />

                    {/* Content */}
                    <div
                        className="prose prose-sm max-w-none"
                        style={{
                            marginLeft: depth > 0 ? 32 : 36,
                            marginBottom: 0,
                            fontSize: depth > 0 ? 13 : 14,
                            wordBreak: 'break-word',
                            lineHeight: 1.5,
                        }}
                        dangerouslySetInnerHTML={{ __html: thread.content }}
                    />

                    {/* Reply button and toggle replies */}
                    <Flex style={{ marginLeft: depth > 0 ? 32 : 36, marginTop: 8 }} gap={4}>
                        {!is_closed && (
                            <Button
                                type="text"
                                size="small"
                                icon={<MessageOutlined />}
                                onClick={() => onBeginReply(thread.id)}
                                style={{
                                    color: '#787c7e',
                                    fontWeight: 600,
                                    fontSize: 11,
                                    padding: '2px 6px',
                                }}
                            >
                                Reply
                            </Button>
                        )}
                        {hasReplies && (
                            <Button
                                type="text"
                                size="small"
                                icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
                                onClick={() => onToggleCollapse(thread.id)}
                                style={{
                                    color: '#787c7e',
                                    fontWeight: 600,
                                    fontSize: 11,
                                    padding: '2px 6px',
                                }}
                            >
                                {isCollapsed ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Hide replies'}
                            </Button>
                        )}
                    </Flex>

                    {/* Inline reply form */}
                    {isReplying && (
                        <Flex vertical style={{ marginLeft: depth > 0 ? 32 : 36, marginTop: 10 }} gap={6}>
                            <RichTextEditor
                                value={replyContent}
                                onChange={onSetReplyContent}
                                placeholder={`Reply to ${thread.user_name}...`}
                            />
                            <Flex justify="space-between" align="center">
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {`${replyCount} / 600`}
                                </Text>
                                <Flex gap={6}>
                                    <Button size="small" onClick={onCancelReply}>Cancel</Button>
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => onSubmitReply(thread.id)}
                                        disabled={replyCount < 15}
                                    >
                                        Reply
                                    </Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    )}
                </Card>
            </Flex>

            {/* Nested replies */}
            {hasReplies && !isCollapsed && (
                <Flex vertical style={{ marginLeft: 20 }}>
                    {replies.map((reply) => (
                        <DiscussionThreadView
                            key={reply.id}
                            thread={reply}
                            userId={userId}
                            questionId={questionId}
                            is_closed={is_closed}
                            onBeginReply={onBeginReply}
                            onCancelReply={onCancelReply}
                            onSubmitReply={onSubmitReply}
                            replyingToId={replyingToId}
                            replyContent={replyContent}
                            replyCount={replyCount}
                            onSetReplyContent={onSetReplyContent}
                            collapsedIds={collapsedIds}
                            onToggleCollapse={onToggleCollapse}
                            depth={depth + 1}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    );
}

export function AnswerMenu({
    answer,
    onEdit,
    isEditing,
}: {
    answer: Answer;
    onEdit: () => void;
    isEditing: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [isDeleteVisible, setDeleteVisible] = useState(false);

    const items = [
        {
            key: 'edit',
            label: (
                <span
                    onClick={() => {
                        onEdit();
                        setOpen(false);
                    }}
                >
                    <EditOutlined /> Edit answer
                </span>
            ),
            disabled: isEditing,
        },
        {
            key: 'delete',
            label: (
                <span
                    onClick={() => {
                        setDeleteVisible(true);
                        setOpen(false);
                    }}
                >
                    <DeleteOutlined /> Delete answer
                </span>
            ),
        },
    ];

    const handleDelete = () => {
        setDeleteVisible(false);

        startTransition(() => {
            deleteAnswer(answer.id, answer.question_id);
        });
    };

    return (
        <>
            <Dropdown
                menu={{ items }}
                trigger={['click']}
                placement="bottomRight"
                open={open}
                onOpenChange={setOpen}
            >
                <Button
                    type="text"
                    icon={<EllipsisOutlined style={{ fontSize: 20 }} />}
                />
            </Dropdown>

            <Modal
                title="Confirmation"
                centered
                open={isDeleteVisible}
                onCancel={() => setDeleteVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="delete" danger onClick={handleDelete}>
                        Confirm
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to delete this answer?</Text>
                <br />
                <Text type="secondary">Your answer will be permanently deleted.</Text>
            </Modal>

        </>
    );
}

export function LockedAnswerBox({
  message = 'This question is closed. No new answers can be submitted.',
  onClick,
}: {
  message?: string;
  onClick?: () => void;
}) {
  return (
    <Flex
      align="center"
      gap={8}
      onClick={onClick}
      style={{
        minHeight: 140,
        minWidth: 1100,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        padding: '8px 12px',
        backgroundColor: '#fafafa',
        cursor: onClick ? 'pointer' : 'not-allowed',
        color: '#999',
        textAlign: 'center',
        justifyContent: 'center',
      }}
    >
      <LockOutlined />
      <Text type="secondary">{message}</Text>
    </Flex>
  );
}