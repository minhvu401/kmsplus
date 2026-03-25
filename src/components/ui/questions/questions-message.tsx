'use client';

import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  'answerCreated',
  'answerDeleted',
  'answerUpdated',
] as const;

export default function QuestionsMessage({
  returnTo,
  scroll = true,
}: QuestionsMessageProps) {
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

    if (currentKey === 'created') return showSuccess('Your question has been posted successfully.');
    if (currentKey === 'deleted') return showSuccess('Your question has been removed successfully.');
    if (currentKey === 'closed') return showSuccess('Your question has been closed successfully.');
    if (currentKey === 'opened') return showSuccess('Your question has been opened successfully.');
    if (currentKey === 'updated') return showSuccess('Your question has been updated successfully.');
    if (currentKey === 'answerCreated') return showSuccess('Your answer has been posted successfully.');
    if (currentKey === 'answerDeleted') return showSuccess('Your answer has been deleted successfully.');
    if (currentKey === 'answerUpdated') return showSuccess('Your answer has been updated successfully.');
  }, [searchParams, router, messageApi, returnTo, pathname, scroll]);

  return <>{contextHolder}</>;
}
