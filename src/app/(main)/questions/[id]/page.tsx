// app/questions/[id]/page.tsx
import { getQuestionDetails } from "@/action/question/questionActions";
import PageWrapper from "@/components/ui/questions/page-wrapper";
import QuestionMenu from "@/components/ui/questions/question-menu";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: {
    sort?: string;
    page?: string;
  };
}) {

  const id = await params.id;
  const userId = 1; // Replace with actual user ID retrieval logic
  const sort = await searchParams?.sort || "newest";
  const currentPage = await Number(searchParams?.page) || 1;

  // Use `id` to fetch data
  const res = await getQuestionDetails(id);

  const createdAt = new Date(res.created_at);
  const updatedAt = new Date(res.updated_at);

  console.log("PosterID:", res.user_id);
  console.log("UserID:", userId);


  return (
    <PageWrapper>
      <div>
        <div className="relative flex items-center justify-center mt-6 mb-4">
          <h1 className="text-center text-2xl font-bold text-blue-600">{res.title}</h1>
          <div className="absolute right-0 top-0">
            <QuestionMenu userId={userId} posterId={res.user_id} postId={res.id} status={res.is_closed ? "closed" : "open"} />
          </div>
        </div>
        <div className="items-center justify-center font-semibold text-gray-700 flex mt-4 gap-4">
          <p> by {res.user_name}</p>
          <span className="inline-flex items-center h-6 px-3 rounded bg-blue-600 text-white text-sm leading-none whitespace-nowrap">
            {res.category_name}
          </span>
          <span
            className={`inline-flex items-center h-6 px-3 rounded text-white text-sm leading-none whitespace-nowrap ${res.is_closed ? "bg-red-500" : "bg-green-500"
              }`}
          >
            {res.is_closed ? "Closed" : "Open"}
          </span>
        </div>
        <div className="items-center justify-center font-semibold text-gray-700 flex mt-4 gap-20">
          <p> asked on {createdAt.toLocaleDateString()} </p>
          {res.is_closed ? (
            <p> closed on {updatedAt.toLocaleDateString()} </p>
          ) : (
            <p> last updated on {updatedAt.toLocaleDateString()} </p>
          )}
          <p> {res.view_count} views </p>
        </div>
        <hr className="border-gray-300 mt-6" />
        <div className="items-center justify-center font-medium text-gray-700 flex mt-6 mr-20 ml-20 whitespace-pre-wrap">
          <p>{res.content}</p>
        </div>
      </div>
    </PageWrapper>
  );
}
