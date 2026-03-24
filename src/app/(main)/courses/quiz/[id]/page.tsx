import { getQuizByCurriculumItemId } from "@/action/quiz/quizActions";
import { notFound, redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

    const curriculumItemId = Number(id)
    const quiz = await getQuizByCurriculumItemId(curriculumItemId);
    if (!quiz) {
      notFound();
    }

    redirect(`/courses/${quiz.course_id}/learning?itemId=${curriculumItemId}`)
}