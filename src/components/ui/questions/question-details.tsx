'use client'

import { useEffect, useState, startTransition, useActionState } from "react";
import { Flex, Typography, Tag, Divider, Dropdown, Button, message, Modal, Form, Input, Select, Avatar } from "antd";
import RichTextEditor from "@/components/ui/RichTextEditor";
const { Title, Text } = Typography;

// Wrapper component for Ant Design Form integration
interface ContentEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

function ContentEditor({ value = '', onChange, placeholder }: ContentEditorProps) {
  return (
    <RichTextEditor
      value={value}
      onChange={(val) => onChange?.(val)}
      placeholder={placeholder}
    />
  );
}

// Custom styles for placeholder text to match Rich Text Editor styling
const placeholderStyles = `
  .placeholder-styled::placeholder {
    color: #4b5563 !important;
    font-style: italic !important;
    font-size: 14px !important;
  }
`;
import {
    EllipsisOutlined,
    EditOutlined,
    DeleteOutlined,
    ShareAltOutlined,
    LockOutlined,
    UnlockOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Question } from "@/service/question.service";
import { Category } from "@/service/question.service";
import { deleteQuestion, closeQuestion, openQuestion, updateQuestion, State } from "@/action/question/questionActions";
import useLanguageStore from "@/store/useLanguageStore";

const HCM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const formatHcmDate = (date: Date, language: "vi" | "en") => {
    return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
        timeZone: HCM_TIME_ZONE,
    });
};

export default function QuestionDetails({ userId, isSystemAdmin, question, categories }: { userId: number; isSystemAdmin: boolean; question: Question; categories: Category[] }) {
    const { language } = useLanguageStore();
    const isVi = language === "vi";
    const text = isVi
        ? {
            by: "bởi",
            closed: "Đã đóng",
            open: "Đang mở",
            askedOn: "đặt vào",
            closedOn: "đóng vào",
            updatedOn: "cập nhật lần cuối vào",
        }
        : {
            by: "by",
            closed: "Closed",
            open: "Open",
            askedOn: "asked on",
            closedOn: "closed on",
            updatedOn: "last updated on",
        };

    const createdAt = new Date(question.created_at);
    const updatedAt = new Date(question.updated_at);

    return (
        <Flex
            vertical
            align="center"
            gap={14}
            style={{
                marginTop: 24,
                width: "100%",
                maxWidth: 980,
                marginInline: "auto",
                paddingInline: 8,
            }}
        >
            {/* Title and Menu */}
            <Flex
                align="flex-start"
                justify="space-between"
                style={{ width: "100%", marginBottom: 14, gap: 16 }}
            >
                <Flex style={{ flex: 1, minWidth: 0 }}>
                    <Title
                        level={3}
                        ellipsis={{ rows: 2, tooltip: question.title }}
                        style={{ color: "#111827", textAlign: "left", margin: 0 }}
                    >
                        {question.title}
                    </Title>
                </Flex>

                <Flex style={{ flex: "none" }}>
                    <QuestionMenu userId={userId} isSystemAdmin={isSystemAdmin} question={question} categories={categories} />
                </Flex>
            </Flex>

            {/* Author & Category Info */}
            <Flex align="center" justify="flex-start" gap={12} style={{ color: "#374151", width: "100%", marginBottom: 12 }}>
                <Flex align="center" gap={4}>
                    <Text>{text.by}</Text>
                    <Avatar
                        size="small"
                        src={question.user_avatar || undefined}
                        icon={!question.user_avatar ? <UserOutlined /> : undefined}
                    />
                    <Text strong>{question.user_name}</Text>
                </Flex>
                <Tag color="blue">{question.category_name}</Tag>
                <Tag color={question.is_closed ? "red" : "green"}>
                    {question.is_closed ? text.closed : text.open}
                </Tag>
            </Flex>

            {/* Metadata Row */}
            <Flex
                align="center"
                justify="flex-start"
                gap={20}
                wrap="wrap"
                style={{ color: "#4b5563", fontWeight: 500, width: "100%" }}
            >
                <Text>{text.askedOn} {formatHcmDate(createdAt, language)}</Text>
                {question.is_closed ? (
                    <Text>{text.closedOn} {formatHcmDate(updatedAt, language)}</Text>
                ) : (
                    <Text>{text.updatedOn} {formatHcmDate(updatedAt, language)}</Text>
                )}
            </Flex>

            {/* Content */}
            <Flex justify="flex-start" style={{ width: "100%", marginTop: 16, flexDirection: "column", gap: 12 }}>
                <div 
                    className="prose prose-sm md:prose-base max-w-none text-gray-700"
                    style={{ fontSize: 16, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: question.content }}
                />
            </Flex>
            <Divider style={{ borderColor: "#d1d5db", width: "100%" }} />
        </Flex>
    );
}

export function QuestionMenu({
    userId,
    isSystemAdmin,
    question,
    categories,
}: {
    userId: number;
    isSystemAdmin: boolean;
    question: Question;
    categories: Category[];
}) {
    const { language } = useLanguageStore();
    const isVi = language === "vi";
    const text = isVi
        ? {
            linkCopied: "Đã sao chép liên kết câu hỏi!",
            copyFailed: "Sao chép liên kết thất bại.",
            editQuestion: "Chỉnh sửa câu hỏi",
            deleteQuestion: "Xóa câu hỏi",
            openQuestion: "Mở câu hỏi",
            closeQuestion: "Đóng câu hỏi",
            shareQuestion: "Chia sẻ câu hỏi",
            confirmation: "Xác nhận",
            cancel: "Hủy",
            delete: "Xóa",
            confirm: "Xác nhận",
            deletePostTitle: "Bạn có chắc chắn muốn xóa bài viết này?",
            deletePostDesc: "Bài viết của bạn sẽ bị xóa vĩnh viễn.",
            closePostTitle: "Bạn có chắc chắn muốn đóng bài viết này?",
            closePostDesc: "Bài viết của bạn sẽ bị đóng. Không cho phép bình luận mới.",
            openPostTitle: "Bạn có chắc chắn muốn mở bài viết này?",
            openPostDesc: "Bài viết của bạn sẽ được mở. Bình luận mới sẽ được cho phép.",
            editTitle: "Chỉnh sửa câu hỏi",
            submit: "Gửi",
            titleLabel: "Tiêu đề:",
            titleRequired: "Vui lòng nhập tiêu đề",
            titleMin: "Tiêu đề phải có ít nhất 3 ký tự",
            titlePlaceholder: "Viết tiêu đề câu hỏi của bạn...",
            charLimit: "Giới hạn ký tự",
            contentLabel: "Nội dung:",
            contentRequired: "Vui lòng cung cấp thêm chi tiết",
            contentMin: "Nội dung phải có ít nhất 10 ký tự",
            contentPlaceholder: "Cung cấp thêm chi tiết về câu hỏi của bạn...",
            categoryLabel: "Danh mục:",
            categoryRequired: "Vui lòng chọn danh mục",
            categoryPlaceholder: "Chọn danh mục",
            leave: "Rời đi",
            leaveTitle: "Bạn có chắc chắn muốn rời khỏi cửa sổ này?",
            leaveDesc: "Phần chỉnh sửa của bạn sẽ không được lưu.",
            submitEditTitle: "Bạn có chắc chắn muốn chỉnh sửa câu hỏi này?",
        }
        : {
            linkCopied: "Question link copied to clipboard!",
            copyFailed: "Failed to copy link.",
            editQuestion: "Edit question",
            deleteQuestion: "Delete question",
            openQuestion: "Open question",
            closeQuestion: "Close question",
            shareQuestion: "Share question",
            confirmation: "Confirmation",
            cancel: "Cancel",
            delete: "Delete",
            confirm: "Confirm",
            deletePostTitle: "Are you sure you want to delete this post?",
            deletePostDesc: "Your post will be permanently deleted.",
            closePostTitle: "Are you sure you want to close this post?",
            closePostDesc: "Your post will be closed. No new comments will be allowed.",
            openPostTitle: "Are you sure you want to open this post?",
            openPostDesc: "Your post will be opened. New comments will be allowed.",
            editTitle: "Edit Question",
            submit: "Submit",
            titleLabel: "Title:",
            titleRequired: "Please enter a title",
            titleMin: "Title must be at least 3 characters",
            titlePlaceholder: "Write your question title here...",
            charLimit: "Character limit",
            contentLabel: "Content:",
            contentRequired: "Please provide more details",
            contentMin: "Content must be at least 10 characters",
            contentPlaceholder: "Provide more details about your question...",
            categoryLabel: "Category:",
            categoryRequired: "Please select a category",
            categoryPlaceholder: "Select category",
            leave: "Leave",
            leaveTitle: "Are you sure you want to leave this pop-up?",
            leaveDesc: "Your edit will not be saved.",
            submitEditTitle: "Are you sure you want to edit this question?",
        };


    const [form] = Form.useForm();
    // Visibility state for the dropdown menu
    const [open, setOpen] = useState(false);
    const [isUpdateVisible, setUpdateVisible] = useState(false);
    const [isSubmitVisible, setSubmitVisible] = useState(false);
    const [isLeaveVisible, setLeaveVisible] = useState(false);
    const [titleCount, setTitleCount] = useState(0);
    const [contentCount, setContentCount] = useState(0);
    // Visibility state for the delete confirmation modal
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    // Visibility state for the close confirmation modal
    const [isCloseVisible, setCloseVisible] = useState(false);
    // Visibility state for the open confirmation modal
    const [isOpenVisible, setOpenVisible] = useState(false);

    // Message API for notifications
    const [messageApi, contextHolder] = message.useMessage();
    const initialState: State = { message: null, errors: {} };
    const [state, updateQuestionAction] = useActionState(updateQuestion, initialState);

    const status = question.is_closed ? 'closed' : 'open';
    const titleError = state?.errors?.title?.[0]
    const contentError = state?.errors?.content?.[0]
    const categoryError = state?.errors?.category_id?.[0]

    const handleShare = async () => {
        const url = `${window.location.origin}/questions/${question.id}`;
        try {
            await navigator.clipboard.writeText(url);
            messageApi.success(text.linkCopied);
        } catch {
            messageApi.error(text.copyFailed);
        }
        setOpen(false);
    };

    const items = [
        ...((Number(userId) === Number(question.user_id) || isSystemAdmin)
            ? [
                {
                    key: 'edit',
                    label: (
                        <span
                            onClick={() => {
                                setUpdateVisible(true);
                                setOpen(false);
                            }}
                        >
                            <EditOutlined /> {text.editQuestion}
                        </span>
                    ),
                },
                {
                    key: 'delete',
                    label: (
                        <span
                            onClick={() => {
                                setDeleteVisible(true);
                                setOpen(false);
                            }}
                        >
                            <DeleteOutlined /> {text.deleteQuestion}
                        </span>
                    ),
                },
                status === 'closed'
                    ? {
                        key: 'open',
                        label: (
                            <span
                                onClick={() => {
                                    setOpenVisible(true);
                                    setOpen(false);
                                }}
                            >
                                <UnlockOutlined /> {text.openQuestion}
                            </span>
                        ),
                    }
                    : {
                        key: 'close',
                        label: (
                            <span
                                onClick={() => {
                                    setCloseVisible(true);
                                    setOpen(false);
                                }}
                            >
                                <LockOutlined /> {text.closeQuestion}
                            </span>
                        ),
                    },
            ]
            : []),
        {
            key: 'share',
            label: (
                <span onClick={handleShare}>
                    <ShareAltOutlined /> {text.shareQuestion}
                </span>
            ),
        },
    ];

    const handleDelete = () => {
        setDeleteVisible(false);

        startTransition(() => {
            deleteQuestion(question.id.toString());
        });
    };

    const handleClose = () => {
        setCloseVisible(false);

        startTransition(() => {
            closeQuestion(question.id.toString());
        });
    };

    const handleOpen = () => {
        setOpenVisible(false);

        startTransition(() => {
            openQuestion(question.id.toString());
        });
    };

    const handleLeave = () => {
        setLeaveVisible(false);
        setUpdateVisible(false);
    };

    const handleSubmit = () => {
        setSubmitVisible(false);
        form.submit();
    };

    useEffect(() => {
        if (!isUpdateVisible) return;

        const initialTitle = question.title ?? "";
        const initialContent = question.content ?? "";
        const initialCategoryId = (question.category_id ?? undefined) as number | undefined;

        form.setFieldsValue({
            title: initialTitle,
            content: initialContent,
            category_id: initialCategoryId,
        });

        setTitleCount(initialTitle.length);
        // Strip HTML tags to count plain text characters
        const plainText = initialContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        setContentCount(plainText.length);
    }, [isUpdateVisible, form, question]);

    return (
        <>
            {contextHolder} {/* 👈 This mounts the message context */}
            <Dropdown
                menu={{ items }}
                trigger={['click']}
                placement="bottomRight"
                open={open}
                onOpenChange={setOpen}
            >
                <Button
                    type="text"
                    icon={<EllipsisOutlined style={{ fontSize: 20 }} />}
                />
            </Dropdown>

            <Modal
                title={text.confirmation}
                centered
                open={isDeleteVisible}
                onCancel={() => setDeleteVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteVisible(false)}>
                        {text.cancel}
                    </Button>,
                    <Button key="delete" danger onClick={handleDelete}>
                        {text.delete}
                    </Button>,
                ]}
            >
                <Text>{text.deletePostTitle}</Text>
                <br />
                <Text type="secondary">{text.deletePostDesc}</Text>
            </Modal>

            <Modal
                title={text.confirmation}
                centered
                open={isCloseVisible}
                onCancel={() => setCloseVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setCloseVisible(false)}>
                        {text.cancel}
                    </Button>,
                    <Button key="close" danger onClick={handleClose}>
                        {text.confirm}
                    </Button>,
                ]}
            >
                <Text>{text.closePostTitle}</Text>
                <br />
                <Text type="secondary">{text.closePostDesc}</Text>
            </Modal>

            <Modal
                title={text.confirmation}
                centered
                open={isOpenVisible}
                onCancel={() => setOpenVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setOpenVisible(false)}>
                        {text.cancel}
                    </Button>,
                    <Button key="open" danger onClick={handleOpen}>
                        {text.confirm}
                    </Button>,
                ]}
            >
                <Text>{text.openPostTitle}</Text>
                <br />
                <Text type="secondary">{text.openPostDesc}</Text>
            </Modal>

            <Modal
                title={text.editTitle}
                centered
                open={isUpdateVisible}
                onCancel={() => setLeaveVisible(true)}
                onOk={() => setSubmitVisible(true)}
                okText={text.submit}
                width={700}
                destroyOnHidden
                afterClose={() => {
                    form.resetFields();
                    setTitleCount(0);
                    setContentCount(0);
                }}
            >
                <style>{placeholderStyles}</style>
                {state?.message ? (
                    <Text type="danger" style={{ display: "block", marginBottom: 12 }}>
                        {state.message}
                    </Text>
                ) : null}
                <Form
                    form={form}
                    layout="vertical"
                    style={{ width: '100%' }}
                    onFinish={async (values) => {
                        const formData = new FormData();
                        formData.append('title', values.title);
                        formData.append('content', values.content);
                        formData.append('category_id', values.category_id);
                        formData.append('id', question.id.toString());

                        startTransition(() => {
                            updateQuestionAction(formData);
                        });
                    }}
                >
                    <Form.Item
                        label={<Text strong>{text.titleLabel}</Text>}
                        name="title"
                        help={titleError}
                        validateStatus={titleError ? "error" : undefined}
                        rules={[{ required: true, message: text.titleRequired },
                        { min: 3, message: text.titleMin }
                        ]}
                    >
                        <Input
                            placeholder={text.titlePlaceholder}
                            maxLength={150}
                            onChange={(e) => setTitleCount(e.target.value.length)}
                            style={{ height: 40 }}
                            className="placeholder-styled"
                        />
                    </Form.Item>
                    <Text type="secondary">{text.charLimit} {titleCount} / 150</Text>

                    <Divider style={{ margin: '8px 0 16px' }} />

                    <Form.Item
                        label={<Text strong>{text.contentLabel}</Text>}
                        name="content"
                        help={contentError}
                        validateStatus={contentError ? "error" : undefined}
                        getValueFromEvent={(val: string) => {
                            // Strip HTML tags to count plain text characters
                            const plainText = val ? val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
                            setContentCount(plainText.length);
                            return val;
                        }}
                        rules={[{ required: true, message: text.contentRequired },
                        {
                            validator: (_, value) => {
                                // Only validate length if user has entered content
                                if (!value) {
                                    return Promise.resolve(); // Let required rule handle empty case
                                }
                                // Strip HTML tags to get plain text for validation
                                const plainText = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                                if (plainText.length > 0 && plainText.length < 10) {
                                    return Promise.reject(text.contentMin);
                                }
                                return Promise.resolve();
                            }
                        }
                        ]}
                    >
                        <ContentEditor placeholder={text.contentPlaceholder} />
                    </Form.Item>
                    <Text type="secondary">{text.charLimit} {contentCount} / 3000</Text>

                    <Divider style={{ margin: '8px 0 16px' }} />

                    <Form.Item
                        label={<Text strong>{text.categoryLabel}</Text>}
                        name="category_id"
                        help={categoryError}
                        validateStatus={categoryError ? "error" : undefined}
                        rules={[{ required: true, message: text.categoryRequired }]}
                    >
                        <Select
                            placeholder={<span style={{ color: '#4b5563', fontStyle: 'italic', fontSize: '14px' }}>{text.categoryPlaceholder}</span>}
                            options={categories.map((cat) => ({
                                label: cat.name,
                                value: Number(cat.id),
                            }))}
                            allowClear
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={text.confirmation}
                centered
                open={isLeaveVisible}
                onCancel={() => setLeaveVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setLeaveVisible(false)}>
                        {text.cancel}
                    </Button>,
                    <Button key="leave" danger onClick={handleLeave}>
                        {text.leave}
                    </Button>,
                ]}
            >
                <Text>{text.leaveTitle}</Text>
                <br />
                <Text type="secondary">{text.leaveDesc}</Text>
            </Modal>

            <Modal
                title={text.confirmation}
                centered
                open={isSubmitVisible}
                onCancel={() => setSubmitVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setSubmitVisible(false)}>
                        {text.cancel}
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSubmit}>
                        {text.submit}
                    </Button>,
                ]}
            >
                <Text>{text.submitEditTitle}</Text>
            </Modal>

        </>
    );
}
