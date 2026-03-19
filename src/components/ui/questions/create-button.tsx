"use client"

import { useState, useActionState, startTransition } from "react"
import { Button, Form, Modal, Typography, Input, Select, Divider } from "antd"
import { EditOutlined } from "@ant-design/icons"
import { State, createQuestion } from '@/action/question/questionActions';
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Text } = Typography;

// Wrapper component for Ant Design Form integration
// Form.Item automatically injects value and onChange props
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


export function CreateQuestion({
  categories,
  userId,
  returnTo,
  isFullWidth = false,
}: {
  categories: { id: number; name: string }[];
  userId: number;
  returnTo?: string;
  isFullWidth?: boolean;
}) {

  const [form] = Form.useForm();
  const [isCreateVisible, setCreateVisible] = useState(false);
  const [isLeaveVisible, setLeaveVisible] = useState(false);
  const [isSubmitVisible, setSubmitVisible] = useState(false);
  const [titleCount, setTitleCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);

  const initialState: State = { message: null, errors: {} };
  const [state, createQuestionAction] = useActionState(createQuestion, initialState);

  const titleError = state?.errors?.title?.[0]
  const contentError = state?.errors?.content?.[0]
  const categoryError = state?.errors?.category_id?.[0]

  const handleLeave = () => {
    setLeaveVisible(false);
    setCreateVisible(false);
  };

  const handleSubmit = () => {
    setSubmitVisible(false);
    form.submit();
  };

  return (
    <>
      <Button
        size={isFullWidth ? 'large' : 'middle'}
        style={{
          background: '#ffffff',
          borderColor: '#1e40af',
          borderWidth: '1.5px',
          borderRadius: '0.375rem',
          color: '#1e40af',
          fontSize: isFullWidth ? '15px' : '12px',
          fontWeight: isFullWidth ? 700 : 500,
          height: isFullWidth ? '52px' : '36px',
          paddingInline: isFullWidth ? '28px' : '14px',
          width: isFullWidth ? '100%' : 'auto',
          boxShadow: '0 2px 8px rgba(30, 64, 175, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          whiteSpace: 'nowrap',
        }}
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
        aria-label="Ask Question"
        onClick={() => setCreateVisible(true)}
      >
        <EditOutlined style={{ marginRight: isFullWidth ? '8px' : '5px', fontSize: isFullWidth ? '14px' : '12px' }} />
        <span>{isFullWidth ? 'Ask Question - Share Your Knowledge' : 'Ask A Question'}</span>
      </Button>

      <Modal
        title="Ask Question"
        centered
        open={isCreateVisible}
        onCancel={() => setLeaveVisible(true)}
        onOk={() => setSubmitVisible(true)}
        okText="Submit"
        width={700}
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
            formData.append('user_id', String(userId));
            formData.append('title', values.title);
            formData.append('content', values.content);
            formData.append('category_id', values.category_id);
            if (returnTo) {
              formData.append('returnTo', returnTo);
            }

            startTransition(() => {
              createQuestionAction(formData);
            });
          }}
        >
          <Form.Item
            label={<Text strong>Title:</Text>}
            name="title"
            help={titleError}
            validateStatus={titleError ? "error" : undefined}
            rules={[{ required: true, message: 'Please enter a title' },
            { min: 3, message: 'Title must be at least 3 characters' }
            ]}
          >
            <Input
              placeholder="Write your question title here..."
              maxLength={150}
              onChange={(e) => setTitleCount(e.target.value.length)}
              style={{ height: 40 }}
              className="placeholder-styled"
            />
          </Form.Item>
          <Text type="secondary">Character limit {titleCount} / 150</Text>

          <Divider style={{ margin: '8px 0 16px' }} />

          <Form.Item
            label={<Text strong>Content:</Text>}
            name="content"
            help={contentError}
            validateStatus={contentError ? "error" : undefined}
            getValueFromEvent={(val: string) => {
              // Strip HTML tags to count plain text characters
              const plainText = val ? val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
              setContentCount(plainText.length);
              return val;
            }}
            rules={[{ required: true, message: 'Please provide more details' },
            {
              validator: (_, value) => {
                // Only validate length if user has entered content
                if (!value) {
                  return Promise.resolve(); // Let required rule handle empty case
                }
                // Strip HTML tags to get plain text for validation
                const plainText = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                if (plainText.length > 0 && plainText.length < 10) {
                  return Promise.reject('Content must be at least 10 characters');
                }
                return Promise.resolve();
              }
            }
            ]}
          >
            <ContentEditor placeholder="Provide more details about your question..." />
          </Form.Item>
          <Text type="secondary">Character limit {contentCount} / 3000</Text>

          <Divider style={{ margin: '8px 0 16px' }} />

          <Form.Item
            label={<Text strong>Category:</Text>}
            name="category_id"
            help={categoryError}
            validateStatus={categoryError ? "error" : undefined}
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              placeholder={<span style={{ color: '#4b5563', fontStyle: 'italic', fontSize: '14px' }}>Select category</span>}
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              allowClear
              size="large"
            />
          </Form.Item>
        </Form>

      </Modal>

      <Modal
        title="Confirmation"
        centered
        open={isLeaveVisible}
        onCancel={() => setLeaveVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setLeaveVisible(false)}>
            Cancel
          </Button>,
          <Button key="leave" danger onClick={handleLeave}>
            Leave
          </Button>,
        ]}
      >
        <Text>Are you sure you want to leave this pop-up?</Text>
        <br />
        <Text type="secondary">Your question will not be saved.</Text>
      </Modal>

      <Modal
        title="Confirmation"
        centered
        open={isSubmitVisible}
        onCancel={() => setSubmitVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSubmitVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Submit
          </Button>,
        ]}
      >
        <Text>Are you sure you want to ask this question?</Text>
      </Modal>
    </>
  )
}