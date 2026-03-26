// src/app/(main)/question-bank/create/create-question-modal-wrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CreateQuestionModal from './create-question-modal';
import { useRouter } from 'next/navigation';
import * as actions from '@/action/question-bank/questionBankActions';

export default function CreateQuestionModalWrapper() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState<Record<string, any>[]>([]);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            setCategoriesError(null);
            try {
                const cats = await actions.getCategories();
                if (cats && cats.length > 0) {
                    setCategories(cats);
                } else {
                    setCategoriesError('Không có chủ đề nào trong hệ thống');
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                setCategoriesError('Lỗi tải danh sách chủ đề. Vui lòng thử lại.');
            } finally {
                setIsLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        router.refresh();
    };

    return (
        <>
            <Button
                style={{
                    background: '#ffffff',
                    borderColor: '#1e40af',
                    borderWidth: '1.5px',
                    borderRadius: '0.375rem',
                    color: '#1e40af',
                    fontSize: '12px',
                    fontWeight: 500,
                    height: '36px',
                    paddingInline: '14px',
                    boxShadow: '0 2px 8px rgba(30, 64, 175, 0.12)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}
                icon={<PlusOutlined />}
                onClick={() => {
                    if (categoriesError) {
                        message.error(categoriesError);
                        return;
                    }
                    setIsModalOpen(true);
                }}
                disabled={isLoadingCategories}
                onMouseEnter={(e) => {
                    const button = e.currentTarget as HTMLButtonElement;
                    button.style.background = '#f8fafc';
                    button.style.boxShadow = '0 8px 20px rgba(30, 64, 175, 0.2)';
                    button.style.borderColor = '#1e3a8a';
                }}
                onMouseLeave={(e) => {
                    const button = e.currentTarget as HTMLButtonElement;
                    button.style.background = '#ffffff';
                    button.style.boxShadow = '0 2px 8px rgba(30, 64, 175, 0.12)';
                    button.style.borderColor = '#1e40af';
                }}
            >
                {isLoadingCategories ? 'Đang tải...' : 'Tạo Câu Hỏi Mới'}
            </Button>
            {categoriesError && (
                <div className="mt-2 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
                    {categoriesError}
                </div>
            )}
            <CreateQuestionModal
                isModalOpen={isModalOpen}
                onClose={handleModalClose}
                categories={categories}
                editingRecord={undefined}
                onSuccess={handleSuccess}
            />
        </>
    );
}