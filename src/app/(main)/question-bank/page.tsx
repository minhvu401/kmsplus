import { QuestionType, PaginatedQuestionsResponse } from '@/service/questionbank.service';
import * as actions from '@/action/question-bank/questionBankActions';
import CreateQuestionModalWrapper from './create/create-question-modal-wrapper';
import Pagination from '@/components/ui/questions/pagination';
import { QuestionBankTable } from './question-bank-table';
import PageSizeSelector from './page-size-selector';

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

    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold m-0">
                    Question Bank
                </h2>
                <CreateQuestionModalWrapper />
            </div>

            {/* Table */}
            <QuestionBankTable questions={questions} currentPage={currentPage} categories={categories} />

            {/* Page Size Selector */}
            <div className="flex justify-end my-6">
                <PageSizeSelector currentPageSize={pageSize} />
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8">
                <Pagination totalPages={totalPages} />
            </div>

            {/* Info */}
            <div className="text-center text-gray-600 mt-4 text-sm">
                Showing {questions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} questions
            </div>
        </div>
    );
}