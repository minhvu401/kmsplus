import { notFound } from "next/navigation";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO: Fetch article data
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Article #{id}</h1>
      <p>TODO: Implement article detail page</p>
    </div>
  );
}
