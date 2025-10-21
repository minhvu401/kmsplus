// List questions in Q&A Forum
import PageWrapper from "@/components/page-wrapper"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"

export default async function Page() {
  return (
    <PageWrapper>
      <div className="flex items-center gap-7 mb-6">
        <Search placeholder="Search questions..." />
        <CreateQuestion />
      </div>
    </PageWrapper>
  )
}
