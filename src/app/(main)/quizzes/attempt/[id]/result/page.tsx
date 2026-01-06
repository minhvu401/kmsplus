import PageWrapper from "@/components/ui/questions/page-wrapper";
import { getAttemptResultAction } from "@/service/quiz.service";
import QuizResult from "@/components/ui/quizzes/quiz-result";

export default async function Page({
    params
}: {
    params: { id: string };
}) {

    const attemptId = Number(params.id);
    const result = await getAttemptResultAction(attemptId);

    return (
        <PageWrapper>
            <QuizResult result={result} />
        </PageWrapper>
    );
}