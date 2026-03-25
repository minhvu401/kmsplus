'use client'

import { useMemo, useState, useActionState, startTransition } from 'react';
import { Flex, Typography, Divider, Avatar, Dropdown, Button, Modal, Spin } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    EllipsisOutlined,
    LockOutlined,
    MessageOutlined,
    CommentOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    PlusSquareOutlined,
    MinusSquareOutlined,
    UserOutlined
} from '@ant-design/icons';
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
    const userId = 1; // TEMP: Replace with actual user ID
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('limit')) || 5
    const totalItems = Number(answer_count) || 0
    const totalPages = serverTotalPages || Math.max(1, Math.ceil(totalItems / pageSize))

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

    // Discussion Modal State
    const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
    const [discussionThread, setDiscussionThread] = useState<AnswerWithReplies | null>(null);
    const [discussionLoading, setDiscussionLoading] = useState(false);
    const [discussionRootId, setDiscussionRootId] = useState<number | null>(null);

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
        onViewDiscussion: openDiscussionModal,
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4" style={{ color: '#374151' }}>
            {/* Header Section */}
            <Flex vertical align="left" gap={12} style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: "#111827", margin: 0 }}>
                    {answer_count} Answers
                </Title>

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

            {/* Comments Feed */}
            <div className="flex flex-col gap-4">
                {paginatedAnswers.length === 0 && (
                    <div className="py-10 text-center text-gray-500">
                        No answers yet. Be the first to share your thoughts!
                    </div>
                )}

                {paginatedAnswers.map((answer) => (
                    <RedditComment
                        key={answer.id}
                        node={answer}
                        depth={0}
                        {...commentActions}
                    />
                ))}
            </div>

            {/* Pagination */}
            {paginatedAnswers.length > 0 && (
                <div className="flex flex-col items-center gap-4 mt-8 pb-8">
                    <PageSizeSelector currentPageSize={pageSize} />
                    <Pagination totalPages={totalPages} />
                </div>
            )}

            {/* Full Thread Modal */}
            <Modal
                title={<Text style={{ color: '#374151', fontWeight: 600 }}>Single Discussion Thread</Text>}
                open={discussionModalOpen}
                onCancel={closeDiscussionModal}
                footer={null}
                width={800}
                className="reddit-modal"
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '16px 0' } }}
            >
                {discussionLoading ? (
                    <div className="flex items-center justify-center min-h-[240px] animate-fadeIn">
                        <Spin size="large" />
                    </div>
                ) : discussionThread ? (
                    <div className="px-4">
                        <RedditComment
                            node={discussionThread}
                            depth={0}
                            isModalContext={true}
                            {...commentActions}
                        />
                    </div>
                ) : (
                    <Text type="secondary">Failed to load thread.</Text>
                )}
            </Modal>
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
    onViewDiscussion: (id: number) => void;
}

function RedditComment(props: RedditCommentProps) {
    const {
        node, depth, userId, is_closed,
        editingAnswerId, replyingToId,
        onBeginReply, onViewDiscussion
    } = props;

    const [collapsed, setCollapsed] = useState(false);

    const isEditing = editingAnswerId === node.id;
    const isReplying = replyingToId === node.id;
    const isOwner = Number(node.user_id) === userId;
    const hasChildren = node.replies && node.replies.length > 0;

    // Reddit indent logic: First level has no line, children have lines
    // We strictly manage indentation via padding-left on the container

    const handleCollapse = () => setCollapsed(!collapsed);

    if (collapsed) {
        return (
            <div className="py-2 pl-2">
                <div className="flex items-center gap-2 cursor-pointer text-gray-600 hover:bg-gray-100 p-1 rounded w-fit" onClick={handleCollapse}>
                    <PlusSquareOutlined />
                    <span className="text-sm font-semibold text-gray-700">{node.user_name}</span>
                    <span className="text-sm text-gray-600">
                        {formatDistanceToNowStrict(new Date(node.created_at))} ago
                    </span>
                    <span className="text-sm text-gray-600">
                        {(() => {
                            const replyCount = (node.replies?.length || 0) + 1;
                            return `(${replyCount} ${replyCount === 1 ? 'reply' : 'replies'})`;
                        })()}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative flex flex-col ${depth > 0 ? 'mt-3' : 'mt-4'}`}>
            <div className="flex flex-row">
                {/* Left Column: Avatar + Thread Line */}
                <div className="flex flex-col items-center mr-2 md:mr-3 flex-shrink-0">
                    <Avatar
                        size={28}
                        src={node.user_avatar || undefined}
                        icon={!node.user_avatar ? <UserOutlined /> : undefined}
                        className="mb-2 cursor-pointer hover:opacity-80 transition-opacity bg-slate-300"
                    />

                    {/* The Thread Line: Clickable to collapse */}
                    <div
                        className="group w-4 h-full flex justify-center cursor-pointer"
                        onClick={handleCollapse}
                    >
                        <div className="w-[2px] h-full bg-gray-200 group-hover:bg-blue-400 transition-colors rounded-sm"></div>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="flex-1 min-w-0 pb-2">
                    {/* Meta Header */}
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-600 font-medium">
                        <span className="font-semibold text-gray-900 hover:underline cursor-pointer">
                            {node.user_name}
                        </span>
                        <span>•</span>
                        <span>{formatDistanceToNowStrict(new Date(node.created_at))} ago</span>
                    </div>

                    {/* Content Body */}
                    <div className="pr-4">
                        {isEditing ? (
                            <div onClick={e => e.stopPropagation()}>
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
                        <div className="flex items-center gap-1 mt-2 select-none">
                            {/* Vote Buttons (Visual only based on prompt) */}
                            {/* <div className="flex items-center gap-1 mr-4 bg-gray-50 rounded p-0.5">
                                <Button type="text" size="small" icon={<ArrowUpOutlined className="text-gray-500" />} className="!px-1 !h-6" />
                                <span className="text-xs font-bold text-gray-600">vote</span>
                                <Button type="text" size="small" icon={<ArrowDownOutlined className="text-gray-500" />} className="!px-1 !h-6" />
                            </div> */}

                            {!is_closed && (
                                <ActionButton
                                    icon={<MessageOutlined />}
                                    text="Reply"
                                    onClick={() => onBeginReply(node.id)}
                                />
                            )}

                            {/* Logic for "View Full Discussion" vs "Show Replies" */}
                            {node.has_deep_replies && !props.isModalContext && (
                                <ActionButton
                                    icon={<CommentOutlined />}
                                    text="Continue Thread"
                                    onClick={() => onViewDiscussion(node.id)}
                                    className="text-blue-600 hover:bg-blue-50"
                                />
                            )}

                            {isOwner && (
                                <AnswerMenu
                                    answer={node}
                                    onEdit={() => props.onBeginEdit(node)}
                                    isEditing={isEditing}
                                />
                            )}
                        </div>
                    )}

                    {/* Reply Input Box */}
                    {isReplying && (
                        <div className="mt-4 mb-2 ml-1 border-l-2 border-gray-300 pl-4">
                            <ReplyBox {...props} node={node} />
                        </div>
                    )}

                    {/* Recursive Children Rendering */}
                    {hasChildren && (
                        <div className="flex flex-col">
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