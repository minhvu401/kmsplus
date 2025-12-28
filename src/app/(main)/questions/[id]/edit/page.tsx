import PageWrapper from "@/components/ui/questions/page-wrapper"
import UpdateQuestionForm from "@/components/forms/update-question-form";
import { getActiveCategories } from "@/action/question/questionActions";
import { getQuestionDetails } from "@/action/question/questionActions";
import { Flex } from "antd";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  // const userId = 1; // Replace with actual user ID retrieval logic
  const id = params.id;
  const currentData = await getQuestionDetails(id);
  const categories = await getActiveCategories();


  return (
    <PageWrapper>
      <Flex align="center" gap={56}>
        <UpdateQuestionForm
          categories={categories}
          currentData={currentData}
        />
      </Flex>
    </PageWrapper>
  )
}
