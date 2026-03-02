import Pagination from "@/components/ui/questions/pagination"
import PageSizeSelector from "@/components/ui/questions/page-size-selector"
import ManageQuestionsTable from "@/components/ui/questions/manage-questions"
import { fetchFilteredQuestions, fetchQuestionsPages } from "@/action/question/questionActions"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import Search from "@/components/ui/questions/search"
import { CreateQuestion } from "@/components/ui/questions/create-button"
import {
    FilterCategory,
    FilterStatus,
    SortBy,
} from "@/components/ui/questions/filters"
import { getActiveCategories } from "@/action/question/questionActions"
import { Flex } from "antd"
import PageWrapper from "@/components/ui/questions/page-wrapper"
import QuestionsNotification from "@/components/ui/questions/questions-notification"

export default async function QuestionsManagePage(props: {
    searchParams?: Promise<{
        page?: string
        limit?: string
        query?: string
        category?: string
        status?: string
        sort?: string
    }>
}) {
    const user = await requirePermission(Permission.READ_QUESTION)

    const searchParams = await props.searchParams
    const currentPage = Number(searchParams?.page) || 1
    const pageSize = Number(searchParams?.limit) || 10
    const query = searchParams?.query || ""
    const category = searchParams?.category || "any"
    const status = searchParams?.status || "any"
    const sort = searchParams?.sort || "newest"
    const categories = await getActiveCategories()

    const { totalItems, totalPages } = await fetchQuestionsPages(
        query,
        category,
        status,
        pageSize
    )

    const questions = await fetchFilteredQuestions(
        query,
        category,
        status,
        sort,
        currentPage,
        pageSize
    ) ?? []

    return (
        <PageWrapper>
            <Flex className="p-6" vertical>
                <QuestionsNotification />
                {/* Header */}
                <Flex className="mb-6">
                    <Flex className="flex items-center justify-between mb-6">
                        <Flex>
                            <h1 className="text-gray-600 text-3xl font-bold">Manage forum questions</h1>
                        </Flex>
                    </Flex>
                </Flex>

                <Flex align="center" gap={28} style={{ marginBottom: 24 }}>
                    <Search placeholder="Search questions..." />
                    <CreateQuestion />
                </Flex>

                <Flex
                    align="center"
                    gap={56}
                    style={{ marginBottom: 24, width: "100%" }}
                >
                    <FilterCategory categories={categories} />
                    <FilterStatus />
                    <SortBy />
                </Flex>

                {/* Table */}
                <ManageQuestionsTable questions={questions} />

                {/* Page Size Selector */}
                <Flex className="flex justify-end my-6">
                    <PageSizeSelector currentPageSize={pageSize} />
                </Flex>

                {/* Pagination */}
                <Flex className="flex justify-center mt-8">
                    <Pagination totalPages={totalPages} />
                </Flex>

                {/* Info */}
                <Flex className="flex justify-center text-gray-600 mt-4 text-sm">
                    Showing {questions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} questions
                </Flex>
            </Flex>
        </PageWrapper>
    )
}
