import Link from "next/link"
import { PlusCircleOutlined } from "@ant-design/icons"

export function CreateQuestion() {
  return (
    <Link
      href="/questions/create"
      className="gap flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shadow-lg"
    >
      <PlusCircleOutlined className="w-5 h-5" />
      <span className="hidden md:block">Ask A Question</span>{" "}
    </Link>
  )
}
