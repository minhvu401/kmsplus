import { Tabs, Typography } from "antd"
import SummaryTabContent from "./SummaryTabContent"

export default function ActivityTabContent() {
  const { Title, Text } = Typography
  const { TabPane } = Tabs

  return (
    <div>
      <Tabs tabPosition="left" defaultActiveKey="summary">
        <TabPane tab="Summary" key="summary">
          <SummaryTabContent />
        </TabPane>
        <TabPane tab="Answers" key="answers">
          <Title level={4}>Answers</Title>
          <Text>Bạn chưa trả lời câu hỏi nào.</Text>
          {/* Bạn có thể thêm danh sách các câu trả lời ở đây */}
        </TabPane>
        <TabPane tab="Questions" key="questions">
          <Title level={4}>Questions</Title>
          <Text>Bạn chưa đặt câu hỏi nào.</Text>
          {/* Bạn có thể thêm danh sách các câu hỏi ở đây */}
        </TabPane>
        <TabPane tab="Tags" key="tags">
          <Title level={4}>Tags</Title>
          <Text>Nội dung thẻ (Tags).</Text>
        </TabPane>
        <TabPane tab="Badges" key="badges">
          <Title level={4}>Badges</Title>
          <Text>Nội dung huy hiệu (Badges).</Text>
        </TabPane>
        <TabPane tab="Reputation" key="reputation">
          <Title level={4}>Reputation</Title>
          <Text>Nội dung điểm uy tín (Reputation).</Text>
        </TabPane>
      </Tabs>
    </div>
  )
}
