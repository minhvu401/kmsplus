"use client";

import { Result, Button, Space, Flex } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useLanguageStore from "@/store/useLanguageStore";

export default function QuestionNotFound() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const isVi = language === "vi";

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
        title={isVi ? "Không tìm thấy câu hỏi" : "Question Not Found"}
        subTitle={
          isVi
            ? "Câu hỏi bạn đang tìm không tồn tại hoặc đã bị xóa."
            : "The question you are looking for does not exist or has been removed."
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/questions")}
            >
              {isVi ? "Quay lại danh sách câu hỏi" : "Back to Questions"}
            </Button>
          </Space>
        }
      />
    </Flex>
  );
}
