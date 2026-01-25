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
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => {
                    if (categoriesError) {
                        message.error(categoriesError);
                        return;
                    }
                    setIsModalOpen(true);
                }}
                disabled={isLoadingCategories}
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