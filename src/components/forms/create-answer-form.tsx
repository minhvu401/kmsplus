'use client';

import { useState, useActionState, startTransition } from 'react';
import { Form, Input, Select, Button, Typography, Flex, Modal, Divider } from 'antd';
import { State, createAnswer } from '@/action/question/questionActions';

const { Text } = Typography;
const { TextArea } = Input;

export default function CreateAnswerForm({
    userId,
    questionId,
}: {
    userId: number;
    questionId: number;
}) {
    const [form] = Form.useForm();
    const [isSubmitVisible, setSubmitVisible] = useState(false);
    const [contentCount, setContentCount] = useState(0);

    const initialState: State = { message: null, errors: {} };
    const [state, createAnswerAction] = useActionState(createAnswer, initialState);

    const handleSubmit = () => {
        setSubmitVisible(false);
        form.submit();
    };

    return (
        <>
            <Flex vertical gap={16} style={{ width: '1100px', background: '#fff' }}>
                <Form
                    form={form}
                    layout="vertical"
                    style={{ width: '100%' }}
                    onFinish={async (values) => {
                        const formData = new FormData();
                        formData.append('user_id', String(userId));
                        formData.append('question_id', String(questionId));
                        formData.append('content', values.content);

                        startTransition(() => {
                            createAnswerAction(formData);
                        });
                    }}
                >

                    <Form.Item
                        name="content"
                        rules={[{ required: true, message: 'Please provide more details' },
                        { min: 15, message: 'Answers must be at least 15 characters' }
                        ]}
                    >
                        <TextArea
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
                    <Flex justify="end" gap={16} style={{ marginTop: 2 }}>
                        <Button type="primary" size="large" onClick={() => setSubmitVisible(true)}>
                            Submit
                        </Button>
                    </Flex>

                    {state.message && (
                        <>
                            <Text type="danger" style={{ display: 'block', marginTop: 2 }}>
                                {state.message}
                            </Text>
                            {state.errors?.content?.map((err) => (
                                <Text key={err} type="danger" style={{ display: 'block' }}>- {err}</Text>
                            ))}
                        </>
                    )}
                </Form>
            </Flex>


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
                <Text>Are you sure you want to submit this answer?</Text>
            </Modal>
        </>
    );
}
