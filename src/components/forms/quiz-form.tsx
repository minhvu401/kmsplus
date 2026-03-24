'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Card, Button, Typography, Space, Tag, Modal, message } from 'antd';
import { saveAttemptAnswer, submitQuizAttempt } from '@/action/quiz/quizActions';
import type { Question } from '@/service/quiz.service';
import { CheckOutlined, ClockCircleOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const parseOptions = (opts: unknown): [string, string][] => {
    if (typeof opts === 'string') {
        try {
            opts = JSON.parse(opts);
        } catch {
            return [];
        }
    }
    if (typeof opts === 'object' && opts !== null && !Array.isArray(opts)) {
        return Object.entries(opts) as [string, string][];
    }
    if (Array.isArray(opts)) {
        return opts.map((opt, idx) => [String.fromCharCode(65 + idx), String(opt)] as [string, string]);
    }
    return [];
};

const formatCountdown = (timeLeftSeconds: number) => {
    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};


export default function QuizForm({
    attemptId,
    courseId,
    attemptNumber,
    questions,
    durationSeconds,
    initialAnswers,
}: {
    attemptId: number;
    courseId: number;
    attemptNumber: number;
    questions: Question[];
    durationSeconds: number | null;
    initialAnswers: Record<number, string | string[]>;
}) {
    const [answers, setAnswers] = useState<Record<number, string | string[]>>(initialAnswers);
    const [timeLeft, setTimeLeft] = useState<number | null>(
        durationSeconds
    );
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const submittedRef = useRef(false);

    /* ---------------- TIMER (ONLY IF TIMED) ---------------- */
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(t => (t !== null ? t - 1 : null));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    /* ---------------- ANSWER CHANGE ---------------- */
    function handleAnswerChange(
        questionId: number,
        value: string | string[]
    ) {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value,
        }));

        startTransition(() => {
            saveAttemptAnswer({
                attemptId,
                questionId,
                selectedAnswer: value,
            });
        });
    }

    /* ---------------- FINAL SUBMIT ---------------- */
    async function submitAttempt() {
        if (submittedRef.current) return;
        submittedRef.current = true;

        try {
            await submitQuizAttempt(attemptId);
            window.location.href = `/courses/${courseId}/learning/attempt/${attemptId}/result`;
        } catch {
            submittedRef.current = false;
            message.error('Failed to submit quiz');
        }
    }

    /* ---------------- AUTO SUBMIT (TIMED ONLY) ---------------- */
    function handleAutoSubmit() {
        if (submittedRef.current) return;

        Modal.warning({
            title: 'Time is up!',
            content: 'Your quiz will be submitted automatically.',
            okText: 'OK',
            onOk: submitAttempt,
        });
    }

    return (
        <>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Hero Header (matches result page styling) */}
                <div style={{
                    background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                    borderRadius: 16,
                    padding: '32px 28px',
                    color: 'white',
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(22, 119, 255, 0.2)'
                }}>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ maxWidth: 650 }}>
                            <Space direction="vertical" size={8}>
                                <Space wrap>
                                    <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none' }}>
                                        Attempt #{attemptNumber}
                                    </Tag>
                                    <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none' }}>
                                        {questions.length} Questions
                                    </Tag>
                                    {timeLeft !== null && (
                                        <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none' }}>
                                            <ClockCircleOutlined /> {formatCountdown(timeLeft)}
                                        </Tag>
                                    )}
                                </Space>
                                <Title level={2} style={{ color: 'white', margin: 0, fontSize: 28 }}>
                                    Quiz In Progress
                                </Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                                    Select your answer(s) for each question, then submit when you’re ready.
                                </Paragraph>
                            </Space>
                        </div>

                        <Button
                            size="large"
                            danger
                            type="primary"
                            icon={<SendOutlined />}
                            loading={isPending}
                            onClick={() => setOpen(true)}
                            style={{
                                height: 48,
                                borderRadius: 24,
                                paddingLeft: 28,
                                paddingRight: 28,
                                fontWeight: 600
                            }}
                        >
                            Submit Quiz
                        </Button>
                    </div>

                    <div style={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                    }} />
                </div>

                {/* Questions */}
                <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    {questions.map((q, index) => (
                        <QuestionCard
                            key={q.id}
                            index={index + 1}
                            total={questions.length}
                            question={q}
                            value={answers[q.id]}
                            onChange={handleAnswerChange}
                        />
                    ))}

                    {/* Bottom submit button */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 24px' }}>
                        <Button
                            size="large"
                            danger
                            type="primary"
                            icon={<SendOutlined />}
                            loading={isPending}
                            onClick={() => setOpen(true)}
                            style={{
                                height: 48,
                                borderRadius: 24,
                                paddingLeft: 32,
                                paddingRight: 32,
                                fontWeight: 600
                            }}
                        >
                            Submit Quiz
                        </Button>
                    </div>
                </Space>
            </div>

            <Modal 
                open={open} 
                title="Submit quiz?"
                okText="Submit"
                cancelText="Cancel"
                confirmLoading={isPending}
                onOk={submitAttempt}
                onCancel={() => setOpen(false)} 
            >
                <p>Are you sure you want to submit the quiz?</p>
            </Modal>
        </>
    );
}

function QuestionCard({
    index,
    total,
    question,
    value,
    onChange,
}: {
    index: number;
    total: number;
    question: any;
    value?: string | string[];
    onChange: (id: number, value: string | string[]) => void;
}) {
    return (
        <Card
            bordered={false}
            style={{
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                overflow: 'hidden'
            }}
            styles={{ body: { padding: 0 } }}
        >
            <div style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Question {index} of {total}
                    </Text>
                    <Tag color={question.type === 'multiple_choice' ? 'processing' : 'default'}>
                        {question.type === 'multiple_choice' ? 'Multiple choice' : 'Single choice'}
                    </Tag>
                </div>

                <Paragraph style={{ fontSize: 16, fontWeight: 500, marginBottom: 18 }}>
                    {question.question_text}
                </Paragraph>

                {question.type === 'single_choice' ? (
                    <SingleChoice
                        question={question}
                        value={value as string | undefined}
                        onChange={(v) => onChange(question.id, v)}
                    />
                ) : (
                    <MultipleChoice
                        question={question}
                        value={(value as string[]) || []}
                        onChange={(v) => onChange(question.id, v)}
                    />
                )}
            </div>
        </Card>
    );
}

function SingleChoice({
    question,
    value,
    onChange,
}: {
    question: any;
    value?: string;
    onChange: (v: string) => void;
}) {
    const options = parseOptions(question.options);

    return (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {options.map(([key, text]) => {
                const isSelected = value === key;

                const borderColor = isSelected ? '#1677ff' : '#f0f0f0';
                const bgColor = isSelected ? '#f8fafd' : 'transparent';
                const icon = isSelected
                    ? (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <CheckOutlined style={{ color: 'white', fontSize: 12 }} />
                        </div>
                    )
                    : (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <span style={{ fontSize: 10, color: '#8c8c8c' }}>{key}</span>
                        </div>
                    );

                return (
                    <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => onChange(key)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onChange(key);
                            }
                        }}
                        style={{
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            borderRadius: 8,
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {icon}
                        <Text style={{ flex: 1 }}>{text}</Text>
                        {isSelected && <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Selected</Text>}
                    </div>
                );
            })}
        </Space>
    );
}

function MultipleChoice({
    question,
    value = [],
    onChange,
}: {
    question: any;
    value?: string[];
    onChange: (v: string[]) => void;
}) {
    const options = parseOptions(question.options);
    const selected = new Set(value);

    return (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {options.map(([key, text]) => {
                const isSelected = selected.has(key);

                const borderColor = isSelected ? '#1677ff' : '#f0f0f0';
                const bgColor = isSelected ? '#f8fafd' : 'transparent';
                const icon = isSelected
                    ? (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <CheckOutlined style={{ color: 'white', fontSize: 12 }} />
                        </div>
                    )
                    : (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <span style={{ fontSize: 10, color: '#8c8c8c' }}>{key}</span>
                        </div>
                    );

                return (
                    <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            const next = new Set(selected);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            onChange(Array.from(next));
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const next = new Set(selected);
                                if (next.has(key)) next.delete(key);
                                else next.add(key);
                                onChange(Array.from(next));
                            }
                        }}
                        style={{
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            borderRadius: 8,
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {icon}
                        <Text style={{ flex: 1 }}>{text}</Text>
                        {isSelected && <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Selected</Text>}
                    </div>
                );
            })}
        </Space>
    );
}
