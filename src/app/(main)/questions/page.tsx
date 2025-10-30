// List questions in Q&A Forum
import PageWrapper from "@/components/ui/questions/page-wrapper"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import { FilterCategory, FilterStatus, QuestionsSortBy } from "@/components/ui/questions/filters"
import { getActiveCategories, fetchQuestionsPages, fetchFilteredQuestions } from "@/action/question/questionActions";
import Pagination from "@/components/ui/questions/pagination";
import QuestionsList from "@/components/ui/questions/questions-list";

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
      <div className="flex items-center gap-7 mb-6">
        <Search placeholder="Search questions..." />
        <CreateQuestion />
      </div>
      <div className="flex items-center gap-14 mb-6">
        <FilterCategory categories={categories} />
        <FilterStatus />
        <QuestionsSortBy />
      </div>
      <div className="mb-6">
        <QuestionsList questions={questions} />
      </div>
      <div className="flex justify-end items-center gap-14 mb-6">
        <Pagination totalPages={totalPages} />
      </div>
    </PageWrapper>
  )
}
