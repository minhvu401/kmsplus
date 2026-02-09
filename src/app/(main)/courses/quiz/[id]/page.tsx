import { getQuizByCurriculumItemId } from "@/action/quiz/quizActions";
import QuizDetails from "@/components/ui/quizzes/quiz-details";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

    const curriculumItemId = Number(id)
    const quiz = await getQuizByCurriculumItemId(curriculumItemId);
    if (!quiz) {
      notFound();
    }
    return (
        <PageWrapper>
            <QuizDetails quiz={quiz} curriculumItemId={curriculumItemId} />
        </PageWrapper>  
    );
}