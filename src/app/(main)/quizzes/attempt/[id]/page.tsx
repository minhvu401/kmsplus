import QuizForm from '@/components/forms/quiz-form';
import PageWrapper from '@/components/ui/questions/page-wrapper';
import { getQuestionsForAttempt, getTimeLimitForAttempt, getSavedAnswers } from '@/service/quiz.service';

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const attemptId = Number(params.id);

  if (!Number.isInteger(attemptId)) {
    throw new Error('Invalid attempt ID');
  }

  const questions = await getQuestionsForAttempt(attemptId);
  const timeLimit = await getTimeLimitForAttempt(attemptId);
  const savedAnswers = await getSavedAnswers(attemptId);
  
  const initialAnswers = Object.fromEntries(
    savedAnswers.map(a => [
      a.question_id,
      Array.isArray(a.selected_option_id)
        ? a.selected_option_id
        : JSON.parse(a.selected_option_id),
    ])
  );

  return (
    <PageWrapper>
      <QuizForm
        attemptId={attemptId}
        questions={questions}
        durationSeconds={timeLimit ? timeLimit * 60 : null}
        initialAnswers={initialAnswers}
      />
    </PageWrapper>
  );
}
