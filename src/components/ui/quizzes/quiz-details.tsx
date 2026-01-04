'use client'

import { Quiz } from "@/service/quiz.service";
import { Card, Row, Col, Typography, Statistic, Space, Divider } from 'antd'
const { Title, Text } = Typography;
import { format } from 'date-fns'

export default function QuizDetails({ quiz }: { quiz: Quiz }) {
    const hasFrom = !!quiz.available_from
    const hasTo = !!quiz.available_to

    const formatDate = (date?: string | Date | null) => {
        if (!date) return null
        return format(new Date(date), 'dd MMM yyyy, HH:mm')
    }

    const availabilityAlignment =
        hasFrom && hasTo ? 'center' : 'center'


    return (
        <Space direction="vertical" size={16} style={{ width: '100%', textAlign: 'center' }}>
            {/* Title */}
            <Title level={3} style={{ color: "#1677ff", textAlign: "center", margin: 0 }}>
                {quiz.title}
            </Title>

            {/* Description */}
            {quiz.description && (
                <Text type="secondary">
                    {quiz.description}
                </Text>
            )}

            {/* Availability */}
            {(hasFrom || hasTo) && (
                <Row justify={availabilityAlignment}>
                    <Space>
                        {hasFrom && (
                            <Text type="secondary">
                                Available from <strong>{formatDate(quiz.available_from)}</strong>
                            </Text>
                        )}

                        {hasFrom && hasTo && <Text type="secondary">—</Text>}

                        {hasTo && (
                            <Text type="secondary">
                                Available to <strong>{formatDate(quiz.available_to)}</strong>
                            </Text>
                        )}
                    </Space>
                </Row>
            )}

            {/* Stats Rectangle */}
            <Card
                variant="outlined"
                style={{
                    width: '100%',
                    border: '1px solid #343333ff',
                    borderRadius: 8,
                }}
                styles={{
                    body: {
                        padding: 32,
                    },
                }}
            // style={{
            //     width: '100%',
            //     border: '1px solid #343333ff',
            // }}
            // styles={{
            //     body: {
            //         padding: 0, // IMPORTANT
            //     },
            // }}
            >
                <Row align="middle" justify="center" style={{ textAlign: 'center' }}>
                    {/* Time Limit */}
                    <Col xs={24} sm={7}>
                        <Statistic
                            title="Time Limit"
                            value={quiz.time_limit_minutes ?? '—'}
                            suffix={quiz.time_limit_minutes ? 'min' : undefined}
                            valueStyle={{ fontSize: 24 }}
                        />
                    </Col>

                    {/* Divider */}
                    <Col xs={0} sm={1}>
                        <Divider
                            type="vertical"
                            style={{
                                height: 80,
                                borderColor: '#343333ff',
                                borderWidth: 1,
                            }}
                        />
                    </Col>

                    {/* Passing Score */}
                    <Col xs={24} sm={7}>
                        <Statistic
                            title="Passing Score"
                            value={quiz.passing_score ?? '—'}
                            suffix={quiz.passing_score ? '%' : undefined}
                            valueStyle={{ fontSize: 24 }}
                        />
                    </Col>

                    <Col xs={0} sm={1}>
                        <Divider
                            type="vertical"
                            style={{
                                height: 80,
                                borderColor: '#343333ff',
                                borderWidth: 1,
                            }}
                        />
                    </Col>

                    {/* Attempt Limit */}
                    <Col xs={24} sm={8}>
                        <Statistic
                            title="Attempt Limit"
                            value={quiz.max_attempts ?? '—'}
                            valueStyle={{ fontSize: 24 }}
                        />
                    </Col>
                </Row>
            </Card>
        </Space>
    )
}
