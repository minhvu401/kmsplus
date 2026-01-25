import { Tabs, Typography } from "antd"
import SummaryTabContent from "./SummaryTabContent"

export default function ActivityTabContent() {
  const { Title, Text } = Typography

  return (
    <Tabs
      tabPosition="left"
      defaultActiveKey="summary"
      items={[
        {
          label: "Summary",
          key: "summary",
          children: <SummaryTabContent />,
        },
        {
          label: "Answers",
          key: "answers",
          children: (
            <div>
              <Title level={4}>Answers</Title>
              <Text>Bạn chưa trả lời câu hỏi nào.</Text>
            </div>
          ),
        },
        {
          label: "Questions",
          key: "questions",
          children: (
            <div>
              <Title level={4}>Questions</Title>
              <Text>Bạn chưa đặt câu hỏi nào.</Text>
            </div>
          ),
        },
        {
          label: "Tags",
          key: "tags",
          children: (
            <div>
              <Title level={4}>Tags</Title>
              <Text>Nội dung thẻ (Tags).</Text>
            </div>
          ),
        },
        {
          label: "Badges",
          key: "badges",
          children: (
            <div>
              <Title level={4}>Badges</Title>
              <Text>Nội dung huy hiệu (Badges).</Text>
            </div>
          ),
        },
        {
          label: "Reputation",
          key: "reputation",
          children: (
            <div>
              <Title level={4}>Reputation</Title>
              <Text>Nội dung điểm uy tín (Reputation).</Text>
            </div>
          ),
        },
      ]}
    />
  )
}
