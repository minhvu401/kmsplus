'use client';

import { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';


type QuestionsNotificationProps = {
  returnTo?: string;
  scroll?: boolean;
};

const NOTIFICATION_QUERY_KEYS = [
  'created',
  'deleted',
  'closed',
  'opened',
  'updated',
  'answerCreated',
  'answerDeleted',
  'answerUpdated',
] as const;

export default function QuestionsNotification({
  returnTo,
  scroll = true,
}: QuestionsNotificationProps) {
  const [notificationApi, contextHolder] = notification.useNotification();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastShownKeyRef = useRef<string | null>(null);


  useEffect(() => {
    const currentKey = NOTIFICATION_QUERY_KEYS.find(
      (key) => searchParams.get(key) === '1'
    );

    // Nothing to show: reset so the next event can show again.
    if (!currentKey) {
      lastShownKeyRef.current = null;
      return;
    }

    // Prevent duplicate notification in React Strict Mode, and avoid re-showing
    // the same event until the query flag is cleared.
    if (lastShownKeyRef.current === currentKey) return;
    lastShownKeyRef.current = currentKey;

    const basePath = returnTo ?? pathname ?? '/questions';
    const cleanedParams = new URLSearchParams(searchParams.toString());
    for (const key of NOTIFICATION_QUERY_KEYS) {
      cleanedParams.delete(key);
    }
    const nextUrl = cleanedParams.toString()
      ? `${basePath}?${cleanedParams.toString()}`
      : basePath;

    const replace = () => {
      router.replace(nextUrl, { scroll });
    };

    const showSuccess = (message: string, description: string) => {
      notificationApi.success({
        message,
        description,
        placement: 'topRight',
        duration: 3,
      });

      // Always clean up immediately so the same action can trigger again later.
      replace();
    };

    if (currentKey === 'created') {
      showSuccess(
        'Post created',
        'Your question has been posted successfully.'
      );
      return;
    }
    if (currentKey === 'deleted') {
      showSuccess(
        'Post deleted',
        'Your question has been removed successfully.'
      );
      return;
    }
    if (currentKey === 'closed') {
      showSuccess(
        'Post closed',
        'Your question has been closed successfully.'
      );
      return;
    }
    if (currentKey === 'opened') {
      showSuccess(
        'Post opened',
        'Your question has been opened successfully.'
      );
      return;
    }
    if (currentKey === 'updated') {
      showSuccess(
        'Post updated',
        'Your question has been updated successfully.'
      );
      return;
    }
    if (currentKey === 'answerCreated') {
      showSuccess(
        'Answer created',
        'Your answer has been posted successfully.'
      );
      return;
    }
    if (currentKey === 'answerDeleted') {
      showSuccess(
        'Answer deleted',
        'Your answer has been deleted successfully.'
      );
      return;
    }
    if (currentKey === 'answerUpdated') {
      showSuccess(
        'Answer updated',
        'Your answer has been updated successfully.'
      );
    }
  }, [searchParams, router, notificationApi, returnTo, pathname, scroll]);

  return <>{contextHolder}</>;
}