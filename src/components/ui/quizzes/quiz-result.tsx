'use client'

import { Card, Row, Col, Typography, Statistic, Space, Tag } from 'antd';
const { Title, Text, Paragraph } = Typography;
import type { AttemptResult, QuestionResult } from '@/service/quiz.service';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    MinusCircleOutlined,
} from '@ant-design/icons';

const normalizeArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String);
    
    // Handle {"correct": "B"} or {"correct": ["A","B"]} format (already parsed object)
    if (typeof v === 'object' && v !== null && 'correct' in v) {
        const correct = (v as { correct: unknown }).correct;
        return Array.isArray(correct) ? correct.map(String) : [String(correct)];
    }
    
    if (typeof v === 'string') {
        try {
            const parsed = JSON.parse(v);
            // Handle {"correct": "B"} or {"correct": ["A","B"]} format (parsed from string)
            if (parsed?.correct !== undefined) {
                return Array.isArray(parsed.correct) ? parsed.correct : [parsed.correct];
            }
            return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
        } catch {
            return [v]; // It's already a plain string like "B"
        }
    }
    if (typeof v === 'number') return [String(v)];
    return [];
};

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

export default function QuizResult({ result }: { result: AttemptResult }) {
    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <ResultHeader
                quizTitle={result.title}
                attemptNumber={result.attempt_number}
                timeSpentSeconds={result.time_spent_seconds}
                score={result.score}
            // totalScore={result.total_score}
            // passed={result.passed}
            />

            {result.questions.map((q, i) => (
                <ResultDetails
                    key={q.id}
                    index={i + 1}
                    question={q}
                />
            ))}
        </Space>
    );
}

export function ResultHeader({
    quizTitle,
    attemptNumber,
    timeSpentSeconds,
    score,
    //   totalScore,
    //   passed,
}: {
    quizTitle: string;
    attemptNumber: number;
    timeSpentSeconds: number;
    score: number;
    //   totalScore: number;
    //   passed: boolean;
}) {
    return (
        <Card>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Title level={3}>
                    {quizTitle} — Attempt #{attemptNumber}
                </Title>

                <Row gutter={24}>
                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Time Spent"
                            value={Math.floor(timeSpentSeconds / 60)}
                            suffix="min"
                        />
                    </Col>

                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Score"
                            //   value={`${score} / ${totalScore}`}
                            value={`${score}`}
                        />
                    </Col>

                    <Col xs={24} sm={8}>
                        <Text type="secondary">Status</Text>
                        <br />
                        {/* <Tag color={passed ? 'green' : 'red'} style={{ marginTop: 4 }}>
              {passed ? 'PASSED' : 'FAILED'}
            </Tag> */}
                        <Text style={{ fontSize: 24, color: 'green', fontWeight: 'bold' }}>
                            PASSED
                        </Text>
                    </Col>
                </Row>
            </Space>
        </Card>
    );
}

export function ResultDetails({
    index,
    question,
}: {
    index: number;
    question: QuestionResult;
}) {
    const {
        questionText,
        explanation,
        type,
    } = question;

    const optionsList = parseOptions(question.options);
    const selectedAnswers = normalizeArray(question.selectedAnswers);
    const correctAnswers = normalizeArray(question.correctAnswers);

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {/* Question */}
                <Text strong>
                    {index}. {questionText}
                </Text>

                {/* Options */}
                <Space direction="vertical" size={6}>
                    {optionsList.map(([key, text]) => {
                        const isSelected = selectedAnswers.includes(key);
                        const isCorrect = correctAnswers.includes(key);

                        let icon = null;
                        let color: string | undefined;

                        if (isSelected && isCorrect) {
                            icon = <CheckCircleOutlined />;
                            color = 'green'; // preset color with light background
                        } else if (isSelected && !isCorrect) {
                            icon = <CloseCircleOutlined />;
                            color = 'error';
                        } else if (!isSelected && isCorrect) {
                            icon = <MinusCircleOutlined />;
                            color = 'gold'; // yellow
                        }

                        return (
                            <Tag
                                key={key}
                                color={color}
                                style={{
                                    padding: '6px 10px',
                                }}
                            >
                                {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
                                {key}. {text}
                            </Tag>
                        );
                    })}
                </Space>

                {/* Explanation */}
                <Paragraph type="secondary">
                    <strong>Correct:</strong>{' '}
                    {correctAnswers.join(', ')}
                    <br />
                    {explanation && (
                        <>
                            <strong>Explanation:</strong> {explanation}
                        </>
                    )}
                </Paragraph>
            </Space>
        </Card>
    );
}
