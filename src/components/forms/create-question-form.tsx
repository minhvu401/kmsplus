'use client';

import { useState, useActionState, startTransition } from 'react';
import { Form, Input, Select, Button, Typography, Flex, Modal, Divider } from 'antd';
import { State, createQuestion } from '@/action/question/questionActions';

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function CreateQuestionForm({
    categories,
    userId,
}: {
    categories: { id: number; name: string }[];
    userId: number;
}) {
    const [form] = Form.useForm();
    const [isLeaveVisible, setLeaveVisible] = useState(false);
    const [isSubmitVisible, setSubmitVisible] = useState(false);
    const [titleCount, setTitleCount] = useState(0);
    const [contentCount, setContentCount] = useState(0);

    const initialState: State = { message: null, errors: {} };
    const [state, createQuestionAction] = useActionState(createQuestion, initialState);

    const handleLeave = () => {
        setLeaveVisible(false);
        window.location.href = '/questions';
    };

    const handleSubmit = () => {
        setSubmitVisible(false);
        form.submit();
    };

    return (
        <>
            <Flex vertical gap={15} style={{ width: '1100px', background: '#fff' }}>
                <Title level={3} style={{ color: '#1677ff', marginBottom: 0 }}>
                    Ask a Question
                </Title>

                <Divider style={{ margin: '8px 0 16px' }} />

                <Form
                    form={form}
                    layout="vertical"
                    style={{ width: '100%' }}
                    onFinish={async (values) => {
                        const formData = new FormData();
                        formData.append('user_id', String(userId));
                        formData.append('title', values.title);
                        formData.append('content', values.content);
                        formData.append('category_id', values.category_id);

                        startTransition(() => {
                            createQuestionAction(formData);
                        });
                    }}
                >
                    <Form.Item
                        label={<Text strong>Title:</Text>}
                        name="title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
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
                        rules={[{ required: true, message: 'Please provide more details' }]}
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
                                value: cat.id,
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
                <Text type="secondary">Your question will not be saved.</Text>
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
                <Text>Are you sure you want to ask this question?</Text>
            </Modal>
        </>
    );
}
