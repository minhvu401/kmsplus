// src/app/(main)/quizzes/[id]/page.tsx

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Quiz #{id}</h1>
      <p>TODO: Implement quiz detail page</p>
    </div>
  )
}
