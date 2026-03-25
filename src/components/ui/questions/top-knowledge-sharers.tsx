'use client';

import { Flex, Typography, Avatar } from 'antd';
import { TrophyOutlined, UserOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface TopSharer {
    id: number;
    name: string;
    score: number;
    avatar_url?: string | null;
}

interface TopKnowledgeSharersProps {
    topSharers?: TopSharer[];
}

export default function TopKnowledgeSharers({ topSharers = [] }: TopKnowledgeSharersProps) {
    // Use provided data, no fallback to mock data
    const sharers: TopSharer[] = topSharers;

    const getMedalColor = (index: number) => {
        if (index === 0) return '#fbbf24'; // Gold
        if (index === 1) return '#d1d5db'; // Silver
        if (index === 2) return '#d97706'; // Bronze
        return '#2563eb'; // Blue for others
    };

    const getMedalEmoji = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}`;
    };

    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                padding: '24px',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                border: '1px solid #f3f4f6',
                height: 'fit-content',
                position: 'sticky',
                top: '20px',
            }}
        >
            {/* Header */}
            <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
                <TrophyOutlined style={{ fontSize: '20px', color: '#2563eb' }} />
                <Title level={4} style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    Top Knowledge Sharers
                </Title>
            </Flex>

            {/* Sharers List */}
            <Flex vertical gap={12}>
                {sharers.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                        No contributors yet
                    </Text>
                ) : (
                    sharers.map((sharer, index) => (
                        <Flex
                            align="center"
                            gap={12}
                            key={sharer.id}
                            style={{
                                padding: '12px',
                                backgroundColor: index === 0 ? '#fef3c7' : '#f9fafb',
                                borderRadius: '0.375rem',
                                border: index === 0 ? '1px solid #fcd34d' : '1px solid #f3f4f6',
                                transition: 'all 0.2s ease',
                            }}
                            className="hover:shadow-sm hover:bg-blue-50 cursor-default"
                        >
                            {/* Medal/Rank */}
                            <div
                                style={{
                                    minWidth: '32px',
                                    height: '32px',
                                    backgroundColor: getMedalColor(index),
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                }}
                            >
                                {getMedalEmoji(index)}
                            </div>

                            <Avatar
                                size={32}
                                src={sharer.avatar_url || undefined}
                                icon={!sharer.avatar_url ? <UserOutlined /> : undefined}
                            />

                            {/* User Info */}
                            <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                    strong
                                    style={{
                                        fontSize: '13px',
                                        color: '#1f2937',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {sharer.name}
                                </Text>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: '12px',
                                    }}
                                >
                                    {sharer.score.toLocaleString()} points
                                </Text>
                            </Flex>
                        </Flex>
                    ))
                )}
            </Flex>

            {/* Footer Text */}
            <Text
                type="secondary"
                style={{
                    fontSize: '12px',
                    marginTop: 16,
                    display: 'block',
                    textAlign: 'center',
                }}
            >
                Points earned from answers and helpful contributions
            </Text>
        </div>
    );
}
