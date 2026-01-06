"use server"

import { requireAuth } from "@/lib/auth"
import * as service from "@/service/quiz.service"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { sql } from "@/lib/database"
import { z } from "zod"


export async function startQuizAttemptAction(quizId: number) {
    const user = await requireAuth();

    // totalQuestions should come from DB, not frontend
    const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM question_bank qb
    JOIN quiz_questions qq ON qb.id = qq.question_id
    WHERE qq.quiz_id = ${quizId} AND qb.deleted_at IS NULL;
  `;

    const totalQuestions = result[0].count;

    return service.startQuizAttempt(quizId, Number(user.id), totalQuestions);
}

export async function submitQuizAttemptAction(attemptId: number) {
    const user = await requireAuth();

    return service.submitQuizAttempt(attemptId, Number(user.id));
}

const SaveAnswerSchema = z.object({
    attemptId: z.coerce.number().int(),
    questionId: z.coerce.number().int(),
    selectedAnswer: z.union([
        z.coerce.number().int(),
        z.array(z.coerce.number().int()),
    ]),
});
export async function saveAttemptAnswerAction(input: unknown) {
    // 1️⃣ Validate payload
    const parsed = SaveAnswerSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error('Invalid answer payload');
    }

    const { attemptId, questionId, selectedAnswer } = parsed.data;

    // 2️⃣ Auth
    const user = await requireAuth();

    // 3️⃣ Save answer
    await service.saveAttemptAnswer(
        attemptId,
        Number(user.id),
        questionId,
        selectedAnswer
    );

    // 4️⃣ Minimal response
    return { success: true };
}