import PageWrapper from "@/components/ui/questions/page-wrapper";
import { getAttemptResult } from "@/service/quiz.service";
import QuizResult from "@/components/ui/quizzes/quiz-result";

export default async function Page({
    params
}: {
    params: { id: string };
}) {

    const attemptId = Number(params.id);
    const result = await getAttemptResult(attemptId);

    return (
        <PageWrapper>
            <QuizResult result={result} />
        </PageWrapper>
    );
}