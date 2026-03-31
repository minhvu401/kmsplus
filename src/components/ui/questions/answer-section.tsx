'use client'

import { useMemo, useState, useActionState, startTransition, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { Flex, Typography, Divider, Avatar, Dropdown, Button, Modal } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    EllipsisOutlined,
    LockOutlined,
    MessageOutlined,
    UserOutlined
} from '@ant-design/icons';
import { updateAnswer, deleteAnswer, createReply, State } from '@/action/question/questionActions';
import CreateAnswerForm from "@/components/forms/create-answer-form";
import { Answer, AnswerWithReplies } from "@/service/question.service";
import Pagination from "@/components/ui/questions/pagination";
import PageSizeSelector from "@/components/ui/questions/page-size-selector";
import { useSearchParams, useRouter } from 'next/navigation';
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
    const userId = 1; // TEMP: Replace with actual user ID
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('limit')) || 5;
    const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
    const totalItems = Number(answer_count) || 0;
    const totalPages = serverTotalPages || Math.max(1, Math.ceil(totalItems / pageSize));

    // For updating URL sort param
    const updateSort = (value: string) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set('sort', value);
        params.set('page', '1'); // Reset to first page on sort change
        window.history.replaceState(null, '', `?${params.toString()}`);
        // Optionally, trigger a reload if needed (if SSR fetches on navigation)
        window.location.reload();
    };

    const initialState: State = { message: null, errors: {} };
    const [updateState, updateAnswerAction] = useActionState(updateAnswer, initialState);

    // Editing State
    const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [editingCount, setEditingCount] = useState(0);

    // Reply State
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyCount, setReplyCount] = useState(0);

    // --- Actions ---

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
        });
        cancelReply();
    };

    const contentError = updateState?.errors?.content?.[0];

    // Props bundle to pass down easily
    const commentActions = {
        userId,
        is_closed,
        editingAnswerId,
        editingContent,
        editingCount,
        contentError,
        replyingToId,
        replyContent,
        replyCount,
        onBeginEdit: beginEdit,
        onCancelEdit: cancelEdit,
        onSaveEdit: handleSaveEdit,
        onSetEditingContent: (val: string) => {
            setEditingContent(val);
            const plainText = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            setEditingCount(plainText.length);
        },
        onBeginReply: beginReply,
        onCancelReply: cancelReply,
        onSubmitReply: handleSubmitReply,
        onSetReplyContent: (val: string) => {
            setReplyContent(val);
            const plainText = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            setReplyCount(plainText.length);
        },
    };

    return (
        <div className="w-full max-w-[980px] mx-auto px-2 md:px-3 mt-6" style={{ color: '#374151' }}>
            {/* Header Section */}
            <Flex vertical align="left" gap={10} style={{ marginBottom: 18 }}>
                <div className="flex items-center gap-3">
                    <Title level={4} style={{ color: "#111827", margin: 0 }}>
                        Answers ({answer_count})
                    </Title>
                    <Select
                        size="small"
                        value={sort}
                        style={{ width: 120 }}
                        onChange={updateSort}
                        options={[
                            { value: 'newest', label: 'Newest' },
                            { value: 'oldest', label: 'Oldest' },
                        ]}
                        aria-label="Sort answers"
                    />
                </div>
                <div className="w-full">
                    {is_closed ? (
                        <LockedAnswerBox message='This question is archived. No new comments can be posted.' />
                    ) : (
                        <CreateAnswerForm
                            userId={userId}
                            questionId={questionId}
                        />
                    )}
                </div>
            </Flex>

            <Divider style={{ margin: '0 0 14px 0' }} />

            {/* Comments Feed */}
            <div className="flex flex-col gap-2">
                {paginatedAnswers.length === 0 ? (
                    <div className="py-7 text-center text-gray-500">
                        No answers yet. Be the first to comment.
                    </div>
                ) : (
                    paginatedAnswers.map((answer) => (
                        <RedditComment
                            key={answer.id}
                            node={answer}
                            depth={0}
                            {...commentActions}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            {paginatedAnswers.length > 0 && (
                <div className="flex flex-col items-center gap-3 mt-6 pb-6">
                    <PageSizeSelector currentPageSize={pageSize} />
                    <Pagination totalPages={totalPages} />
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------------
// Core Recursive Component: Replicates Reddit's Tree Structure
// ------------------------------------------------------------------

interface RedditCommentProps {
    node: NestedAnswer;
    depth: number;
    userId: number;
    is_closed: boolean;
    editingAnswerId: number | null;
    editingContent: string;
    editingCount: number;
    contentError?: string;
    replyingToId: number | null;
    replyContent: string;
    replyCount: number;
    isModalContext?: boolean;
    onBeginEdit: (answer: Answer) => void;
    onCancelEdit: () => void;
    onSaveEdit: (id: number) => void;
    onSetEditingContent: (val: string) => void;
    onBeginReply: (id: number) => void;
    onCancelReply: () => void;
    onSubmitReply: (parentId: number) => void;
    onSetReplyContent: (val: string) => void;
}

function RedditComment(props: RedditCommentProps) {
    const {
        node, depth, userId, is_closed,
        editingAnswerId, replyingToId,
        onBeginReply
    } = props;

    const isEditing = editingAnswerId === node.id;
    const isReplying = replyingToId === node.id;
    const isOwner = Number(node.user_id) === userId;
    const hasChildren = node.replies && node.replies.length > 0;

    return (
        <div className={`flex items-start gap-3 ${depth > 0 ? 'pl-3 ml-3 mt-2 pt-1' : 'mt-1'}`}>
            <Avatar
                size={34}
                src={node.user_avatar || undefined}
                icon={!node.user_avatar ? <UserOutlined /> : undefined}
                className="bg-gray-300 flex-shrink-0"
            />

            <div className="flex-1 min-w-0 pb-1">
                    {/* Meta Header */}
                    <div className="flex items-center justify-between mb-0.5 text-xs text-gray-500 font-medium">
                        <span className="font-semibold text-gray-900">{node.user_name}</span>

                        {isOwner && !isEditing && (
                            <AnswerMenu
                                answer={node}
                                onEdit={() => props.onBeginEdit(node)}
                                isEditing={isEditing}
                            />
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="bg-gray-100 rounded-lg px-3 py-1.5 md:px-3.5 md:py-2">
                        {isEditing ? (
                            <div onClick={e => e.stopPropagation()} className="bg-white rounded-md p-2">
                                <EditBox {...props} node={node} />
                            </div>
                        ) : (
                            <div
                                className="prose prose-sm max-w-none text-gray-700 prose-p:my-1 prose-a:text-blue-600"
                                style={{ fontSize: 16, lineHeight: 1.6 }}
                                dangerouslySetInnerHTML={{ __html: node.content }}
                            />
                        )}
                    </div>

                    {/* Action Bar (Footer) */}
                    {!isEditing && (
                        <div className="flex items-center justify-between mt-0.5">
                            <Text type="secondary" className="text-xs">
                                {new Date(node.created_at).toLocaleString('vi-VN', {
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                    hour12: false,
                                })}
                            </Text>

                            {!is_closed && (
                                <ActionButton
                                    icon={<MessageOutlined />}
                                    text="Reply"
                                    onClick={() => onBeginReply(node.id)}
                                />
                            )}
                        </div>
                    )}

                    {/* Reply Input Box */}
                    {isReplying && (
                        <div className="mt-3 mb-1 ml-1 pl-3">
                            <ReplyBox {...props} node={node} />
                        </div>
                    )}

                    {/* Recursive Children Rendering */}
                    {hasChildren && (
                        <div className="flex flex-col mt-2 gap-1">
                            {node.replies!.map((child) => (
                                <RedditComment
                                    key={child.id}
                                    {...props}
                                    node={child}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Sub-Components for Cleanliness
// ------------------------------------------------------------------

function ActionButton({ icon, text, onClick, className = "" }: { icon: React.ReactNode, text: string, onClick?: () => void, className?: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors text-sm font-medium ${className}`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
}

function EditBox(props: RedditCommentProps) {
    const { editingContent, onSetEditingContent, editingCount, contentError, onCancelEdit, onSaveEdit, node } = props;
    return (
        <div className="w-full border border-gray-300 rounded bg-white mt-2">
            <RichTextEditor
                value={editingContent}
                onChange={onSetEditingContent}
                placeholder="Edit your comment..."
                size="compact"
            />
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-b border-t border-gray-200">
                <Text type={contentError ? 'danger' : 'secondary'} className="text-sm">
                    {contentError ? contentError : `${editingCount}/600`}
                </Text>
                <div className="flex gap-2">
                    <Button size="small" onClick={onCancelEdit}>Cancel</Button>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => onSaveEdit(node.id)}
                        disabled={editingCount < 1}
                        className="bg-blue-600"
                    >
                        Save Edits
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ReplyBox(props: RedditCommentProps) {
    const { replyContent, onSetReplyContent, replyCount, onCancelReply, onSubmitReply, node } = props;
    return (
        <div className="w-full max-w-2xl">
            <RichTextEditor
                value={replyContent}
                onChange={onSetReplyContent}
                placeholder={`Reply to ${node.user_name}...`}
                size="compact"
            />
            <div className="flex justify-between items-center mt-2">
                <Text type="secondary" className="text-sm">{replyCount}/600</Text>
                <div className="flex gap-2">
                    <Button size="small" onClick={onCancelReply}>Cancel</Button>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => onSubmitReply(node.id)}
                        disabled={replyCount < 1}
                        className="bg-blue-600 rounded-full px-4"
                    >
                        Reply
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function AnswerMenu({ answer, onEdit, isEditing }: { answer: Answer; onEdit: () => void; isEditing: boolean; }) {
    const [open, setOpen] = useState(false);
    const [isDeleteVisible, setDeleteVisible] = useState(false);

    const items = [
        {
            key: 'edit',
            label: <span onClick={() => { onEdit(); setOpen(false); }}><EditOutlined /> Edit</span>,
            disabled: isEditing,
        },
        {
            key: 'delete',
            label: <span onClick={() => { setDeleteVisible(true); setOpen(false); }} className="text-red-500"><DeleteOutlined /> Delete</span>,
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
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" open={open} onOpenChange={setOpen}>
                <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors text-sm font-medium">
                    <EllipsisOutlined className="text-lg" />
                </button>
            </Dropdown>

            <Modal
                title="Delete Comment"
                centered
                open={isDeleteVisible}
                onCancel={() => setDeleteVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteVisible(false)}>Cancel</Button>,
                    <Button key="delete" danger onClick={handleDelete}>Delete</Button>,
                ]}
            >
                <Text>Are you sure you want to delete this comment?</Text>
            </Modal>
        </>
    );
}

export function LockedAnswerBox({ message = 'Thread locked.' }: { message?: string }) {
    return (
        <div className="flex items-center justify-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded text-amber-700 font-medium">
            <LockOutlined />
            <span>{message}</span>
        </div>
    );
}