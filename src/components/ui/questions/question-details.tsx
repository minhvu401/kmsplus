'use client'

import QuestionMenu from "@/components/ui/questions/question-menu";
import { Flex, Typography, Tag, Divider } from "antd";
const { Title, Text } = Typography;

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

export default function QuestionDetails({ question }: { question: Question }) {
    const userId = 1; // Replace with actual user ID retrieval logic
    const createdAt = new Date(question.created_at);
    const updatedAt = new Date(question.updated_at);

    return (
        <Flex vertical align="center" gap={12} style={{ marginTop: 24 }}>
            {/* Title and Menu */}
            <Flex
                align="center"
                justify="center"
                style={{ position: "relative", width: "100%", marginBottom: 12 }}
            >
                <Title level={3} style={{ color: "#1677ff", textAlign: "center", margin: 0 }}>
                    {question.title}
                </Title>

                <div style={{ position: "absolute", right: 0, top: 0 }}>
                    <QuestionMenu
                        userId={userId}
                        posterId={question.user_id}
                        postId={question.id}
                        status={question.is_closed ? "closed" : "open"}
                    />
                </div>
            </Flex>

            {/* Author & Category Info */}
            <Flex align="center" justify="center" gap={12} style={{ color: "#374151" }}>
                <Text strong>by {question.user_name}</Text>
                <Tag color="blue">{question.category_name}</Tag>
                <Tag color={question.is_closed ? "red" : "green"}>
                    {question.is_closed ? "Closed" : "Open"}
                </Tag>
            </Flex>

            {/* Metadata Row */}
            <Flex align="center" justify="center" gap={48} style={{ color: "#4b5563", fontWeight: 500 }}>
                <Text>asked on {createdAt.toLocaleDateString()}</Text>
                {question.is_closed ? (
                    <Text>closed on {updatedAt.toLocaleDateString()}</Text>
                ) : (
                    <Text>last updated on {updatedAt.toLocaleDateString()}</Text>
                )}
            </Flex>

            <Divider style={{ borderColor: "#d1d5db", width: "100%" }} />

            {/* Content */}
            <Flex justify="center" style={{ padding: "0 80px" }}>
                <Text style={{ color: "#374151", fontSize: 18, whiteSpace: "pre-wrap" }}>
                    {question.content}
                </Text>
            </Flex>
            <Divider style={{ borderColor: "#d1d5db", width: "100%" }} />
        </Flex>
    );
}