'use client'

import { startTransition, useState } from 'react';
import { EditOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, Menu, Button, Modal, Typography } from 'antd';
import { deleteAnswer, updateAnswer } from '@/action/question/questionActions';

const { Text } = Typography;

export default function AnswerMenu({
    answerId,
    questionId
} : {
    answerId: number,
    questionId: number
}) {
    const [open, setOpen] = useState(false);
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    const [isUpdateVisible, setUpdateVisible] = useState(false);

    const items = [
        {
            key: 'edit',
            label: (
                <span
                    onClick={() => {
                        setUpdateVisible(true);
                        setOpen(false);
                    }}
                >
                    <EditOutlined /> Edit answer
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
                    <DeleteOutlined /> Delete answer
                </span>
            ),
        },
    ];

    const handleDelete = () => {
        // Implement delete logic here
        setDeleteVisible(false);

        startTransition(() => {
            deleteAnswer(answerId, questionId);
        });
    };

    return (
        <>
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
                title="Confirmation"
                open={isDeleteVisible}
                onCancel={() => setDeleteVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="delete" danger onClick={handleDelete}>
                        Confirm
                    </Button>,
                ]}
            >
                <Text>Are you sure you want to delete this answer?</Text>
                <br />
                <Text type="secondary">Your answer will be permanently deleted.</Text>
            </Modal>

            <Modal
                title="Edit answer"
                open={isUpdateVisible}
                onCancel={() => setUpdateVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setUpdateVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="delete" danger>
                        Confirm
                    </Button>,
                ]}
            >
                <Text>hello</Text>
            </Modal>

        </>
    );
}