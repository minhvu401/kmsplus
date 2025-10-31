'use client';

import { useState, useEffect, useRef } from 'react';
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Button, message } from 'antd';
import Link from 'next/link';

export default function QuestionMenu({
  userId,
  posterId,
  postId,
  status,
}: {
  userId: number;
  posterId: number;
  postId: number;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage(); // 👈 Add this

  const handleShare = async () => {
    const url = `${window.location.origin}/questions/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      messageApi.success('Question link copied to clipboard!');
    } catch {
      messageApi.error('Failed to copy link.');
    }
    setOpen(false);
  };

  const items = [
    ...(Number(userId) === Number(posterId)
      ? [
          {
            key: 'edit',
            label: (
              <Link href={`/questions/${postId}/edit`}>
                <EditOutlined /> Edit question
              </Link>
            ),
          },
          {
            key: 'delete',
            label: (
              <span onClick={() => messageApi.info('Delete clicked')}>
                <DeleteOutlined /> Delete question
              </span>
            ),
          },
          status === 'closed'
            ? {
                key: 'open',
                label: (
                  <span onClick={() => messageApi.success('Question reopened')}>
                    <UnlockOutlined /> Open question
                  </span>
                ),
              }
            : {
                key: 'close',
                label: (
                  <span onClick={() => messageApi.warning('Question closed')}>
                    <LockOutlined /> Close question
                  </span>
                ),
              },
        ]
      : []),
    {
      key: 'share',
      label: (
        <span onClick={handleShare}>
          <ShareAltOutlined /> Share question
        </span>
      ),
    },
  ];

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
    </>
  );
}
