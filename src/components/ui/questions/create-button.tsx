import Link from 'next/link';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Flex } from "antd";

export function CreateQuestion() {
    return (
        <Flex justify="flex-end">
            <Link href="/questions/create">
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    size="large"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 500,
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <span className="hidden md:inline">Ask a Question</span>
                </Button>
            </Link>
        </Flex>
    );
}