'use client';

import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useLanguageStore from '@/store/useLanguageStore';

type QuestionsMessageProps = {
  returnTo?: string;
  scroll?: boolean;
};

const MESSAGE_QUERY_KEYS = [
  'created',
  'deleted',
  'closed',
  'opened',
  'updated',
] as const;

export default function QuestionsMessage({
  returnTo,
  scroll = true,
}: QuestionsMessageProps) {
  const { language } = useLanguageStore();
  const isVi = language === 'vi';
  const text = isVi
    ? {
        created: 'Câu hỏi đã được đăng thành công.',
        deleted: 'Câu hỏi đã được xóa thành công.',
        closed: 'Câu hỏi đã được đóng thành công.',
        opened: 'Câu hỏi đã được mở thành công.',
        updated: 'Câu hỏi đã được cập nhật thành công.',
      }
    : {
        created: 'Your question has been posted successfully.',
        deleted: 'Your question has been removed successfully.',
        closed: 'Your question has been closed successfully.',
        opened: 'Your question has been opened successfully.',
        updated: 'Your question has been updated successfully.',
      };

  const [messageApi, contextHolder] = message.useMessage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastShownKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const currentKey = MESSAGE_QUERY_KEYS.find(
      (key) => searchParams.get(key) === '1'
    );

    if (!currentKey) {
      lastShownKeyRef.current = null;
      return;
    }

    if (lastShownKeyRef.current === currentKey) return;
    lastShownKeyRef.current = currentKey;

    const basePath = returnTo ?? pathname ?? '/questions';
    const cleanedParams = new URLSearchParams(searchParams.toString());
    for (const key of MESSAGE_QUERY_KEYS) {
      cleanedParams.delete(key);
    }

    const nextUrl = cleanedParams.toString()
      ? `${basePath}?${cleanedParams.toString()}`
      : basePath;

    const showSuccess = (content: string) => {
      messageApi.success(content);
      router.replace(nextUrl, { scroll });
    };

    if (currentKey === 'created') return showSuccess(text.created);
    if (currentKey === 'deleted') return showSuccess(text.deleted);
    if (currentKey === 'closed') return showSuccess(text.closed);
    if (currentKey === 'opened') return showSuccess(text.opened);
    if (currentKey === 'updated') return showSuccess(text.updated);
  }, [searchParams, router, messageApi, returnTo, pathname, scroll, text]);

  return <>{contextHolder}</>;
}
