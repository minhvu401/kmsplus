'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Card, Button, Typography, Radio, Space, Checkbox, Divider, Modal, message } from 'antd';
import { saveAttemptAnswer, submitQuizAttempt } from '@/action/quiz/quizActions';
import type { Question } from '@/service/quiz.service';

const { Text } = Typography;
const { confirm } = Modal;


export default function QuizForm({
    attemptId,
    questions,
    durationSeconds,
    initialAnswers,
}: {
    attemptId: number;
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
            window.location.href = `/courses/quiz/attempt/${attemptId}/result`;
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
            <Card>
                {/* HEADER */}
                <Space
                    align="center"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                >
                    {/* TIMER (ONLY IF TIMED) */}
                    {timeLeft !== null && <Timer timeLeft={timeLeft} />}

                    <Button
                        type="primary"
                        danger
                        loading={isPending}
                        onClick={() => setOpen(true)}
                    >
                        Submit Quiz
                    </Button>
                </Space>

                <Divider />

                {/* QUESTIONS */}
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {questions.map((q, index) => (
                        <QuestionCard
                            key={q.id}
                            index={index + 1}
                            question={q}
                            value={answers[q.id]}
                            onChange={handleAnswerChange}
                        />
                    ))}
                </Space>
            </Card>

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
    question,
    value,
    onChange,
}: {
    index: number;
    question: any;
    value?: string | string[];
    onChange: (id: number, value: string | string[]) => void;
}) {
    return (
        <Card size="small">
            <Text strong>
                {index}. {question.question_text}
            </Text>

            <div style={{ marginTop: 12 }}>
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

function Timer({ timeLeft }: { timeLeft: number }) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <Text strong type={timeLeft < 60 ? 'danger' : undefined}>
            Time Left: {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
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
    const parseOptions = (opts: any): [string, string][] => {
        if (typeof opts === 'string') {
            opts = JSON.parse(opts);
        }
        if (typeof opts === 'object' && opts !== null && !Array.isArray(opts)) {
            return Object.entries(opts) as [string, string][];
        }
        if (Array.isArray(opts)) {
            return opts.map((opt, idx) => [String.fromCharCode(65 + idx), opt] as [string, string]);
        }
        return [];
    };
    const options = parseOptions(question.options);

    return (
        <Radio.Group
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <Space direction="vertical">
                {options.map(([key, text]) => (
                    <Radio key={key} value={key}>
                        {key}. {text}
                    </Radio>
                ))}
            </Space>
        </Radio.Group>
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
    const parseOptions = (opts: any): [string, string][] => {
        if (typeof opts === 'string') {
            opts = JSON.parse(opts);
        }
        if (typeof opts === 'object' && opts !== null && !Array.isArray(opts)) {
            return Object.entries(opts) as [string, string][];
        }
        if (Array.isArray(opts)) {
            return opts.map((opt, idx) => [String.fromCharCode(65 + idx), opt] as [string, string]);
        }
        return [];
    };
    const options = parseOptions(question.options);

    return (
        <Checkbox.Group
            value={value}
            onChange={(vals) => onChange(vals as string[])}
        >
            <Space direction="vertical">
                {options.map(([key, text]) => (
                    <Checkbox key={key} value={key}>
                        {key}. {text}
                    </Checkbox>
                ))}
            </Space>
        </Checkbox.Group>
    );
}
