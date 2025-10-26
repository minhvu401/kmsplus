'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { State, createQuestion } from '@/action/question/questionActions';

export default function CreateQuestionForm({
    categories,
    userId,
}: {
    categories: { id: number; name: string }[];
    userId: number;
}) {
    const initialState: State = { message: null, errors: {} };
    const [state, createQuestionAction] = useActionState(createQuestion, initialState);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const MAX_TITLE = 150;
    const MAX_CONTENT = 3000;

    return (
        <form action={createQuestionAction} className="w-full space-y-10 text-gray-700">
            <input type="hidden" name="user_id" value={userId} />

            {/* Heading */}
            <h1 className="text-3xl font-bold text-blue-600">Ask a Question</h1>
            <hr className="border-gray-300" />

            {/* Title */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                <label className="text-base font-semibold pt-2">Title</label>
                <div className="w-full">
                    <input
                        type="text"
                        name="title"
                        maxLength={MAX_TITLE}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Write your question title here..."
                        className="w-full border border-gray-300 rounded-md p-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Character limit</span>
                        <span>{title.length} / {MAX_TITLE}</span>
                    </div>
                    {state.errors?.title?.map((err: string) => (
                        <p key={err} className="text-red-500 text-sm mt-1">{err}</p>
                    ))}
                </div>
            </div>

            <hr className="border-gray-300" />

            {/* Content */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                <label className="text-base font-semibold pt-2">Content</label>
                <div className="w-full">
                    <textarea
                        name="content"
                        rows={8}
                        maxLength={MAX_CONTENT}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Provide more details about your question..."
                        className="w-full border border-gray-300 rounded-md p-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Character limit</span>
                        <span>{content.length} / {MAX_CONTENT}</span>
                    </div>
                    {state.errors?.content?.map((err: string) => (
                        <p key={err} className="text-red-500 text-sm mt-1">{err}</p>
                    ))}
                </div>
            </div>

            <hr className="border-gray-300" />

            {/* Category */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
                <label className="text-base font-semibold">Category</label>
                <select
                    name="category_id"
                    defaultValue=""
                    className="border border-gray-300 rounded-md p-3 text-base bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="" disabled>Select category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                {state.errors?.category_id?.map((err: string) => (
                    <p key={err} className="text-red-500 text-sm mt-1">{err}</p>
                ))}
            </div>

            <hr className="border-gray-300" />

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 pt-2">
                <Link
                    href="/questions"
                    className="px-6 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 text-base font-medium"
                >
                    Leave
                </Link>

                <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-base font-medium"
                >
                    Submit
                </button>
            </div>

            {state.message && (
                <p className="text-base text-red-500 mt-4">{state.message}</p>
            )}
        </form>
    );
}
