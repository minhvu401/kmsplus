// List questions in Q&A Forum
import PageWrapper from "@/components/page-wrapper"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import { FilterCategory, FilterStatus, SortBy } from "@/components/ui/questions/filters"
import { getActiveCategories, fetchQuestionsPages } from "@/action/question/questionActions";
import Pagination from "@/components/ui/questions/pagination";

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Hỏi & Đáp</h1>
            <p className="text-gray-600 mt-2">
              Diễn đàn câu hỏi và trả lời của cộng đồng
            </p>
          </div>
          <CreateQuestion />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-7 mb-6">
        <Search placeholder="Search questions..." />
      </div>
      <div className="flex items-center gap-14 mb-6">
        <FilterCategory categories={categories} />
        <FilterStatus />
        <SortBy />
      </div>
      <div className="flex justify-end items-center gap-14 mb-6">
        <Pagination totalPages={totalPages}/>
      </div>
    </div>
  )
}
