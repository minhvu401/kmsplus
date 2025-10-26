import PageWrapper from "@/components/page-wrapper"
import CreateQuestionForm from "@/components/forms/create-question-form";
import { getActiveCategories } from "@/action/question/questionActions";

export default async function Page() {
  const categories = await getActiveCategories();
  const userId = 1; // Replace with actual user ID retrieval logic
  return (
    <PageWrapper>
      <div className="flex items-center gap-7 mb-6">
        <CreateQuestionForm categories={categories} userId={userId} />
      </div>
    </PageWrapper>
  )
}
