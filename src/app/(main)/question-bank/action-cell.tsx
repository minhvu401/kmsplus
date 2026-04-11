'use client';

import { Space, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { QuestionType } from '@/service/questionbank.service';
import * as actions from '@/action/question-bank/questionBankActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateQuestionModal from '@/app/(main)/question-bank/create/create-question-modal';

export function ActionCell({
    record,
    categories,
    canManage = true,
    disabledReason = '',
}: {
    record: QuestionType;
    categories: Record<string, any>[];
    canManage?: boolean;
    disabledReason?: string;
}) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const handleEdit = async () => {
        if (!canManage) return;
        try {
            const fullQuestionData = await actions.getQuestionById(record.id);
            setEditingRecord(fullQuestionData);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching question data:', error);
        }
    };

    const handleDelete = async () => {
        if (!canManage) return;
        try {
            const response = await actions.deleteQuestion(record.id);
            if (response.success) {
                router.refresh();
            } else {
                console.error(response.message || 'Failed to delete question');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    return (
        <>
            <Space size="middle">
                <Tooltip title={canManage ? 'Edit' : disabledReason}>
                    <EditOutlined
                        style={{
                            cursor: canManage ? 'pointer' : 'not-allowed',
                            color: canManage ? '#1890ff' : '#9ca3af',
                        }}
                        onClick={canManage ? handleEdit : undefined}
                        title={canManage ? 'Edit' : disabledReason}
                    />
                </Tooltip>
                <Popconfirm
                    title="Delete Question"
                    description="Are you sure you want to delete this question?"
                    onConfirm={handleDelete}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                    disabled={!canManage}
                >
                    <Tooltip title={canManage ? 'Delete' : disabledReason}>
                        <DeleteOutlined
                            style={{
                                cursor: canManage ? 'pointer' : 'not-allowed',
                                color: canManage ? '#ff4d4f' : '#9ca3af',
                            }}
                            title={canManage ? 'Delete' : disabledReason}
                        />
                    </Tooltip>
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
