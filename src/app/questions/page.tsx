// List questions in Q&A Forum
import PageWrapper from "@/components/page-wrapper"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import { FilterCategory, FilterStatus, SortBy } from "@/components/ui/questions/filters"
import { getActiveCategories } from "@/action/question/questionActions";

export default async function Page() {

  const categories = await getActiveCategories();

  return (
    <PageWrapper>
      <div className="flex items-center gap-7 mb-6">
        <Search placeholder="Search questions..." />
        <CreateQuestion />
      </div>
      <div className="flex items-center gap-14 mb-6">
        <FilterCategory categories={categories}/>
        <FilterStatus />
        <SortBy />
      </div>
    </PageWrapper>
  )
}
