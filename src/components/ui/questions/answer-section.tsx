'use client'

import { useState, useActionState, startTransition, useEffect } from 'react';
import { Flex, Typography, Divider, Card, Avatar, Form, Dropdown, Button, Modal, Input } from "antd";
import { EditOutlined, DeleteOutlined, EllipsisOutlined, LockOutlined } from '@ant-design/icons';
import { updateAnswer, deleteAnswer } from '@/action/question/questionActions';
import CreateAnswerForm from "@/components/forms/create-answer-form";
import { Answer } from "@/service/question.service";
import Pagination from "@/components/ui/questions/pagination";
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
    const totalPages = Math.ceil(Number(answers.length) / 5)

    return (
        <>
            <Flex vertical align="left" gap={12} style={{ marginTop: 6 }}>
                {/* Title and Sort Filter */}
                <Flex
                    align="left"
                    justify="left"
                    style={{ position: "relative", width: "100%", marginBottom: 12, marginLeft: 30 }}
                >
                    <Title level={4} style={{ color: "black", textAlign: "left", margin: 0 }}>
                        Answers ({answer_count})
                    </Title>

                    {/*  FUTURE SORT FILTER */}
                    {/* <div style={{ position: "absolute", right: 0, top: 0 }}>
                
                </div> */}
                </Flex>

                {/* Create Answer Form */}
                <Flex
                    align="center"
                    justify="center"
                    style={{ position: "relative", width: "100%", marginBottom: 5 }}
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
                                        <AnswerMenu answer={answer} />
                                    </Flex>
                                </Flex>

                                <Divider style={{ margin: "6px 0" }} />

                                {/* Answer content (indented & larger) */}
                                <Flex style={{ marginLeft: 40 }}>
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
                                </Flex>
                            </Card>
                        )
                    })}
                    <Flex justify="end" align="center" style={{ marginBottom: 24 }}>
                        <Pagination totalPages={totalPages} />
                    </Flex>
                </Flex>
            </Flex >
        </>
    );
}

export function AnswerMenu({
    answer
}: {
    answer: Answer
}) {
    const [form] = Form.useForm();
    const [open, setOpen] = useState(false);
    const [contentCount, setContentCount] = useState(0);
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    const [isUpdateVisible, setUpdateVisible] = useState(false);
    const [state, updateAnswerAction] = useActionState(updateAnswer, { message: null, errors: {} });

    const items = [
        {
            key: 'edit',
            label: (
                <span
                    onClick={() => {
                        setUpdateVisible(true);
                        setOpen(false);
                    }}
                >
                    <EditOutlined /> Edit answer
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
                    <DeleteOutlined /> Delete answer
                </span>
            ),
        },
    ];

    const handleDelete = () => {
        // Implement delete logic here
        setDeleteVisible(false);

        startTransition(() => {
            deleteAnswer(answer.id, answer.question_id);
        });
    };

    const handleUpdate = () => {
        setUpdateVisible(false);
        form.submit();
    }

    useEffect(() => {
        form.setFieldsValue({
            content: answer.content,
        });
        setContentCount(answer.content.length);
    }, [form]);

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

            <Modal
                title="Edit answer"
                open={isUpdateVisible}
                onCancel={() => setUpdateVisible(false)}
                onOk={handleUpdate}
                okText="Submit"
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={async (values) => {
                        const formData = new FormData();
                        formData.append('content', values.content);
                        formData.append('answer_id', answer.id.toString());
                        formData.append('question_id', answer.question_id.toString());

                        startTransition(() => {
                            updateAnswerAction(formData);
                        });
                    }}
                >
                    <Form.Item
                        name="content"
                        rules={[
                            { required: true, message: 'Please enter content' },
                            { min: 15, message: 'Minimum 15 characters' }
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Enter your answer here..."
                            maxLength={600}
                            onChange={(e) => {
                                setContentCount(e.target.value.length);
                            }}
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>
                    <Text type="secondary">Character limit {contentCount} / 600</Text>
                </Form>
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