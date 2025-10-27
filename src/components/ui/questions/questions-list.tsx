import { fetchFilteredQuestions } from '@/action/question/questionActions';
import Link from 'next/link';
import { formatDistanceToNowStrict } from "date-fns";

export default async function QuestionsList({
    query,
    category,
    status,
    sort,
    currentPage,
}: {
    query: string;
    category: string;
    status: string;
    sort: string;
    currentPage: number;
}) {

    const questions = await fetchFilteredQuestions(query, category, status, sort, currentPage);

    return (
        <div className="space-y-8">
            {questions.map(q => (
                <div
                    key={q.id}
                    className="border-b pb-6 flex flex-col gap-3"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            {/* Title */}
                            <Link href={`/questions/${q.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
                                {q.title}
                            </Link>

                            {/* Content (truncate) */}
                            <p className="text-gray-600 line-clamp-2 whitespace-pre-wrap">
                                {q.content}
                            </p>
                        </div>

                        {/* Right side: Answer + view count */}
                        <div className="text-right shrink-0">
                            <p className="font-semibold text-gray-700">
                                {q.answer_count} answers
                            </p>
                            <p className="font-semibold text-gray-700">
                                {q.view_count} views
                            </p>
                        </div>
                    </div>

                    <div className="font-bold flex justify-between items-center mt-4 text-sm text-gray-600">
                        {/* Category + Status */}
                        <div className="flex gap-3 items-center">
                            <span className="inline-flex items-center h-6 px-3 rounded bg-blue-600 text-white text-sm leading-none whitespace-nowrap">
                                {q.category_name}
                            </span>
                            <span
                                className={`inline-flex items-center h-6 px-3 rounded text-white text-sm leading-none whitespace-nowrap ${q.is_closed ? "bg-red-500" : "bg-green-500"
                                    }`}
                            >
                                {q.is_closed ? "Closed" : "Open"}
                            </span>
                        </div>

                        {/* Username */}
                        <span className="font-bold text-gray-700 self-center">
                            {q.user_name} asked {formatDistanceToNowStrict(new Date(q.created_at), { addSuffix: true})}
                        </span>

                    </div>
                </div>
            ))}
        </div>
    );
}
