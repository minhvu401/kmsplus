'use client'

import { useState, useActionState, startTransition } from 'react';
import { Flex, Typography, Divider, Card, Avatar, Dropdown, Button, Modal, Input } from "antd";
import { EditOutlined, DeleteOutlined, EllipsisOutlined, LockOutlined } from '@ant-design/icons';
import { updateAnswer, deleteAnswer, State } from '@/action/question/questionActions';
import CreateAnswerForm from "@/components/forms/create-answer-form";
import { Answer } from "@/service/question.service";
import Pagination from "@/components/ui/questions/pagination";
import PageSizeSelector from "@/components/ui/questions/page-size-selector";
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns/formatDistanceToNowStrict';

const { Title, Text, Paragraph } = Typography;

export default function AnswerSection({
    questionId,
    answer_count,
    is_closed,
    answers,
    paginatedAnswers
}: {
    questionId: number,
    answer_count: number,
    is_closed: boolean,
    answers: Answer[],
    paginatedAnswers: Answer[],
}) {
    const userId = 1; // TEMP: Replace with actual user ID from session/context
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('limit')) || 5
    const totalItems = Number(answer_count) || 0
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    const initialState: State = { message: null, errors: {} };
    const [updateState, updateAnswerAction] = useActionState(updateAnswer, initialState);

    const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [editingCount, setEditingCount] = useState(0);

    const beginEdit = (answer: Answer) => {
        const content = answer.content ?? '';
        setEditingAnswerId(answer.id);
        setEditingContent(content);
        setEditingCount(content.length);
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
    };

    const contentError = updateState?.errors?.content?.[0];

    return (
        <>
            <Flex vertical align="left" gap={12} style={{ marginTop: 6 }}>
                {/* Title and Sort Filter */}
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

                    {paginatedAnswers.map((answer) => {
                        const isEditing = editingAnswerId === answer.id;
                        return (
                            <Card
                                key={answer.id}
                                style={{ width: "100%" }}
                                styles={{
                                    body: {
                                        padding: "16px 16px",
                                    },
                                }}
                            >
                                {/* Header */}
                                <Flex justify="space-between" align="center">
                                    <Flex align="center" gap={8}>
                                        <Avatar>
                                            {answer.user_name.charAt(0).toUpperCase()}
                                        </Avatar>

                                        <Text strong>
                                            {answer.user_name}
                                        </Text>

                                        <Text type="secondary">
                                            {formatDistanceToNowStrict(new Date(answer.created_at), {
                                                addSuffix: true,
                                            })}
                                        </Text>
                                    </Flex>

                                    <Flex
                                        style={{
                                            opacity: Number(answer.user_id) === userId ? 1 : 0.3,
                                            pointerEvents: Number(answer.user_id) === userId ? 'auto' : 'none',
                                        }}
                                    >
                                        <AnswerMenu
                                            answer={answer}
                                            onEdit={() => beginEdit(answer)}
                                            isEditing={isEditing}
                                        />
                                    </Flex>
                                </Flex>

                                <Divider style={{ margin: "6px 0" }} />

                                {/* Answer content / inline editor */}
                                <Flex style={{ marginLeft: 40 }}>
                                    {isEditing ? (
                                        <Flex vertical style={{ width: '100%' }} gap={8}>
                                            <Input.TextArea
                                                rows={4}
                                                value={editingContent}
                                                placeholder="Enter your answer here..."
                                                maxLength={600}
                                                onChange={(e) => {
                                                    setEditingContent(e.target.value);
                                                    setEditingCount(e.target.value.length);
                                                }}
                                                style={{ resize: 'none' }}
                                                status={contentError ? 'error' : ''}
                                            />
                                            <Flex justify="space-between" align="center">
                                                <Text type={contentError ? 'danger' : 'secondary'}>
                                                    {contentError ? contentError : `Character limit ${editingCount} / 600`}
                                                </Text>

                                                <Flex gap={8}>
                                                    <Button onClick={cancelEdit}>Cancel</Button>
                                                    <Button
                                                        type="primary"
                                                        onClick={() => handleSaveEdit(answer.id)}
                                                        disabled={editingContent.trim().length < 15}
                                                    >
                                                        Save
                                                    </Button>
                                                </Flex>
                                            </Flex>
                                        </Flex>
                                    ) : (
                                        <Paragraph
                                            style={{
                                                marginBottom: 0,
                                                fontSize: 15,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {answer.content}
                                        </Paragraph>
                                    )}
                                </Flex>
                            </Card>
                        )
                    })}

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
            </Flex >
        </>
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