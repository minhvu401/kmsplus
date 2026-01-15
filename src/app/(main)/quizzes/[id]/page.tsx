import { getQuizByIdAction } from "@/service/quiz.service";
import QuizDetails from "@/components/ui/quizzes/quiz-details";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
    const quiz = await getQuizByIdAction(Number(id));
    if (!quiz) {
      notFound();
    }
    return (
        <PageWrapper>
            <QuizDetails quiz={quiz} />
        </PageWrapper>  
    );
}
