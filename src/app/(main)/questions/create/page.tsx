// create new question

import PageWrapper from "@/components/ui/questions/page-wrapper"
import CreateQuestionForm from "@/components/forms/create-question-form";
import { getActiveCategories } from "@/action/question/questionActions";
import { Flex } from "antd";

export default async function Page() {
  const categories = await getActiveCategories();
  const userId = 1; // TEMP; Replace with actual user ID retrieval logic
  return (
    <PageWrapper>
      <Flex align="center" gap={56}>
        <CreateQuestionForm categories={categories} userId={userId} />
      </Flex>
    </PageWrapper>
  )
}
