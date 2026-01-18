'use client';

import { Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { QuestionType } from '@/service/questionbank.service';
import { ActionCell } from './action-cell';

// Utility function: Truncate text
const truncateText = (text: string, maxLength: number = 50): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Utility function: Format date DD/MM/YYYY
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Utility function: Map type to display text
const getTypeLabel = (type: string): string => {
    if (type === 'single_choice') return 'Single Choice';
    if (type === 'multiple_choice') return 'Multiple Choice';
    return type;
};

interface QuestionBankTableProps {
    questions: QuestionType[];
    currentPage: number;
    categories: Record<string, any>[];
}

export function QuestionBankTable({ questions, currentPage, categories }: QuestionBankTableProps) {
    const columns: TableProps<QuestionType>['columns'] = [
        {
            title: 'Nội dung',
            dataIndex: 'question_text',
            render: (text: string) => truncateText(text, 50),
            width: 300,
        },
        {
            title: 'Chủ đề',
            dataIndex: 'name',
            render: (name: string) => <Tag color="blue">{name}</Tag>,
        },
        {
            title: 'Thể loại',
            dataIndex: 'type',
            render: (type: string) => {
                const label = getTypeLabel(type);
                const color = type === 'multiple_choice' ? 'blue' : 'purple';
                return <Tag color={color}>{label}</Tag>;
            },
        },
                {
            title: 'Giải thích',
            dataIndex: 'explanation',
            render: (text: string) => text ? truncateText(text, 60) : <span className="text-gray-400">-</span>,
            width: 250,

        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            render: (date: string) => formatDate(date),
            width: 120,
        },
        {
            title: 'Ngày cập nhật',
            dataIndex: 'updated_at',
            render: (date: string) => formatDate(date),
            width: 140,
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            render: (text, record) => <ActionCell record={record} categories={categories} />,
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={questions}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={false}
            locale={{ emptyText: 'Không tìm thấy dữ liệu' }}
        />
    );
}
