'use client';

import { useState, useActionState, startTransition, useEffect } from 'react';
import { Form, Input, Select, Button, Typography, Flex, Modal, Divider } from 'antd';
import { State, updateQuestion } from '@/action/question/questionActions';

const { Text, Title } = Typography;
const { TextArea } = Input;

export type Question = {
    id: number
    user_id: number
    category_id: number | null
    title: string
    content: string
    answer_count: number
    is_closed: boolean
    deleted_at?: Date | null
    created_at: Date
    updated_at: Date
    user_name: string
    category_name: string
}

export default function UpdateQuestionForm({
    categories,
    currentData,
}: {
    categories: { id: number; name: string }[];
    currentData: Question;
}) {
    const [form] = Form.useForm();
    const [isLeaveVisible, setLeaveVisible] = useState(false);
    const [isSubmitVisible, setSubmitVisible] = useState(false);
    const [titleCount, setTitleCount] = useState(0);
    const [contentCount, setContentCount] = useState(0);
    const initialState: State = { message: null, errors: {} };
    const [state, updateQuestionAction] = useActionState(updateQuestion, initialState);

    const userId = 1; // TEMP; Replace with actual user ID retrieval logic
    // ALSO ADD VERIFYING USER IS THE RIGHTFUL OWNER BEFORE ALLOWING EDITS

    const handleLeave = () => {
        setLeaveVisible(false);
        window.location.href = '/questions/' + currentData.id;
    };

    const handleSubmit = () => {
        setSubmitVisible(false);
        form.submit();
    };

    useEffect(() => {
        if (!currentData || categories.length === 0) return;

        form.setFieldsValue({
            title: currentData.title,
            content: currentData.content,
            category_id:
                currentData.category_id !== null
                    ? Number(currentData.category_id)
                    : undefined,
        });

        setTitleCount(currentData.title.length);
        setContentCount(currentData.content.length);
    }, [currentData, categories, form]);

    return (
        <>
            <Flex vertical gap={15} style={{ width: '1100px', background: '#fff' }}>
                <Title level={3} style={{ color: '#1677ff', marginBottom: 0 }}>
                    Edit Question
                </Title>

                <Divider style={{ margin: '8px 0 16px' }} />

                <Form
                    form={form}
                    layout="vertical"
                    style={{ width: '100%' }}
                    onFinish={async (values) => {
                        const formData = new FormData();
                        formData.append('title', values.title);
                        formData.append('content', values.content);
                        formData.append('category_id', values.category_id);
                        formData.append('id', currentData.id.toString());

                        startTransition(() => {
                            updateQuestionAction(formData);
                        });
                    }}
                >
                    <Form.Item
                        label={<Text strong>Title:</Text>}
                        name="title"
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


                    <Flex justify="end" gap={16} style={{ marginTop: 32 }}>
                        <Button danger size="large" onClick={() => setLeaveVisible(true)}>
                            Leave
                        </Button>
                        <Button type="primary" size="large" onClick={() => setSubmitVisible(true)}>
                            Submit
                        </Button>
                    </Flex>

                    {state.message && (
                        <>
                            <Text type="danger" style={{ display: 'block', marginTop: 16 }}>
                                {state.message}
                            </Text>
                            {state.errors?.title?.map((err) => (
                                <Text key={err} type="danger" style={{ display: 'block' }}>- {err}</Text>
                            ))}
                            {state.errors?.content?.map((err) => (
                                <Text key={err} type="danger" style={{ display: 'block' }}>- {err}</Text>
                            ))}
                            {state.errors?.category_id?.map((err) => (
                                <Text key={err} type="danger" style={{ display: 'block' }}>- {err}</Text>
                            ))}
                        </>
                    )}
                </Form>
            </Flex>

            <Modal
                title="Confirmation"
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
                <Text>Are you sure you want to leave this page?</Text>
                <br />
                <Text type="secondary">Your edits will not be saved.</Text>
            </Modal>

            <Modal
                title="Confirmation"
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
