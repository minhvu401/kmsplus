'use client'

import { startTransition, useState, useEffect, useActionState } from 'react';
import { EditOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, Menu, Button, Modal, Typography, Form, Input } from 'antd';
import { deleteAnswer, updateAnswer } from '@/action/question/questionActions';
import { Answer, updateAnswerAction } from '@/service/question.service';

const { Text } = Typography;

export default function AnswerMenu({
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