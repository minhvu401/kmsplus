import PageWrapper from "@/components/ui/questions/page-wrapper";
import { getAttemptResultAction } from "@/service/quiz.service";
import QuizResult from "@/components/ui/quizzes/quiz-result";

export default async function Page({
    params
}: {
  params: Promise<{ id: string }>;
}) {

    const { id } = await params;
    const attemptId = Number(id);
    const result = await getAttemptResultAction(attemptId);

    return (
        <PageWrapper>
            <QuizResult result={result} />
        </PageWrapper>
    );
}