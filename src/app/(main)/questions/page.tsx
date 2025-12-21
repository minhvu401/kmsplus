// List questions in Q&A Forum
import PageWrapper from "@/components/ui/questions/page-wrapper"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import { FilterCategory, FilterStatus, QuestionsSortBy } from "@/components/ui/questions/filters"
import { getActiveCategories, fetchQuestionsPages, fetchFilteredQuestions } from "@/action/question/questionActions";
import QuestionsNotification from "@/components/ui/questions/questions-notification";
import Pagination from "@/components/ui/questions/pagination";
import QuestionsList from "@/components/ui/questions/questions-list";
import { Flex } from "antd";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    category?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const category = searchParams?.category || 'any';
  const status = searchParams?.status || 'any';
  const sort = searchParams?.sort || 'newest';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchQuestionsPages(query, category, status);

  const categories = await getActiveCategories();
  const questions = await fetchFilteredQuestions(query, category, status, sort, currentPage);

  return (
    <PageWrapper>

      <QuestionsNotification />

      <Flex align="center" gap={28} style={{ marginBottom: 24 }}>
        <Search placeholder="Search questions..." />
        <CreateQuestion />
      </Flex>

      <Flex align="center" gap={56} style={{ marginBottom: 24 }}>
        <FilterCategory categories={categories} />
        <FilterStatus />
        <QuestionsSortBy />
      </Flex>

      <div style={{ marginBottom: 24 }}>
        <QuestionsList questions={questions} />
      </div>

      <Flex justify="end" align="center" style={{ marginBottom: 24 }}>
        <Pagination totalPages={totalPages} />
      </Flex>
    </PageWrapper>
  );
}
