'use client';

import { LockOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const { Text } = Typography;

export default function LockedAnswerBox({
  message = 'This question is closed. No new answers can be submitted.',
  onClick,
}: {
  message?: string;
  onClick?: () => void;
}) {
  return (
    <Flex
      align="center"
      gap={8}
      onClick={onClick}
      style={{
        minHeight: 140,
        minWidth: 1100,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        padding: '8px 12px',
        backgroundColor: '#fafafa',
        cursor: onClick ? 'pointer' : 'not-allowed',
        color: '#999',
        textAlign: 'center',
        justifyContent: 'center',
      }}
    >
      <LockOutlined />
      <Text type="secondary">{message}</Text>
    </Flex>
  );
}
