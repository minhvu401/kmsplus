// app/questions/[id]/page.tsx
// view question details & answers
import { getQuestionDetails, getAnswersForQuestion, fetchFilteredAnswers } from "@/action/question/questionActions";
import AnswerSection from "@/components/ui/questions/answer-section";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import QuestionDetails from "@/components/ui/questions/question-details";
import { notFound } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    sort?: string;
    page?: string;
    opened?: string;
    closed?: string;
    updated?: string;
    answerCreated?: string;
    answerDeleted?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const currentPage = Number(sp?.page) || 1;

  // Fetch question details
  const question = await getQuestionDetails(id);
  const answers = await getAnswersForQuestion(Number(id));
  const paginatedAnswers = await fetchFilteredAnswers(currentPage, Number(id));

  if (!question) {
    return notFound();
  }

  return (
    <PageWrapper>
      <AnswerSection questionId={Number(id)} answer_count={question.answer_count} is_closed={question.is_closed} answers={answers} paginatedAnswers={paginatedAnswers} />
    </PageWrapper>
  );
}

