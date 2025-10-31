import PageWrapper from "@/components/ui/questions/page-wrapper"
import CreateQuestionForm from "@/components/forms/create-question-form";
import { getActiveCategories } from "@/action/question/questionActions";
import { getQuestionDetails } from "@/action/question/questionActions";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  // const categories = await getActiveCategories();
  // const userId = 1; // Replace with actual user ID retrieval logic
  const id = params.id;
  const res = await getQuestionDetails(id);

  return (
    <PageWrapper>
      <div className="flex items-center gap-7 mb-6 font-black">
        {/* <CreateQuestionForm categories={categories} userId={userId} /> */}
        TITLE: {res.title}
      </div>
    </PageWrapper>
  )
}
