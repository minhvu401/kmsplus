'use client'

import { Card, Row, Col, Typography, Statistic, Space, Tag } from 'antd';
const { Title, Text, Paragraph } = Typography;
import { AttemptResult, QuestionResult } from '@/service/quiz.service';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    MinusCircleOutlined,
} from '@ant-design/icons';

const normalizeArray = (v: unknown): number[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'number') return [v];
    if (typeof v === 'string') {
        try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
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
        options,
        explanation,
        type,
    } = question;

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
                    {options.map((opt, idx) => {
                        const isSelected = selectedAnswers.includes(idx);
                        const isCorrect = correctAnswers.includes(idx);

                        let icon = null;
                        let color: 'success' | 'error' | undefined;

                        if (isSelected && isCorrect) {
                            icon = <CheckCircleOutlined />;
                            color = 'success';
                        } else if (isSelected && !isCorrect) {
                            icon = <CloseCircleOutlined />;
                            color = 'error';
                        } else if (!isSelected && isCorrect) {
                            icon = <MinusCircleOutlined />;
                            color = 'success';
                        }

                        return (
                            <Tag
                                key={idx}
                                color={color}
                                style={{
                                    padding: '6px 10px',
                                    opacity: !isSelected && isCorrect ? 0.7 : 1,
                                }}
                            >
                                {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
                                {opt}
                            </Tag>
                        );
                    })}
                </Space>

                {/* Explanation */}
                <Paragraph type="secondary">
                    <strong>Correct:</strong>{' '}
                    {correctAnswers.map(i => options[i]).join(', ')}
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
