'use client';

import { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';


export default function QuestionsNotification() {
  const [notificationApi, contextHolder] = notification.useNotification();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownRef = useRef(false);


  useEffect(() => {

    if (hasShownRef.current) return;

    if (searchParams.get('created') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Post created',
        description: 'Your question has been posted successfully.',
        placement: 'topRight',
        duration: 3,
      });
      router.replace('/questions');
    }
    if (searchParams.get('deleted') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Post deleted',
        description: 'Your question has been removed successfully.',
        placement: 'topRight',
        duration: 3,
      });
      router.replace('/questions');
    }
  }, [searchParams, router, notificationApi]);

  return <>{contextHolder}</>;
}

export function QuestionDetailsNotification({ id }: { id: string }) {
  const [notificationApi, contextHolder] = notification.useNotification();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownRef = useRef(false);


  useEffect(() => {

    if (hasShownRef.current) return;

    if (searchParams.get('closed') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Post closed',
        description: 'Your question has been closed successfully.',
        placement: 'topRight',
        duration: 3,
        onClose: () => {
          router.replace(`/questions/${id}`);
        },
      });
    }
    if (searchParams.get('opened') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Post opened',
        description: 'Your question has been opened successfully.',
        placement: 'topRight',
        duration: 3,
        onClose: () => {
          router.replace(`/questions/${id}`);
        },
      });
    }
    if (searchParams.get('updated') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Post updated',
        description: 'Your question has been updated successfully.',
        placement: 'topRight',
        duration: 3,
        onClose: () => {
          router.replace(`/questions/${id}`);
        },
      });
    }
     if (searchParams.get('answerCreated') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Answer created',
        description: 'Your answer has been posted successfully.',
        placement: 'topRight',
        duration: 3,
        onClose: () => {
          router.replace(`/questions/${id}`);
        },
      });
    }
    if (searchParams.get('answerDeleted') === '1') {
      hasShownRef.current = true;
      notificationApi.success({
        message: 'Answer deleted',
        description: 'Your answer has been deleted successfully.',
        placement: 'topRight',
        duration: 3,
        onClose: () => {
          router.replace(`/questions/${id}`);
        },
      });
    }
  }, [searchParams, router, notificationApi, id]);

  return <>{contextHolder}</>;
}