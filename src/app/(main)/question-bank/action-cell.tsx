'use client';

import { Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { QuestionType } from '@/service/questionbank.service';
import * as actions from '@/action/question-bank/questionBankActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateQuestionModal from '@/app/(main)/question-bank/create/create-question-modal';

export function ActionCell({ record, categories }: { record: QuestionType; categories: Record<string, any>[] }) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const handleEdit = async () => {
        try {
            const fullQuestionData = await actions.getQuestionById(record.id);
            setEditingRecord(fullQuestionData);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching question data:', error);
            message.error('Failed to load question details');
        }
    };

    const handleDelete = async () => {
        try {
            const response = await actions.deleteQuestion(record.id);
            if (response.success) {
                message.success('Question deleted successfully');
                router.refresh();
            } else {
                message.error(response.message || 'Failed to delete question');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            message.error('Failed to delete question');
        }
    };

    return (
        <>
            <Space size="middle">
                <EditOutlined
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                    onClick={handleEdit}
                    title="Edit"
                />
                <Popconfirm
                    title="Delete Question"
                    description="Are you sure you want to delete this question?"
                    onConfirm={handleDelete}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                >
                    <DeleteOutlined
                        style={{ cursor: 'pointer', color: '#ff4d4f' }}
                        title="Delete"
                    />
                </Popconfirm>
            </Space>
            
            <CreateQuestionModal
                isModalOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRecord(null);
                }}
                categories={categories}
                editingRecord={editingRecord}
                onSuccess={() => {
                    setIsModalOpen(false);
                    setEditingRecord(null);
                    router.refresh();
                }}
            />
        </>
    );
}
