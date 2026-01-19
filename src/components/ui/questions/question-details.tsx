'use client'

import { useEffect, useState, startTransition, useActionState } from "react";
import { Flex, Typography, Tag, Divider, Dropdown, Button, message, Modal, Form, Input, Select } from "antd";
const { Title, Text } = Typography;
const { TextArea } = Input;
import {
    EllipsisOutlined,
    EditOutlined,
    DeleteOutlined,
    ShareAltOutlined,
    LockOutlined,
    UnlockOutlined,
} from '@ant-design/icons';
import { Question } from "@/service/question.service";
import { Category } from "@/service/question.service";
import { deleteQuestion, closeQuestion, openQuestion, updateQuestion, State } from "@/action/question/questionActions";
import Link from 'next/link';

export default function QuestionDetails({ userId, question, categories }: { userId: number; question: Question; categories: Category[] }) {
    const createdAt = new Date(question.created_at);
    const updatedAt = new Date(question.updated_at);

    return (
        <Flex vertical align="center" gap={12} style={{ marginTop: 24 }}>
            {/* Title and Menu */}
            <Flex
                align="center"
                justify="center"
                style={{ position: "relative", width: "100%", marginBottom: 12 }}
            >
                <Title level={3} style={{ color: "#1677ff", textAlign: "center", margin: 0 }}>
                    {question.title}
                </Title>

                <div style={{ position: "absolute", right: 0, top: 0 }}>
                    <QuestionMenu
                        userId={userId}
                        question={question}
                        categories={categories}
                    />
                </div>
            </Flex>

            {/* Author & Category Info */}
            <Flex align="center" justify="center" gap={12} style={{ color: "#374151" }}>
                <Text strong>by {question.user_name}</Text>
                <Tag color="blue">{question.category_name}</Tag>
                <Tag color={question.is_closed ? "red" : "green"}>
                    {question.is_closed ? "Closed" : "Open"}
                </Tag>
            </Flex>

            {/* Metadata Row */}
            <Flex align="center" justify="center" gap={48} style={{ color: "#4b5563", fontWeight: 500 }}>
                <Text>asked on {createdAt.toLocaleDateString()}</Text>
                {question.is_closed ? (
                    <Text>closed on {updatedAt.toLocaleDateString()}</Text>
                ) : (
                    <Text>last updated on {updatedAt.toLocaleDateString()}</Text>
                )}
            </Flex>

            <Divider style={{ borderColor: "#d1d5db", width: "100%" }} />

            {/* Content */}
            <Flex justify="center" style={{ padding: "0 80px" }}>
                <Text style={{ color: "#374151", fontSize: 18, whiteSpace: "pre-wrap" }}>
                    {question.content}
                </Text>
            </Flex>
            <Divider style={{ borderColor: "#d1d5db", width: "100%" }} />
        </Flex>
    );
}

export function QuestionMenu({
    userId,
    question,
    categories,
}: {
    userId: number;
    question: Question;
    categories: Category[];
}) {

    const [form] = Form.useForm();
    // Visibility state for the dropdown menu
    const [open, setOpen] = useState(false);
    const [isUpdateVisible, setUpdateVisible] = useState(false);
    const [isSubmitVisible, setSubmitVisible] = useState(false);
    const [isLeaveVisible, setLeaveVisible] = useState(false);
    const [titleCount, setTitleCount] = useState(0);
    const [contentCount, setContentCount] = useState(0);
    // Visibility state for the delete confirmation modal
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    // Visibility state for the close confirmation modal
    const [isCloseVisible, setCloseVisible] = useState(false);
    // Visibility state for the open confirmation modal
    const [isOpenVisible, setOpenVisible] = useState(false);

    // Message API for notifications
    const [messageApi, contextHolder] = message.useMessage();
    const initialState: State = { message: null, errors: {} };
    const [state, updateQuestionAction] = useActionState(updateQuestion, initialState);

    const status = question.is_closed ? 'closed' : 'open';
    const titleError = state?.errors?.title?.[0]
    const contentError = state?.errors?.content?.[0]
    const categoryError = state?.errors?.category_id?.[0]

    const handleShare = async () => {
        const url = `${window.location.origin}/questions/${question.id}`;
        try {
            await navigator.clipboard.writeText(url);
            messageApi.success('Question link copied to clipboard!');
        } catch {
            messageApi.error('Failed to copy link.');
        }
        setOpen(false);
    };

    const items = [
        ...(Number(userId) === Number(question.user_id)
            ? [
                {
                    key: 'edit',
                    label: (
                        <span
                            onClick={() => {
                                setUpdateVisible(true);
                                setOpen(false);
                            }}
                        >
                            <EditOutlined /> Edit question
                        </span>
                    ),
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
                            <DeleteOutlined /> Delete question
                        </span>
                    ),
                },
                status === 'closed'
                    ? {
                        key: 'open',
                        label: (
                            <span
                                onClick={() => {
                                    setOpenVisible(true);
                                    setOpen(false);
                                }}
                            >
                                <UnlockOutlined /> Open question
                            </span>
                        ),
                    }
                    : {
                        key: 'close',
                        label: (
                            <span
                                onClick={() => {
                                    setCloseVisible(true);
                                    setOpen(false);
                                }}
                            >
                                <LockOutlined /> Close question
                            </span>
                        ),
                    },
            ]
            : []),
        {
            key: 'share',
            label: (
                <span onClick={handleShare}>
                    <ShareAltOutlined /> Share question
                </span>
            ),
        },
    ];

    const handleDelete = () => {
        setDeleteVisible(false);

        startTransition(() => {
            deleteQuestion(question.id.toString());
        });
    };

    const handleClose = () => {
        setCloseVisible(false);

        startTransition(() => {
            closeQuestion(question.id.toString());
        });
    };

    const handleOpen = () => {
        setOpenVisible(false);

        startTransition(() => {
            openQuestion(question.id.toString());
        });
    };

    const handleLeave = () => {
        setLeaveVisible(false);
        setUpdateVisible(false);
    };

    const handleSubmit = () => {
        setSubmitVisible(false);
        form.submit();
    };

    useEffect(() => {
        if (!isUpdateVisible) return;

        const initialTitle = question.title ?? "";
        const initialContent = question.content ?? "";
        const initialCategoryId = (question.category_id ?? undefined) as number | undefined;

        form.setFieldsValue({
            title: initialTitle,
            content: initialContent,
            category_id: initialCategoryId,
        });

        setTitleCount(initialTitle.length);
        setContentCount(initialContent.length);
    }, [isUpdateVisible, form, question]);

    return (
        <>
            {contextHolder} {/* 👈 This mounts the message context */}
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
                        Delete
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to delete this post?</Text>
                <br />
                <Text type="secondary">Your post will be permanently deleted.</Text>
            </Modal>

            <Modal
                title="Confirmation"
                centered
                open={isCloseVisible}
                onCancel={() => setCloseVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setCloseVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="close" danger onClick={handleClose}>
                        Confirm
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to close this post?</Text>
                <br />
                <Text type="secondary">Your post will be closed. No new comments will be allowed.</Text>
            </Modal>

            <Modal
                title="Confirmation"
                centered
                open={isOpenVisible}
                onCancel={() => setOpenVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setOpenVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="open" danger onClick={handleOpen}>
                        Confirm
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to open this post?</Text>
                <br />
                <Text type="secondary">Your post will be opened. New comments will be allowed.</Text>
            </Modal>

            <Modal
                title="Edit Question"
                centered
                open={isUpdateVisible}
                onCancel={() => setLeaveVisible(true)}
                onOk={() => setSubmitVisible(true)}
                okText="Submit"
                width={700}
                destroyOnHidden
                afterClose={() => {
                    form.resetFields();
                    setTitleCount(0);
                    setContentCount(0);
                }}
            >
                {state?.message ? (
                    <Text type="danger" style={{ display: "block", marginBottom: 12 }}>
                        {state.message}
                    </Text>
                ) : null}
                <Form
                    form={form}
                    layout="vertical"
                    style={{ width: '100%' }}
                    onFinish={async (values) => {
                        const formData = new FormData();
                        formData.append('title', values.title);
                        formData.append('content', values.content);
                        formData.append('category_id', values.category_id);
                        formData.append('id', question.id.toString());

                        startTransition(() => {
                            updateQuestionAction(formData);
                        });
                    }}
                >
                    <Form.Item
                        label={<Text strong>Title:</Text>}
                        name="title"
                        help={titleError}
                        validateStatus={titleError ? "error" : undefined}
                        rules={[{ required: true, message: 'Please enter a title' },
                        { min: 3, message: 'Title must be at least 3 characters' }
                        ]}
                    >
                        <Input
                            placeholder="Write your question title here..."
                            maxLength={150}
                            onChange={(e) => setTitleCount(e.target.value.length)}
                            style={{ height: 40 }}
                        />
                    </Form.Item>
                    <Text type="secondary">Character limit {titleCount} / 150</Text>

                    <Divider style={{ margin: '8px 0 16px' }} />

                    <Form.Item
                        label={<Text strong>Content:</Text>}
                        name="content"
                        help={contentError}
                        validateStatus={contentError ? "error" : undefined}
                        rules={[{ required: true, message: 'Please provide more details' },
                        { min: 10, message: 'Content must be at least 10 characters' }
                        ]}
                    >
                        <TextArea
                            rows={8}
                            placeholder="Provide more details about your question..."
                            maxLength={3000}
                            onChange={(e) => setContentCount(e.target.value.length)}
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>
                    <Text type="secondary">Character limit {contentCount} / 3000</Text>

                    <Divider style={{ margin: '8px 0 16px' }} />

                    <Form.Item
                        label={<Text strong>Category:</Text>}
                        name="category_id"
                        help={categoryError}
                        validateStatus={categoryError ? "error" : undefined}
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select
                            placeholder="Select category"
                            options={categories.map((cat) => ({
                                label: cat.name,
                                value: Number(cat.id),
                            }))}
                            allowClear
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Confirmation"
                centered
                open={isLeaveVisible}
                onCancel={() => setLeaveVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setLeaveVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="leave" danger onClick={handleLeave}>
                        Leave
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to leave this pop-up?</Text>
                <br />
                <Text type="secondary">Your edit will not be saved.</Text>
            </Modal>

            <Modal
                title="Confirmation"
                centered
                open={isSubmitVisible}
                onCancel={() => setSubmitVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setSubmitVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSubmit}>
                        Submit
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to edit this question?</Text>
            </Modal>

        </>
    );
}
