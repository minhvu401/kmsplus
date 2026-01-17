'use client'

import { useState, startTransition } from "react";
import { Flex, Typography, Tag, Divider, Dropdown, Button, message, Modal } from "antd";
const { Title, Text } = Typography;
import {
    EllipsisOutlined,
    EditOutlined,
    DeleteOutlined,
    ShareAltOutlined,
    LockOutlined,
    UnlockOutlined,
} from '@ant-design/icons';
import { Question } from "@/service/question.service";
import { deleteQuestion, closeQuestion, openQuestion } from "@/action/question/questionActions";
import Link from 'next/link';

export default function QuestionDetails({ question }: { question: Question }) {
    const userId = 1; // TEMP; Replace with actual user ID retrieval logic
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
                        posterId={question.user_id}
                        postId={question.id}
                        status={question.is_closed ? "closed" : "open"}
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
    posterId,
    postId,
    status,
}: {
    userId: number;
    posterId: number;
    postId: number;
    status: string;
}) {

    // Visibility state for the dropdown menu
    const [open, setOpen] = useState(false);
    // Visibility state for the delete confirmation modal
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    // Visibility state for the close confirmation modal
    const [isCloseVisible, setCloseVisible] = useState(false);
    // Visibility state for the open confirmation modal
    const [isOpenVisible, setOpenVisible] = useState(false);
    // Message API for notifications
    const [messageApi, contextHolder] = message.useMessage(); // 👈 Add this

    const handleShare = async () => {
        const url = `${window.location.origin}/questions/${postId}`;
        try {
            await navigator.clipboard.writeText(url);
            messageApi.success('Question link copied to clipboard!');
        } catch {
            messageApi.error('Failed to copy link.');
        }
        setOpen(false);
    };

    const items = [
        ...(Number(userId) === Number(posterId)
            ? [
                {
                    key: 'edit',
                    label: (
                        <Link href={`/questions/${postId}/edit`}>
                            <EditOutlined /> Edit question
                        </Link>
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
            deleteQuestion(postId.toString());
        });
    };

    const handleClose = () => {
        setCloseVisible(false);

        startTransition(() => {
            closeQuestion(postId.toString());
        });
    };

    const handleOpen = () => {
        setOpenVisible(false);

        startTransition(() => {
            openQuestion(postId.toString());
        });
    };

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


        </>
    );
}
