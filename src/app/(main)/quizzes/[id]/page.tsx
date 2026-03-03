import QuizDetails from "@/components/ui/quizzes/quiz-details"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import { Typography } from "antd"

const { Title } = Typography

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <PageWrapper>
      <Title level={2}>Quiz {id} - Details Coming Soon</Title>
    </PageWrapper>
  )
}
