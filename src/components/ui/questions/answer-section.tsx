'use client'

import { useState } from 'react';
import { Flex, Typography, Divider, Card, Avatar } from "antd";
import CreateAnswerForm from "@/components/forms/create-answer-form";
import { Answer } from "@/service/question.service";
import LockedAnswerBox from "./locked-answer-box";
import AnswerMenu from "./answer-menu";
import Pagination from "@/components/ui/questions/pagination";

const { Title, Text, Paragraph } = Typography;

export default function AnswerSection({
    questionId,
    answer_count,
    is_closed,
    answers,
    paginatedAnswers
}: {
    questionId: number,
    answer_count: number,
    is_closed: boolean,
    answers: Answer[],
    paginatedAnswers: Answer[],
}) {
    const userId = 1; // TEMP: Replace with actual user ID from session/context
    const totalPages = Math.ceil(Number(answers.length) / 5)

    return (
        <>
            <Flex vertical align="left" gap={12} style={{ marginTop: 6 }}>
                {/* Title and Sort Filter */}
                <Flex
                    align="left"
                    justify="left"
                    style={{ position: "relative", width: "100%", marginBottom: 12, marginLeft: 30 }}
                >
                    <Title level={4} style={{ color: "black", textAlign: "left", margin: 0 }}>
                        Answers ({answer_count})
                    </Title>

                    {/*  FUTURE SORT FILTER */}
                    {/* <div style={{ position: "absolute", right: 0, top: 0 }}>
                
                </div> */}
                </Flex>

                {/* Create Answer Form */}
                <Flex
                    align="center"
                    justify="center"
                    style={{ position: "relative", width: "100%", marginBottom: 5 }}
                >
                    {is_closed ? (
                        <LockedAnswerBox message='This question is closed. No new answers can be submitted.' />
                    ) : (
                        <CreateAnswerForm
                            userId={userId}
                            questionId={questionId}
                        />
                    )}
                </Flex>

                {/* Answer Section & Pagination */}
                <Flex vertical gap={8}>
                    {paginatedAnswers.length === 0 && (
                        <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                            No answers yet. Be the first to answer!
                        </Text>
                    )}

                    {paginatedAnswers.map((answer) => {
                        return (
                            <Card
                                key={answer.id}
                                style={{ width: "100%" }}
                                bodyStyle={{ padding: "16px 16px" }}
                            >
                                {/* Header */}
                                <Flex justify="space-between" align="center">
                                    <Flex align="center" gap={8}>
                                        <Avatar>
                                            {answer.user_name.charAt(0).toUpperCase()}
                                        </Avatar>

                                        <Text strong>
                                            {answer.user_name}
                                        </Text>
                                    </Flex>

                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {/* timestamp */}
                                    </Text>

                                    <Flex
                                        style={{
                                            opacity: Number(answer.user_id) === userId ? 1 : 0.3,
                                            pointerEvents: Number(answer.user_id) === userId ? 'auto' : 'none',
                                        }}
                                    >
                                        <AnswerMenu answerId={answer.id} questionId={questionId} />
                                    </Flex>
                                </Flex>

                                <Divider style={{ margin: "6px 0" }} />

                                {/* Answer content (indented & larger) */}
                                <Flex style={{ marginLeft: 40 }}>
                                    <Paragraph
                                        style={{
                                            marginBottom: 0,
                                            fontSize: 15,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {answer.content}
                                    </Paragraph>
                                </Flex>
                            </Card>
                        )
                    })}
                    <Flex justify="end" align="center" style={{ marginBottom: 24 }}>
                        <Pagination totalPages={totalPages} />
                    </Flex>
                </Flex>
            </Flex >
        </>
    );
}