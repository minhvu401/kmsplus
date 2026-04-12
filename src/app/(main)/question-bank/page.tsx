import { QuestionType, PaginatedQuestionsResponse } from '@/service/questionbank.service';
import * as actions from '@/action/question-bank/questionBankActions';
import QuestionBankClient from './QuestionBankClient';

export default async function QuestionBankPage(props: {
    searchParams?: Promise<{
        page?: string;
        limit?: string;
        query?: string;
        type?: string;
        category?: string;
        sort?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const currentPage = Number(searchParams?.page) || 1;
    const pageSize = Number(searchParams?.limit) || 10;
    const query = searchParams?.query || '';
    const type = searchParams?.type || 'all';
    const categoryParam = searchParams?.category || 'all';
    const sort = searchParams?.sort === 'oldest' ? 'oldest' : 'newest';
    let selectedCategory = categoryParam;

    // Fetch data from server
    let questions: QuestionType[] = [];
    let totalItems = 0;
    let categories: Record<string, any>[] = [];
    let currentUserId: number | null = null;
    let isSystemAdmin = false;

    try {
        const viewerContext = await actions.getQuestionBankViewerContext();
        currentUserId = viewerContext.currentUserId;
        isSystemAdmin = viewerContext.isSystemAdmin;

        const cats = await actions.getCategories();
        categories = cats;

        const allowedCategoryNames = new Set(
            cats.map((cat: Record<string, any>) => String(cat.name))
        );
        selectedCategory =
            categoryParam !== 'all' && !allowedCategoryNames.has(categoryParam)
                ? 'all'
                : categoryParam;

        const response: PaginatedQuestionsResponse = await actions.getQuestions(currentPage, pageSize, {
            query,
            type: type as 'single_choice' | 'multiple_choice' | 'all',
            category: selectedCategory,
            sort,
        });
        questions = response.data;
        totalItems = response.totalItems;
    } catch (error) {
        console.error('Error loading data:', error);
    }

    return (
        <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <QuestionBankClient
                    questions={questions}
                    totalItems={totalItems}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    categories={categories}
                    query={query}
                    selectedType={type}
                    selectedCategory={selectedCategory}
                    sortOrder={sort}
                    currentUserId={currentUserId}
                    isSystemAdmin={isSystemAdmin}
                />
            </div>
        </div>
    );
}