import PageWrapper from "@/components/ui/questions/page-wrapper";
import { getAttemptResult } from "@/action/quiz/quizActions";
import QuizResult from "@/components/ui/quizzes/quiz-result";

export default async function Page({
    params
}: {
    params: Promise<{ id: string }>;
}) {

    const attemptId = Number((await params).id);
    const result = await getAttemptResult(attemptId);

    return (
        <PageWrapper>
            <QuizResult result={result} />
        </PageWrapper>
    );
}