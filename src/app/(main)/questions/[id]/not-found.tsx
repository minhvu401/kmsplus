"use client";

import { Result, Button, Space, Flex } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function QuestionNotFound() {
  const router = useRouter();

  return (
    <Flex
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Result
        status="404"
        title="Question Not Found"
        subTitle="The question you are looking for does not exist or has been removed."
        extra={
          <Space>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/questions")}
            >
              Back to Questions
            </Button>
          </Space>
        }
      />
    </Flex>
  );
}
