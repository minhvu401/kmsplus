import { getQuizDetailsAction } from "@/service/quiz.service";
import QuizDetails from "@/components/ui/quizzes/quiz-details";
import PageWrapper from "@/components/ui/questions/page-wrapper";

export default async function Page({
    params
}: {
    params: { id: string };
}) {
    const id = params.id;
    const quiz = await getQuizDetailsAction(Number(id));
    return (
      <div className="p-6">
        <Empty description="Không tìm thấy bài thi">
          <Button type="primary" onClick={() => router.push("/quizzes")}>
            Quay lại danh sách
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/quizzes")}
        className="mb-6"
      >
        Quay lại
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600 mt-2">Chi tiết bài thi</p>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setIsEditModalVisible(true)}
        >
          Chỉnh sửa
        </Button>
      </div>

      {/* Quiz Info Card */}
      <Card className="mb-6">
        <Descriptions
          title="Thông Tin Bài Thi"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
        >
          <Descriptions.Item label="Tên bài thi" span={3}>
            {quiz.title}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={3}>
            {quiz.description || "Không có mô tả"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                <ClockCircleOutlined className="mr-1" />
                Thời gian làm bài
              </span>
            }
          >
            {quiz.time_limit_minutes
              ? `${quiz.time_limit_minutes} phút`
              : "Không giới hạn"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                <TrophyOutlined className="mr-1" />
                Điểm đạt
              </span>
            }
          >
            {quiz.passing_score}%
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                <ReloadOutlined className="mr-1" />
                Số lần làm tối đa
              </span>
            }
          >
            {quiz.max_attempts === 999 ? "Không giới hạn" : quiz.max_attempts}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatDate(quiz.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {formatDate(quiz.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Questions Card */}
      <Card
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Danh Sách Câu Hỏi ({questions.length} câu)
          </span>
        }
      >
        {questions.length > 0 ? (
          <Table
            columns={questionColumns}
            dataSource={questions.map((q, index) => ({ ...q, key: q.quiz_question_id || index }))}
            pagination={questions.length > 10 ? { pageSize: 10 } : false}
            size="small"
          />
        ) : (
          <Empty description="Chưa có câu hỏi nào được liên kết với bài thi này" />
        )}
      </Card>

      {/* Edit Quiz Modal */}
      <EditQuizModal
        visible={isEditModalVisible}
        quizId={quiz.id}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          setIsEditModalVisible(false)
          loadQuizDetail()
        }}
      />
    </div>
  )
}