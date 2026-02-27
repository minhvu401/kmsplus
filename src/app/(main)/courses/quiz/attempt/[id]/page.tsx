import QuizForm from '@/components/forms/quiz-form';
import PageWrapper from '@/components/ui/questions/page-wrapper';
import { getQuestionsForAttempt, getTimeLimitForAttempt, getSavedAnswers, getAttemptMeta } from '@/action/quiz/quizActions';

const normalizeSelectedOptionId = (value: unknown): string | string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    // DB may store either JSON (e.g. "[\"A\",\"B\"]") or a raw string (e.g. "A")
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
      if (typeof parsed === 'string') return parsed;
      return String(parsed);
    } catch {
      return value;
    }
  }
  if (value == null) return '';
  return String(value);
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const attemptId = Number((await params).id);

  if (!Number.isInteger(attemptId)) {
    throw new Error('Invalid attempt ID');
  }

  const questions = await getQuestionsForAttempt(attemptId);
  const timeLimit = await getTimeLimitForAttempt(attemptId);
  const savedAnswers = await getSavedAnswers(attemptId);
  const attemptMeta = await getAttemptMeta(attemptId);
  
  const initialAnswers = Object.fromEntries(
    savedAnswers.map(a => [
      a.question_id,
      normalizeSelectedOptionId(a.selected_option_id),
    ])
  );

  return (
    <PageWrapper>
      <QuizForm
        attemptId={attemptId}
        attemptNumber={attemptMeta.attempt_number}
        questions={questions}
        durationSeconds={timeLimit ? timeLimit * 60 : null}
        initialAnswers={initialAnswers}
      />
    </PageWrapper>
  );
}
