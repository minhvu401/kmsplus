import QuizForm from '@/components/forms/quiz-form';
import PageWrapper from '@/components/ui/questions/page-wrapper';
import { getQuestionsForAttemptAction, getTimeLimitForAttemptAction, getSavedAnswersAction } from '@/service/quiz.service';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attemptId = Number(id);

  if (!Number.isInteger(attemptId)) {
    throw new Error('Invalid attempt ID');
  }

  const questions = await getQuestionsForAttemptAction(attemptId);
  const timeLimit = await getTimeLimitForAttemptAction(attemptId);
  const savedAnswers = await getSavedAnswersAction(attemptId);
  
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