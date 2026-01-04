'use client';

import { Button, Modal, message } from 'antd';
import { useState } from 'react';
import { startQuizAttemptAction } from '@/action/quiz/quizActions';

export default function StartQuizButton({
  quizId,
}: {
  quizId: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirmStart() {
    try {
      setLoading(true);
      const attemptId = await startQuizAttemptAction(quizId);
      window.location.href = `/quizzes/attempt/${attemptId.id}`;
    } catch {
      message.error('Failed to start quiz');
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="primary"
        size="large"
        onClick={() => setOpen(true)}
      >
        Start Quiz
      </Button>

      <Modal
        open={open}
        title="Start quiz?"
        okText="Start Quiz"
        cancelText="Cancel"
        confirmLoading={loading}
        onOk={handleConfirmStart}
        onCancel={() => setOpen(false)}
      >
        <p>Once you start the quiz:</p>
        <ul>
          <li>The timer will begin immediately</li>
          <li>You must complete the quiz in one sitting</li>
        </ul>
      </Modal>
    </>
  );
}
