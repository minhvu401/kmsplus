"use server"

import { sql } from "@/lib/database"
import { z } from "zod"

export type Quiz = {
    id: number,
    course_id: number,
    title: string,
    description: string | null,
    time_limit_minutes: number | null,
    passing_score: number,
    max_attempts: number,
    available_from: Date | null,
    available_to: Date | null,
    is_deleted: boolean,
    deleted_at: Date | null,
    created_at: Date,
    updated_at: Date
}

export type QuizAttempt = {
    id: number,
    quiz_id: number,
    user_id: number,
    attempt_number: number,
    status: 'in_progress' | 'completed' | 'abandoned',
    score: number | null,
    total_questions: number,
    correct_answers: number | null,
    time_spent_seconds: number | null,
    started_at: Date,
    submitted_at: Date | null,
}

export type Question = {
    id: number;
    question_text: string;
    type: 'single_choice' | 'multiple_choice';
    options: string[];
};

type AttemptRow = {
    id: number;
    status: 'in_progress' | 'submitted';
    started_at: Date;
}

type AttemptStats = {
    correct_answers: number;
    score: number;
}

type QuestionRow = {
    type: 'single_choice' | 'multiple_choice';
    correct_answer: any;
};

export async function getQuizDetails(id: number): Promise<Quiz> {
    const result = await sql`
        SELECT * 
        FROM quizzes
        WHERE id = ${id} AND is_deleted = FALSE
    `
    return result[0] as Quiz
}

export async function startQuizAttempt(quiz_id: number, user_id: number, total_questions: number): Promise<QuizAttempt> {
    // Check for existing in-progress attempt
    const existingAttempt = await sql`
        SELECT * FROM quiz_attempts
        WHERE quiz_id = ${quiz_id} AND user_id = ${user_id} AND status = 'in_progress'
        LIMIT 1
    `
    if (existingAttempt.length > 0) {
        return existingAttempt[0] as QuizAttempt;
    }

    // Create new attempt if not
    const newAttempt = await sql`
        INSERT INTO quiz_attempts (
            quiz_id,
            user_id, 
            attempt_number,
            total_questions
        ) VALUES (
            ${quiz_id},
            ${user_id},
            (
                SELECT COALESCE(MAX(attempt_number), 0) + 1
                FROM quiz_attempts
                WHERE quiz_id = ${quiz_id}
                AND user_id = ${user_id}
            ),
            ${total_questions}
        )
        RETURNING *
    `
    return newAttempt[0] as QuizAttempt
}

export async function submitQuizAttempt(
    attemptId: number,
    userId: number
) {
    try {
        // 1️⃣ Begin transaction
        await sql`BEGIN`;

        // 2️⃣ Lock attempt
        const attemptResult = await sql`
            SELECT id, status, started_at
            FROM quiz_attempts
            WHERE id = ${attemptId}
                AND user_id = ${userId}
            FOR UPDATE;
        ` as AttemptRow[];

        if (attemptResult.length === 0) {
            throw new Error('Attempt not found');
        }

        if (attemptResult[0].status !== 'in_progress') {
            throw new Error('Attempt already submitted');
        }

        // 3️⃣ Calculate stats
        const stats = await sql`
            SELECT
            COUNT(*) FILTER (WHERE is_correct = true) AS correct_answers,
            COALESCE(SUM(points_earned), 0)          AS score
            FROM attempt_answers
            WHERE attempt_id = ${attemptId};
        ` as AttemptStats[];

        const { correct_answers, score } = stats[0];

        // 4️⃣ Finalize attempt
        const updated = await sql`
            UPDATE quiz_attempts
            SET
            status = 'submitted',
            submitted_at = CURRENT_TIMESTAMP,
            correct_answers = ${correct_answers},
            score = ${score},
            time_spent_seconds = EXTRACT(
            EPOCH FROM (CURRENT_TIMESTAMP - started_at)
            )::int
            WHERE id = ${attemptId}
            RETURNING *;
        `;

        // 5️⃣ Commit
        await sql`COMMIT`;

        return updated[0];

    } catch (error) {
        // 6️⃣ Rollback on failure
        await sql`ROLLBACK`;
        throw error;
    }
}

export async function saveAttemptAnswer(
    attemptId: number,
    userId: number,
    questionId: number,
    selectedAnswer: number | number[]
) {
    // 1️⃣ Verify attempt is valid and active
    const attempt = await sql`
    SELECT id, status
    FROM quiz_attempts
    WHERE id = ${attemptId}
        AND user_id = ${userId};
  `;

    if (attempt.length === 0) {
        throw new Error('Attempt not found');
    }

    if (attempt[0].status !== 'in_progress') {
        throw new Error('Cannot answer a submitted attempt');
    }

    // 2️⃣ Load question data
    const questionResult = (await sql`
    SELECT type, correct_answer
    FROM question_bank
    WHERE id = ${questionId}
      AND is_deleted = false;
  `) as QuestionRow[];

    if (questionResult.length === 0) {
        throw new Error('Question not found');
    }

    const { type, correct_answer } = questionResult[0];

    // 3️⃣ Determine correctness
    let isCorrect = false;

    if (type === 'single_choice') {
        isCorrect = selectedAnswer === correct_answer;

    } else if (type === 'multiple_choice') {
        
        const selectedArray = Array.isArray(selectedAnswer)
            ? selectedAnswer
            : [selectedAnswer];

        if (!Array.isArray(correct_answer)) {
            throw new Error('Invalid answer format');
        }

        const selectedSet = new Set(selectedArray);
        const correctSet = new Set(correct_answer);

        isCorrect =
            selectedSet.size === correctSet.size &&
            [...selectedSet].every(v => correctSet.has(v));
    }

    // 4️⃣ Calculate points
    const pointsEarned = isCorrect ? 1 : 0;

    // 5️⃣ UPSERT answer
    await sql`
    INSERT INTO attempt_answers (
      attempt_id,
      question_id,
      selected_option_id,
      is_correct,
      points_earned
    )
    VALUES (
      ${attemptId},
      ${questionId},
      ${JSON.stringify(selectedAnswer)},
      ${isCorrect},
      ${pointsEarned}
    )
    ON CONFLICT (attempt_id, question_id)
    DO UPDATE SET
      selected_option_id = EXCLUDED.selected_option_id,
      is_correct = EXCLUDED.is_correct,
      points_earned = EXCLUDED.points_earned,
      answered_at = CURRENT_TIMESTAMP;
  `;
}

export async function getQuestionsForAttempt(attemptId: number): Promise<Question[]> {
    const result = await sql`
        SELECT qb.id, qb.question_text, qb.type, qb.options
        FROM question_bank qb
        JOIN quiz_questions qq ON qb.id = qq.question_id
        JOIN quiz_attempts qa ON qa.quiz_id = qq.quiz_id
        WHERE qa.id = ${attemptId} AND qb.is_deleted = FALSE
    `;
    return result as Question[];
}

export async function getTimeLimitForAttempt(attemptId: number): Promise<number | null> {
    const result = await sql`
        SELECT q.time_limit_minutes
        FROM quizzes q
        JOIN quiz_attempts qa ON qa.quiz_id = q.id
        WHERE qa.id = ${attemptId}
    `;
    return result[0]?.time_limit_minutes || null;
}

export async function getSavedAnswers(attemptId: number) {
  return sql`
    SELECT
      question_id,
      selected_option_id
    FROM attempt_answers
    WHERE attempt_id = ${attemptId};
  `;
}