'use client';

import { useState, useActionState, startTransition } from 'react';
import { Form, Input, Select, Button, Typography, Flex, Modal, Divider } from 'antd';
import { State, createAnswer } from '@/action/question/questionActions';
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Text } = Typography;

// Wrapper component for Ant Design Form integration
interface ContentEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

function ContentEditor({ value = '', onChange, placeholder }: ContentEditorProps) {
  return (
    <RichTextEditor
      value={value}
      onChange={(val) => onChange?.(val)}
      placeholder={placeholder}
    />
  );
}

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
            <Flex
                vertical
                gap={8}
                style={{ width: '100%', maxWidth: 900, background: '#fff' }}
            >
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
                        style={{ marginBottom: 8 }}
                        getValueFromEvent={(val: string) => {
                            // Strip HTML tags to count plain text characters
                            const plainText = val ? val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
                            setContentCount(plainText.length);
                            return val;
                        }}
                        rules={[{ required: true, message: 'Please provide more details' },
                        {
                            validator: (_, value) => {
                                // Only validate length if user has entered content
                                if (!value) {
                                    return Promise.resolve(); // Let required rule handle empty case
                                }
                                // Strip HTML tags to get plain text for validation
                                const plainText = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                                if (plainText.length > 0 && plainText.length < 15) {
                                    return Promise.reject('Answers must be at least 15 characters');
                                }
                                return Promise.resolve();
                            }
                        }
                        ]}
                    >
                        <ContentEditor placeholder="Enter your answer here..." />
                    </Form.Item>

                    <Flex justify="space-between" align="center">
                        <Text type="secondary">Character limit {contentCount} / 600</Text>
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
