'use client';

import { Flex, Typography } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import QuestionCard, { type Question } from './question-card';

const { Text } = Typography;

export type { Question } from './question-card';

export default function QuestionsList({ questions, noSearchResults }: { questions: Question[]; noSearchResults: boolean }) {
    
    if (!questions || questions.length === 0) {
        return (
            <Flex justify="center" align="center" style={{ padding: '60px 0', width: '100%' }}>
                <Flex vertical align="center" gap="middle">
                    <MessageOutlined style={{ fontSize: '48px', color: '#d1d5db' }} />
                    <Text type="secondary" style={{ fontSize: "15px" }}>
                        {noSearchResults ? "No results match your search." : "No questions found"}
                    </Text>
                </Flex>
            </Flex>
        );
    }
    
    return (
        <Flex vertical gap={12} style={{ width: '100%' }}>
            {questions.map((question) => (
                <QuestionCard key={question.id} question={question} />
            ))}
        </Flex>
    );
}
