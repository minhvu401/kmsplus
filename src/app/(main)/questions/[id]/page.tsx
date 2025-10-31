// app/questions/[id]/page.tsx
import { getQuestionDetails } from "@/action/question/questionActions";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import QuestionDetails from "@/components/ui/questions/question-details";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: {
    sort?: string;
    page?: string;
  };
}) {
  const id = params.id;
  const sort = searchParams?.sort || "newest";
  const currentPage = Number(searchParams?.page) || 1;

  // Fetch question details
  const question = await getQuestionDetails(id);
  
  return (
    <PageWrapper>
      <QuestionDetails question={question} />
    </PageWrapper>
  );
}

