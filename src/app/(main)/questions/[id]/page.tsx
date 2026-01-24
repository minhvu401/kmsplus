// app/questions/[id]/page.tsx
// view question details & answers
import { getQuestionDetails, getAnswersForQuestion, fetchFilteredAnswers } from "@/action/question/questionActions";
import AnswerSection from "@/components/ui/questions/answer-section";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import QuestionDetails from "@/components/ui/questions/question-details";
import { QuestionDetailsNotification } from "@/components/ui/questions/questions-notification";
import { notFound } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: {
    sort?: string;
    page?: string;
    opened?: string;
    closed?: string;
    updated?: string;
    answerCreated?: string;
    answerDeleted?: string;
  };
}) {
  const id = params.id;
  const currentPage = Number(searchParams?.page) || 1;

  // Fetch question details
  const question = await getQuestionDetails(id);
  const answers = await getAnswersForQuestion(Number(id));
  const paginatedAnswers = await fetchFilteredAnswers(currentPage, Number(id));

  if (!question) {
    return notFound();
  }

  return (
    <PageWrapper>
      <QuestionDetailsNotification
        id={id}
        key={`${id}-${searchParams?.closed}-${searchParams?.opened}-${searchParams?.updated}-${searchParams?.answerCreated}-${searchParams?.answerDeleted}`}
      />
      <QuestionDetails question={question} />
      <AnswerSection questionId={Number(id)} answer_count={question.answer_count} is_closed={question.is_closed} answers={answers} paginatedAnswers={paginatedAnswers} />
    </PageWrapper>
  );
}

