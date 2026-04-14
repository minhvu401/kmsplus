import ProfilePageContent from "./components/ProfilePageContent"
import { getProfileAction } from "@/action/user/profileActions"
import { getUserCountsAction } from "@/service/stats.service"
import { getUserQuestionsAction, QuestionRow, getUserAnswersAction } from "@/service/question.service"
import { getUserEnrolledCoursesService, getAllUserEnrolledCoursesService } from "@/service/course.service"
import { getUserCommentsAction } from "@/service/comments.service"

export default async function DashboardPage() {
  const result = await getProfileAction()
  const user = result.success ? result.data : null

  let counts = { questions: 0, answers: 0, comments: 0, courses: 0 }
  if (user && user.id) {
    counts = await getUserCountsAction(user.id)
  }

  let questions: QuestionRow[] = []
  let answers: any[] = []
  let comments: any[] = []
  let enrolledCourses: any[] = []
  if (user && user.id) {
    questions = await getUserQuestionsAction(user.id)
    answers = await getUserAnswersAction(user.id)
    comments = await getUserCommentsAction(user.id)
    const enrolledRes = await getAllUserEnrolledCoursesService(Number(user.id))
    enrolledCourses = enrolledRes.courses || []
  }

  return <ProfilePageContent user={user} counts={counts} questions={questions} answers={answers} comments={comments} enrolledCourses={enrolledCourses} />
}
