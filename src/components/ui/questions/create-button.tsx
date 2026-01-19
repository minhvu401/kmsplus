"use client"

import { useState, useActionState, startTransition } from "react"
import { Button, Form, Modal, Typography, Input, Select, Divider } from "antd"
import { PlusCircleOutlined } from "@ant-design/icons"
import { State, createQuestion } from '@/action/question/questionActions';

const { Text } = Typography;
const { TextArea } = Input;

// import Link from "next/link"
// export function CreateQuestion() {
//   return (
//     <Link
//       href="/questions/create"
//       className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shadow-lg"
//       aria-label="Ask A Question"
//     >
//       <PlusCircleOutlined className="w-5 h-5" />
//       <span>Ask A Question</span>
//     </Link>
//   )
// }


export function CreateQuestion({
  categories,
  userId,
}: {
  categories: { id: number; name: string }[];
  userId: number;
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
        className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shadow-lg"
        aria-label="Ask A Question"
        onClick={() => setCreateVisible(true)}
      >
        <PlusCircleOutlined className="w-5 h-5" />
        <span>Ask A Question</span>
      </Button>

      <Modal
        title="Ask A Question"
        centered
        open={isCreateVisible}
        onCancel={() => setLeaveVisible(true)}
        onOk={() => setSubmitVisible(true)}
        okText="Submit"
        width={700}
      >
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
            />
          </Form.Item>
          <Text type="secondary">Character limit {titleCount} / 150</Text>

          <Divider style={{ margin: '8px 0 16px' }} />

          <Form.Item
            label={<Text strong>Content:</Text>}
            name="content"
            help={contentError}
            validateStatus={contentError ? "error" : undefined}
            rules={[{ required: true, message: 'Please provide more details' },
            { min: 10, message: 'Content must be at least 10 characters' }
            ]}
          >
            <TextArea
              rows={8}
              placeholder="Provide more details about your question..."
              maxLength={3000}
              onChange={(e) => setContentCount(e.target.value.length)}
              style={{ resize: 'none' }}
            />
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
              placeholder="Select category"
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
