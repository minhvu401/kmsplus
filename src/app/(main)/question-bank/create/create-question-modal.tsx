"use client"

import { Modal, Form, Button, Radio, Checkbox, Input, Space, Select, message } from 'antd';
import React, { useState, useEffect } from 'react';
import * as actions from '@/action/question-bank/questionBankActions';
import { FullQuestionType, QuestionType } from '@/service/questionbank.service';

interface CreateQuestionModalProps {
    isModalOpen: boolean;
    onClose: () => void;
    categories: Record<string, any>[];
    editingRecord: FullQuestionType | null | undefined;
    onSuccess?: () => void;
}

const CreateQuestionModal = ({ isModalOpen, onClose, categories, editingRecord, onSuccess }: CreateQuestionModalProps) => {
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState<number | null>(null);
    const [correctIndexes, setCorrectIndexes] = useState<number[]>([]);
    const [questionType, setQuestionType] = useState('single_choice');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isFormTouched, setIsFormTouched] = useState(false);
    const [isLoadingEditRecord, setIsLoadingEditRecord] = useState(false);
    const [form] = Form.useForm();

    //Handler: Khi người dùng gõ chữ vào ô Input
    const handleOptionChange = (text: string, index: number) => {
        // Copy mảng state cũ
        const newOptions = [...options];
        // Cập nhật phần tử tại đúng index
        newOptions[index] = text;
        // Cập nhật state
        setOptions(newOptions);
    };

    //Handler: Khi người dùng đổi loại câu hỏi (Single ↔ Multiple)
    // Scenario 2: State Retention - giữ lại đáp án cũ khi chuyển type
    const handleQuestionTypeChange = (newType: string) => {
        setQuestionType(newType);
    };

    // useEffect để xử lý state conversion khi questionType thay đổi
    // Chỉ chạy khi user thay đổi type, KHÔNG chạy khi load editingRecord
    useEffect(() => {
        if (isLoadingEditRecord) return; // Skip conversion khi đang load từ editingRecord

        if (questionType === 'single_choice') {
            // Chuyển từ Multiple → Single: lấy index đầu tiên từ correctIndexes
            if (correctIndexes.length > 0) {
                setCorrectIndex(correctIndexes[0]);
                setCorrectIndexes([]);
            }
        } else if (questionType === 'multiple_choice') {
            // Chuyển từ Single → Multiple: convert correctIndex thành mảng correctIndexes
            if (correctIndex !== null && correctIndex !== undefined) {
                setCorrectIndexes([correctIndex]);
                setCorrectIndex(null);
            }
        }
    }, [questionType, isLoadingEditRecord]);

    //Handler: Khi người dùng toggle đáp án (Single hoặc Multiple)
    const handleAnswerToggle = (index: number) => {
        if (questionType === 'single_choice') {
            // Single Choice: chỉ chọn 1 đáp án
            if (correctIndex === index) {
                setCorrectIndex(null);
            } else {
                setCorrectIndex(index);
            }
        } else if (questionType === 'multiple_choice') {
            // Multiple Choice: chọn nhiều đáp án
            const current = Array.isArray(correctIndexes) ? correctIndexes : [];
            if (current.includes(index)) {
                setCorrectIndexes(current.filter(i => i !== index));
            } else {
                setCorrectIndexes([...current, index]);
            }
        }
    };
    const handleCancel = () => {
        form.resetFields(); // Reset form fields
        setOptions(['', '', '', '']); // Reset options
        setCorrectIndex(null); // Reset correct answer for multiple choice
        setCorrectIndexes([]); // Reset correct answers for checkboxes
        setIsFormTouched(false); // Reset form touched state
        onClose(); // Close the modal
    };
    const handleSave = async (values: any) => {
        setIsFormTouched(true); // Mark form as touched

        // Trim question text
        const trimmedQuestionText = values.questionText?.trim() || '';

        // Validate options - all 4 must be filled
        if (options.some(opt => !opt.trim())) {
            message.error('Vui lòng nhập đầy đủ nội dung cho cả 4 đáp án');
            return;
        }

        // Validate correct answer
        if (questionType === 'single_choice' && correctIndex === null) {
            message.error('Vui lòng chọn 1 đáp án là đúng');
            return;
        }
        if (questionType === 'multiple_choice' && correctIndexes.length === 0) {
            message.error('Vui lòng chọn ít nhất 1 đáp án là đúng');
            return;
        }

        const finalData = {
            ...values,
            questionText: trimmedQuestionText, // Use trimmed version
            type: questionType,
            options: options.map(opt => opt.trim()), // Also trim options
            correctAnswer: questionType === 'single_choice' ? correctIndex : correctIndexes,
            explanation: values.explanation?.trim() || null // Optional explanation
        };
        console.log('Final Data to Submit:', finalData);
        try {
            if (editingRecord) {
                //logic edit
                await actions.updateQuestionAction(editingRecord.id, finalData);
            } else {
                //logic create
                await actions.createQuestion(finalData);
            }
            form.resetFields(); // Reset form fields
            setOptions(['', '', '', '']);
            setCorrectIndex(null); // Reset correct answer for multiple choice
            setCorrectIndexes([]); // Reset correct answers for checkboxes
            setSelectedCategory(null); // Reset selected category
            setIsFormTouched(false); // Reset form touched state
            message.success(editingRecord ? 'Question updated successfully' : 'Question created successfully');
            onClose();
            onSuccess?.();  // ← GỌI CALLBACK
        }
        catch (error) {
            console.error("Lỗi khi lưu:", error);
            message.error('Failed to save question');
        }
    }
    useEffect(() => {
        if (editingRecord) { //nếu đang edit
            setIsLoadingEditRecord(true);
            form.setFieldsValue({ //đổ dữ liệu vào form
                questionText: editingRecord.question_text,
                categoryId: editingRecord.category_id,
                explanation: editingRecord.explanation || ''
            });
            setSelectedCategory(editingRecord.category_id);
            // đổ dữ liệu cho useState
            setQuestionType(editingRecord.type);
            
            // Parse options - handle both array and JSON string
            let optionsArray = ['', '', '', ''];
            if (editingRecord.options) {
                if (Array.isArray(editingRecord.options)) {
                    optionsArray = editingRecord.options;
                } else if (typeof editingRecord.options === 'string') {
                    try {
                        optionsArray = JSON.parse(editingRecord.options);
                    } catch (e) {
                        optionsArray = ['', '', '', ''];
                    }
                }
            }
            setOptions(optionsArray);
            // đổ đáp án đúng
            if (editingRecord.type === 'single_choice') {
                let correctIndexValue = null;
                if (typeof editingRecord.correct_answer === 'number') {
                    correctIndexValue = editingRecord.correct_answer;
                } else if (typeof editingRecord.correct_answer === 'string') {
                    try {
                        const parsed = JSON.parse(editingRecord.correct_answer);
                        correctIndexValue = typeof parsed === 'number' ? parsed : null;
                    } catch (e) {
                        correctIndexValue = null;
                    }
                }
                setCorrectIndex(correctIndexValue);
                setCorrectIndexes([]);
            } else if (editingRecord.type === 'multiple_choice') {
                let correctIndexesValue: number[] = [];
                if (Array.isArray(editingRecord.correct_answer)) {
                    correctIndexesValue = editingRecord.correct_answer;
                } else if (typeof editingRecord.correct_answer === 'string') {
                    try {
                        const parsed = JSON.parse(editingRecord.correct_answer);
                        correctIndexesValue = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        correctIndexesValue = [];
                    }
                }
                setCorrectIndex(null);
                setCorrectIndexes(correctIndexesValue);
            }
            setIsLoadingEditRecord(false);
        }
    }, [editingRecord, form]); //quan sát editingRecord và form

    return (
        <Modal
            title={editingRecord ? "Sửa câu hỏi" : "Tạo câu hỏi"}
            open={isModalOpen}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" onClick={() => form.submit()}>
                    {editingRecord ? "Cập nhật" : "Lưu"}
                </Button>,
            ]}
        >
            <Form
                form={form} //connect với form ở trên
                layout="vertical" //bố cục dọc
                onFinish={handleSave}>
                <Form.Item
                    name="questionText"
                    label="Câu hỏi"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập nội dung câu hỏi!'
                        },
                        {
                            min: 10,
                            message: 'Nội dung câu hỏi phải dài ít nhất 10 ký tự.'
                        },
                        {
                            max: 1000,
                            message: 'Nội dung câu hỏi không được vượt quá 1000 ký tự.'
                        },
                        {
                            validator: (_, value) => {
                                if (!value || value.trim().length === 0) {
                                    return Promise.reject('Nội dung câu hỏi không được để trống hoặc chỉ chứa khoảng trắng.');
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input.TextArea
                        placeholder='Nhập nội dung câu hỏi tại đây...'
                        className="mb-4"
                        autoSize={{ minRows: 3, maxRows: 8 }}
                        showCount
                        maxLength={1000}
                    />
                </Form.Item>
                <Radio.Group
                    value={questionType}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                    className="mb-4"
                >
                    <Radio.Button value="single_choice">Single Choice</Radio.Button>
                    <Radio.Button value="multiple_choice">Multiple Choice</Radio.Button>
                </Radio.Group>

                {/* Danh sách 4 options cho Single Choice (Radio) */}
                {questionType === 'single_choice' && (
                    <Form.Item
                        label="Các phương án trả lời"
                        required
                    >
                        <div className="flex flex-col space-y-2 mt-2">
                            {options.map((optionText, index) => {
                                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                                const isSelectedAnswer = correctIndex === index;

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 px-2 py-1 rounded ${isSelectedAnswer
                                                ? 'bg-green-50 border-l-4 border-green-500'
                                                : ''
                                            }`}
                                    >
                                        {/* Label A, B, C, D - clickable */}
                                        <label
                                            className="cursor-pointer font-semibold min-w-8 text-center text-gray-700 select-none"
                                            onClick={() => handleAnswerToggle(index)}
                                        >
                                            {optionLabel}
                                        </label>

                                        {/* Input field */}
                                        <Input
                                            value={optionText}
                                            onChange={(e) => handleOptionChange(e.target.value, index)}
                                            placeholder={`Nhập nội dung cho lựa chọn ${optionLabel}...`}
                                        />

                                        {/* Radio Button - clickable */}
                                        <Radio
                                            checked={isSelectedAnswer}
                                            onChange={() => handleAnswerToggle(index)}
                                            title={`Chọn ${optionLabel} là đáp án đúng`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {isFormTouched && options.some(opt => !opt.trim()) && (
                            <div className="text-red-500 text-sm mt-3">
                                Vui lòng nhập đầy đủ nội dung cho cả 4 đáp án
                            </div>
                        )}
                        {isFormTouched && correctIndex === null && (
                            <div className="text-red-500 text-sm mt-2">
                                Vui lòng chọn 1 đáp án là đúng
                            </div>
                        )}
                    </Form.Item>
                )}

                {/* Danh sách 4 options cho Multiple Choice (Checkbox) */}
                {questionType === 'multiple_choice' && (
                    <Form.Item label="Các phương án trả lời" required>
                        <div className="flex flex-col space-y-2 mt-2">
                            {options.map((optionText, index) => {
                                const optionLabel = String.fromCharCode(65 + index);
                                const isSelectedAnswer = correctIndexes.includes(index);

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 px-2 py-1 rounded ${isSelectedAnswer
                                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                                : ''
                                            }`}
                                    >
                                        <label
                                            className="cursor-pointer font-semibold min-w-8 text-center text-gray-700 select-none"
                                            onClick={() => handleAnswerToggle(index)}
                                        >
                                            {optionLabel}
                                        </label>

                                        <Input
                                            value={optionText}
                                            onChange={(e) => handleOptionChange(e.target.value, index)}
                                            placeholder={`Nhập nội dung cho lựa chọn ${optionLabel}...`}
                                        />

                                        <Checkbox
                                            checked={isSelectedAnswer}
                                            onChange={() => handleAnswerToggle(index)}
                                            title={`Chọn ${optionLabel} là 1 trong các đáp án đúng`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {isFormTouched && options.some(opt => !opt.trim()) && (
                            <div className="text-red-500 text-sm mt-3">
                                Vui lòng nhập đầy đủ nội dung cho cả 4 đáp án
                            </div>
                        )}
                        {isFormTouched && correctIndexes.length === 0 && (
                            <div className="text-red-500 text-sm mt-2">
                                Vui lòng chọn ít nhất 1 đáp án là đúng
                            </div>
                        )}
                    </Form.Item>
                )}
                <Form.Item
                    name="categoryId"
                    label="Chủ đề"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng chọn chủ đề câu hỏi'
                        }
                    ]}
                    style={{ marginTop: '16px' }}
                >
                    <Select
                        placeholder="Chọn chủ đề..."
                        style={{ width: '100%', marginTop: '16px' }}
                        onChange={(value) => setSelectedCategory(value)}
                        value={selectedCategory}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {categories && categories.length > 0 ? (
                            categories.map(category => (
                                <Select.Option key={category.id} value={category.id} label={category.name}>
                                    {category.name}
                                </Select.Option>
                            ))
                        ) : (
                            <Select.Option disabled>
                                Không có chủ đề nào
                            </Select.Option>
                        )}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="explanation"
                    label="Giải thích / Lời nhận xét"
                    rules={[
                        {
                            max: 2000,
                            message: 'Giải thích không được vượt quá 2000 ký tự.'
                        }
                    ]}
                >
                    <Input.TextArea
                        placeholder='Nhập giải thích hoặc lời nhận xét (tùy chọn)...'
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        showCount
                        maxLength={2000}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateQuestionModal;