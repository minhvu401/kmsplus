'use client';

import { Flex, Typography, Tag, Divider } from 'antd';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';

const { Text, Title } = Typography;

export type Question = {
    id: number
    user_id: number
    category_id: number | null
    title: string
    content: string
    view_count: number
    answer_count: number
    is_closed: boolean
    is_deleted: boolean
    deleted_at?: Date | null
    created_at: Date
    updated_at: Date
    user_name: string
    category_name: string
}

export default function QuestionsList({ questions }: { questions: Question[] }) {
    return (
        <Flex vertical gap="large">
            {questions.map((q) => (
                <Flex key={q.id} vertical gap="small">
                    {/* Top row: Title + counts */}
                    <Flex justify="space-between" align="flex-start">
                        <Flex vertical gap="medium" style={{ flex: 1 }}>
                            <Link href={`/questions/${q.id}`} className="hover:underline">
                                <Title
                                    level={4}
                                    style={{
                                        color: '#1677ff',
                                        marginBottom: 0,
                                        transition: 'text-decoration 0.2s ease',
                                    }}
                                >
                                    {q.title}
                                </Title>
                            </Link>

                            {/* Two-line text clamp */}
                            <Text
                                type="secondary"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                <p className="text-gray-600 line-clamp-2 whitespace-pre-wrap">
                                    {q.content}
                                </p>
                            </Text>
                        </Flex>

                        {/* Right side: Answer + view count */}
                        <Flex vertical align="flex-end" style={{ minWidth: 80 }}>
                            <Text strong>{q.answer_count} answers</Text>
                            <Text strong>{q.view_count} views</Text>
                        </Flex>
                    </Flex>

                    {/* Bottom row: tags + user info */}
                    <Flex justify="space-between" align="center">
                        <Flex gap={8}>
                            <Tag color="blue">{q.category_name}</Tag>
                            <Tag color={q.is_closed ? 'red' : 'green'}>
                                {q.is_closed ? 'Closed' : 'Open'}
                            </Tag>
                        </Flex>

                        <Text type="secondary" strong>
                            {q.user_name} asked{' '}
                            {formatDistanceToNowStrict(new Date(q.created_at), {
                                addSuffix: true,
                            })}
                        </Text>
                    </Flex>

                    <Divider style={{ margin: '12px 0' }} />
                </Flex>
            ))}
        </Flex>
    );
}
