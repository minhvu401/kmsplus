// app/questions/[id]/page.tsx
import { getQuestionDetails } from "@/action/question/questionActions";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import QuestionDetails from "@/components/ui/questions/question-details";
import { QuestionDetailsNotification } from "@/components/ui/questions/questions-notification";

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
  };
}) {
  const id = params.id;
  const sort = searchParams?.sort || "newest";
  const currentPage = Number(searchParams?.page) || 1;

  // Fetch question details
  const question = await getQuestionDetails(id);

  return (
    <PageWrapper>
      <QuestionDetailsNotification
        id={id}
        key={`${id}-${searchParams?.closed}-${searchParams?.opened}`}
      />
      <QuestionDetails question={question} />
    </PageWrapper>
  );
}

