import { QuestionType, PaginatedQuestionsResponse } from '@/service/questionbank.service';
import * as actions from '@/action/question-bank/questionBankActions';
import QuestionBankClient from './QuestionBankClient';

export default async function QuestionBankPage(props: {
    searchParams?: Promise<{
        page?: string;
        limit?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const currentPage = Number(searchParams?.page) || 1;
    const pageSize = Number(searchParams?.limit) || 10;

    // Fetch data from server
    let questions: QuestionType[] = [];
    let totalItems = 0;
    let categories: Record<string, any>[] = [];

    try {
        const response: PaginatedQuestionsResponse = await actions.getQuestions(currentPage, pageSize);
        questions = response.data;
        totalItems = response.totalItems;
        
        const cats = await actions.getCategories();
        categories = cats;
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
                />
            </div>
        </div>
    );
}