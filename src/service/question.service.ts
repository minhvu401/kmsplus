"use server"

import { sql } from "@/lib/neonClient"
import { z } from 'zod'
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

/**
 * Type cho Question response
 */
export type Question = {
  id: number
  user_id: number
  category_id: number | null
  title: string
  content: string
  view_count: number
  answer_count: number
  is_closed: boolean
  is_deleted: boolean
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
}

// GET ALL QUESTIONS
export async function getAllQuestionsAction(): Promise<Question[]> {
  const questions = await sql`
    SELECT 
      id, user_id, category_id, title,
      content, view_count, answer_count, is_closed,
      is_deleted, deleted_at, created_at, updated_at
    FROM questions
    ORDER BY created_at DESC
  `
  // Debug log
  console.log("Fetched questions:", questions)

  return questions as Question[]
}

// CREATE QUESTIONS
// Define validation schema using Zod
const CreateQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must be under 150 characters'),
  content: z
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(3000, 'Content must be under 3000 characters'),
  category_id: z.coerce.number().int(),
  user_id: z.coerce.number().int(), // or from session later
})

// Server Action
export async function createQuestionAction(formData: FormData) {
  // Validate input
  const validatedFields = CreateQuestionSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    category_id: formData.get('category_id'),
    user_id: formData.get('user_id'),
  })

  // Return validation errors if invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create question.',
    }
  }
  const { title, content, category_id, user_id } = validatedFields.data

  // Timestamp
  const createdAt = new Date().toLocaleString()

  try {
    // Insert question into DB
    await sql`
      INSERT INTO questions (
        user_id, category_id, title, content, view_count, answer_count,
        is_closed, is_deleted, created_at, updated_at, deleted_at
      ) VALUES (
        ${user_id}, ${category_id}, ${title}, ${content}, 0, 0, 
        false, false, ${createdAt}, ${createdAt}, NULL
      )
    `
  } catch (error) {
    console.error('Error creating question:', error)
    return {
      message: 'Database error. Failed to create question.',
    }
  }

  // Revalidate and redirect user back to the questions list
  revalidatePath('/questions')
  redirect('/questions')
}

// UPDATE QUESTIONS
const UpdateQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must be under 150 characters'),
  content: z
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(3000, 'Content must be under 3000 characters'),
  category_id: z.coerce.number().int(),
  id: z.coerce.number().int()
})
export async function updateQuestionAction(formData: FormData) {
  // Validate form data
  const validatedFields = UpdateQuestionSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    category_id: formData.get('category_id'),
    id: formData.get('id'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid or missing fields. Failed to update question.',
    }
  }
  const { title, content, category_id, id } = validatedFields.data

  const updatedAt = new Date().toLocaleString()

  try {
    await sql`
      UPDATE questions
      SET
        title = ${title},
        content = ${content},
        category_id = ${category_id},
        updated_at = ${updatedAt}
      WHERE id = ${id}
    `
  } catch (error) {
    console.error('Error updating question:', error)
    return { message: 'Database error. Failed to update question.' }
  }

  revalidatePath('/questions')
  redirect('/questions')
}

// DELETE QUESTIONS
export async function deleteQuestionAction(id: string) {
  const deletedAt = new Date().toLocaleString()

  try {
    await sql`
      UPDATE questions
      SET
        is_deleted = TRUE,
        deleted_at = ${deletedAt}
      WHERE id = ${id}
    `
  } catch (error) {
    console.error('Error deleting question:', error)
    return { message: 'Databased error. Failed to delete question.' }
  }
  revalidatePath('/questions');
  redirect('/question');
}

// CLOSE QUESTIONS
export async function closeQuestionAction(id: string) {
  const closedAt = new Date().toLocaleString()

  try {
    await sql`
      UPDATE questions
      SET
        is_closed = TRUE,
        updated_at = ${closedAt}
      WHERE id = ${id}
    `
  } catch (error) {
    console.error('Error closing question:', error)
    return { message: 'Databased error. Failed to close question.' }
  }
  revalidatePath('/questions');
  redirect('/question');
}

// OPEN QUESTIONS
export async function openQuestionAction(id: string) {
  const openedAt = new Date().toLocaleString()

  try {
    await sql`
      UPDATE questions
      SET
        is_closed = FALSE,
        updated_at = ${openedAt}
      WHERE id = ${id}
    `
  } catch (error) {
    console.error('Error opening question:', error)
    return { message: 'Databased error. Failed to open question.' }
  }
  revalidatePath('/questions');
  redirect('/question');
}


// GET CATEGORIES
export type Category = {
  id: number
  name: string
  slug: string
}

export async function getActiveCategoriesAction(): Promise<Category[]> {
  const result = await sql`
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS slug,
      p.id AS parent_id,
      p.name AS parent_name
    FROM categories AS c
    LEFT JOIN categories AS p ON c.parent_id = p.id
    WHERE c.is_deleted = FALSE
    ORDER BY c.id
  `

  const categories: Category[] = result.map((row: any) => {
    if (row.parent_id) {
      return {
        id: row.category_id,
        name: row.parent_name + ' - ' + row.category_name,
        slug: row.slug
      };
    } else {
      return {
        id: row.category_id,
        name: row.category_name,
        slug: row.slug
      };
    }
  });

  return categories as Category[]
}

const ITEMS_PER_PAGE = 5;
// FETCH QUESTIONS PAGES 
export async function fetchQuestionPagesAction(query: string, category: string, status: string) {
  try {

    let sqlQuery = sql`
      WHERE ( users.full_name ILIKE ${'%' + query + '%'} OR
       users.email ILIKE ${'%' + query + '%'} OR
       questions.title ILIKE ${'%' + query + '%'} OR
       questions.content ILIKE ${'%' + query + '%'})
    `;

    // Add optional filters dynamically
    if (category !== "any") {
      sqlQuery = sql`
      JOIN categories ON questions.category_id = categories.id
      ${sqlQuery} 
      AND categories.slug = ${category}
      `;
    }

    if (status !== "any") {
      let isClosed
      if (status === "closed") {
        isClosed = true;
      } else if (status === "open") {
        isClosed = false;
      }
      sqlQuery = sql`${sqlQuery} AND questions.is_closed = ${isClosed}`;
    }

    // Final query
    const data = await sql`
      SELECT COUNT(*) AS count
      FROM questions
      JOIN users ON questions.user_id = users.id
      ${sqlQuery};
    `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

// FETCH FILTERED QUESTIONS
export type ListedQuestion = {
  id: number
  user_id: number
  category_id: number | null
  title: string
  content: string
  view_count: number
  answer_count: number
  is_closed: boolean
  is_deleted: boolean
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
  user_name: string
  category_name: string
}

export async function fetchFilteredQuestionsAction(query: string, category: string, status: string, sort: string, currentPage: number) {

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {

    let sqlQuery = sql`
      WHERE ( users.full_name ILIKE ${'%' + query + '%'} OR
       users.email ILIKE ${'%' + query + '%'} OR
       questions.title ILIKE ${'%' + query + '%'} OR
       questions.content ILIKE ${'%' + query + '%'})
      AND questions.is_deleted = FALSE
    `;

    // Add optional filters dynamically
    if (category !== "any") {
      sqlQuery = sql`
      ${sqlQuery} 
      AND categories.slug = ${category}
      `;
    }

    if (status !== "any") {
      let isClosed
      if (status === "closed") {
        isClosed = true;
      } else if (status === "open") {
        isClosed = false;
      }
      sqlQuery = sql`${sqlQuery} AND questions.is_closed = ${isClosed}`;
    }

    if (sort !== "newest") {
      if (sort !== "most-views") {
        sqlQuery = sql`${sqlQuery} ORDER BY questions.answer_count DESC`
      } else {
        sqlQuery = sql`${sqlQuery} ORDER BY questions.view_count DESC`
      }
    } else {
      sqlQuery = sql`${sqlQuery} ORDER BY questions.created_at DESC`
    }

    // Final query
    const result = (await sql`
      SELECT questions.*, users.full_name AS user_name, categories.name AS category_name
      FROM questions
      JOIN users ON questions.user_id = users.id
      JOIN categories ON questions.category_id = categories.id
      ${sqlQuery}
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset};
    `) as ListedQuestion[];

    return result;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

