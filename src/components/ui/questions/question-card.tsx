'use client';

import { Flex, Tag, Typography, Avatar } from 'antd';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { MessageOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

function stripHtml(html: string): string {
    return html
        .replace(/<\/p>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

export type Question = {
    id: number
    user_id: number
    category_id: number | null
    title: string
    content: string
    answer_count: number
    is_closed: boolean
    deleted_at?: Date | null
    created_at: Date
    updated_at: Date
    user_name: string
    category_name: string
}

interface QuestionCardProps {
    question: Question
}

export default function QuestionCard({ question: q }: QuestionCardProps) {
    const contentPreview = stripHtml(q.content).substring(0, 150);
    const truncated = stripHtml(q.content).length > 150;

    return (
        <Link href={`/questions/${q.id}`} className="block no-underline group">
            <div 
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md hover:border-blue-200 cursor-pointer"
            >
                {/* User Header */}
                <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                    <Avatar 
                        size={32} 
                        style={{ backgroundColor: '#2563eb', fontSize: '14px', fontWeight: 'bold' }}
                    >
                        {q.user_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Flex vertical gap={0} style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: '13px', color: '#1f2937' }}>
                            {q.user_name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            asked {formatDistanceToNowStrict(new Date(q.created_at), { addSuffix: true })}
                        </Text>
                    </Flex>
                </Flex>

                {/* Question Title */}
                <Title
                    level={4}
                    style={{
                        color: '#2563eb',
                        marginBottom: 12,
                        marginTop: 0,
                        fontSize: '18px',
                        fontWeight: 700,
                        lineHeight: '1.4',
                        transition: 'color 0.2s ease',
                    }}
                    className="group-hover:text-blue-700"
                >
                    {q.title}
                </Title>

                {/* Question Content Preview */}
                <Text
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '14px',
                        color: '#6b7280',
                        lineHeight: '1.6',
                        marginBottom: 12,
                    }}
                >
                    {contentPreview}
                    {truncated && <span style={{ color: '#2563eb', fontWeight: 500 }}> ...read more</span>}
                </Text>

                {/* Tags */}
                <Flex gap={8} style={{ marginBottom: 16 }}>
                    <Tag
                        style={{
                            fontSize: '12px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 12px',
                        }}
                    >
                        {q.category_name}
                    </Tag>
                    <Tag
                        style={{
                            fontSize: '12px',
                            backgroundColor: q.is_closed ? '#fee2e2' : '#dcfce7',
                            color: q.is_closed ? '#991b1b' : '#166534',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 12px',
                        }}
                    >
                        {q.is_closed ? 'Closed' : 'Open'}
                    </Tag>
                </Flex>

                {/* Engagement Stats - Right side */}
                <Flex justify="space-between" align="center">
                    <div />
                    <Flex gap={20} align="center">
                        {/* Answers */}
                        <Flex align="center" gap={6}>
                            <CheckCircleOutlined
                                style={{
                                    fontSize: '16px',
                                    color: '#2563eb',
                                    fontWeight: 'bold',
                                }}
                            />
                            <Flex vertical gap={0}>
                                <Text strong style={{ fontSize: '15px', color: '#1f2937' }}>
                                    {q.answer_count}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    {q.answer_count === 1 ? 'answer' : 'answers'}
                                </Text>
                            </Flex>
                        </Flex>

                        {/* Views - Placeholder */}
                        <Flex align="center" gap={6}>
                            <EyeOutlined
                                style={{
                                    fontSize: '16px',
                                    color: '#6b7280',
                                }}
                            />
                            <Flex vertical gap={0}>
                                <Text strong style={{ fontSize: '15px', color: '#1f2937' }}>
                                    {Math.floor(Math.random() * 500) + 100}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    views
                                </Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </div>
        </Link>
    );
}
