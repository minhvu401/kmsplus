import { getQuizDetails } from "@/service/quiz.service";
import QuizDetails from "@/components/ui/quizzes/quiz-details";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import StartQuizButton from "@/components/ui/quizzes/buttons";

export default async function Page({
    params
}: {
    params: { id: string };
}) {
    const id = params.id;
    const quiz = await getQuizDetails(Number(id));
    return (
        <PageWrapper>
            <QuizDetails quiz={quiz} />
            <StartQuizButton quizId={Number(id)} />
        </PageWrapper>  
    );
}