'use client'

import React, { useEffect, useState } from 'react';
import { getInProgressAttemptForCurriculumItem, startQuizAttempt } from "@/action/quiz/quizActions";
import type { Quiz } from "@/service/quiz.service";
import { Card, Row, Col, Typography, Space, message, Button, Modal } from 'antd'
import { ClockCircleOutlined, TrophyOutlined, NumberOutlined, CalendarOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { format } from 'date-fns'

const { Title, Text, Paragraph } = Typography;

export default function QuizDetails({ quiz, curriculumItemId, courseId }: { quiz: Quiz; curriculumItemId: number; courseId: number }) {
    const hasFrom = !!quiz.available_from
    const hasTo = !!quiz.available_until

    const formatDate = (date?: string | Date | null) => {
        if (!date) return null
        return format(new Date(date), 'dd MMM yyyy, HH:mm')
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
            <Space direction="vertical" size={40} style={{ width: '100%', alignItems: 'center' }}>
                
                {/* Header Section */}
                <div style={{ textAlign: 'center', maxWidth: 700 }}>
                    <Title level={2} style={{ margin: '0 0 16px' }}>
                        {quiz.title}
                    </Title>
                    {quiz.description && (
                        <Paragraph type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
                            {quiz.description}
                        </Paragraph>
                    )}
                </div>

                {/* Key Statistics Grid */}
                <Row gutter={[24, 24]} style={{ width: '100%' }} justify="center">
                    <Col xs={24} sm={8}>
                        <StatCard 
                            icon={<ClockCircleOutlined style={{ fontSize: 28, color: '#1677ff' }} />}
                            label="Time Limit"
                            value={quiz.time_limit_minutes ? `${quiz.time_limit_minutes} mins` : 'No Limit'}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard 
                            icon={<TrophyOutlined style={{ fontSize: 28, color: '#faad14' }} />}
                            label="Passing Score"
                            value={quiz.passing_score ? `${quiz.passing_score}%` : 'None'}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard 
                            icon={<NumberOutlined style={{ fontSize: 28, color: '#52c41a' }} />}
                            label="Attempts Allowed"
                            value={quiz.max_attempts ? `${quiz.max_attempts}` : 'Unlimited'}
                        />
                    </Col>
                </Row>

                {/* Availability Info */}
                {(hasFrom || hasTo) && (
                    <div style={{ 
                        background: '#f9f9f9', 
                        padding: '16px 32px', 
                        borderRadius: 8, 
                        border: '1px solid #f0f0f0',
                        width: 'fit-content'
                    }}>
                        <Space size={32} wrap style={{ justifyContent: 'center' }}>
                            {hasFrom && (
                                <Space>
                                    <CalendarOutlined style={{ color: '#8c8c8c' }}/>
                                    <Text type="secondary">Opens:</Text>
                                    <Text strong>{formatDate(quiz.available_from)}</Text>
                                </Space>
                            )}
                            {hasTo && (
                                <Space>
                                    <CalendarOutlined style={{ color: '#8c8c8c' }}/>
                                    <Text type="secondary">Closes:</Text>
                                    <Text strong>{formatDate(quiz.available_until)}</Text>
                                </Space>
                            )}
                        </Space>
                    </div>
                )}

                {/* CTA Section */}
                <div style={{ paddingTop: 8 }}>
                    <StartQuizButton
                        curriculumItemId={curriculumItemId}
                        courseId={courseId}
                    />
                </div>
            </Space>
        </div>
    )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <Card 
            variant="borderless" 
            style={{ 
                height: '100%', 
                background: '#f8fafd', 
                textAlign: 'center',
                boxShadow: 'none'
            }}
            styles={{ body: { padding: '24px 16px' } }}
        >
            <Space direction="vertical" size={12}>
                <div style={{ marginBottom: 4 }}>{icon}</div>
                <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>{label}</Text>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#262626', marginTop: 4 }}>
                        {value}
                    </div>
                </div>
            </Space>
        </Card>
    )
}

export function StartQuizButton({
    curriculumItemId,
    courseId,
}: {
    curriculumItemId: number;
    courseId: number;
}) {

    const [messageApi, contextHolder] = message.useMessage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [existingAttemptId, setExistingAttemptId] = useState<number | null>(null);
    const [checkingAttempt, setCheckingAttempt] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadInProgressAttempt = async () => {
            try {
                const result = await getInProgressAttemptForCurriculumItem(curriculumItemId);
                if (isMounted) {
                    setExistingAttemptId(result.attemptId);
                }
            } catch {
                // Ignore lookup errors and keep default start behavior.
            } finally {
                if (isMounted) {
                    setCheckingAttempt(false);
                }
            }
        };

        loadInProgressAttempt();

        return () => {
            isMounted = false;
        };
    }, [curriculumItemId]);

    async function handleConfirmStart() {
        try {
            setLoading(true);
            if (existingAttemptId) {
                window.location.href = `/courses/${courseId}/learning/attempt/${existingAttemptId}`;
                return;
            }

            const attempt = await startQuizAttempt(curriculumItemId);
            window.location.href = `/courses/${courseId}/learning/attempt/${attempt.id}`;
        } catch (err: any) {
            messageApi.error(
                err instanceof Error ? err.message : 'Failed to start quiz'
            );
            setLoading(false);
            setOpen(false);
        }
    }

    const hasInProgressAttempt = !!existingAttemptId;
    const buttonLabel = hasInProgressAttempt ? 'Continue' : 'Start Quiz';

    const handleMainButtonClick = async () => {
        if (hasInProgressAttempt) {
            await handleConfirmStart();
            return;
        }
        setOpen(true);
    };

    return (
        <>
            {contextHolder}

            <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                loading={checkingAttempt || loading}
                style={{ 
                    height: 50, 
                    paddingLeft: 40, 
                    paddingRight: 40, 
                    fontSize: 18,
                    borderRadius: 25,
                    boxShadow: '0 4px 14px 0 rgba(22, 119, 255, 0.39)'
                }}
                onClick={handleMainButtonClick}
            >
                {buttonLabel}
            </Button>

            <Modal
                open={open}
                title={hasInProgressAttempt ? "Continue quiz?" : "Ready to start?"}
                okText={hasInProgressAttempt ? "Continue" : "Start Quiz"}
                cancelText="Cancel"
                confirmLoading={loading}
                onOk={handleConfirmStart}
                onCancel={() => setOpen(false)}
                centered
            >
                <Paragraph>
                    {hasInProgressAttempt
                        ? 'You already have an in-progress attempt. Continue where you left off.'
                        : 'Once you start the quiz, the timer will begin immediately. Please ensure you have a stable internet connection.'}
                </Paragraph>
            </Modal>
        </>
    );
}
