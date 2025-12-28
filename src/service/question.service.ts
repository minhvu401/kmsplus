"use server"

import { sql } from "@/lib/database"
import { success, z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

//TYPE FOR 'QUESTION' RESPONSE
export type Question = {
  id: number
  user_id: number
  category_id: number | null
  title: string
  content: string
  answer_count: number
  is_closed: boolean
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
  user_name: string
  category_name: string
};

//TYPE FOR 'ANSWER' RESPONSE
export type Answer = {
  id: number
  question_id: number
  user_id: number
  content: string
  created_at: Date
  updated_at: Date
  user_name: string
};

// GET ALL QUESTIONS
export async function getAllQuestionsAction(): Promise<Question[]> {
  const questions = await sql`
    SELECT 
      questions.id, questions.user_id, questions.category_id, questions.title,
      questions.content, questions.answer_count, questions.is_closed,
      questions.deleted_at, questions.created_at, questions.updated_at,
      users.name AS user_name, categories.name AS category_name
    FROM questions
    JOIN users ON questions.user_id = users.id
    JOIN categories ON questions.category_id = categories.id
  `
  // Debug log
  console.log("Fetched questions:", questions)

  return questions as Question[]
}

// GET QUESTION DETAILS
export async function getQuestionDetailsAction(id: string): Promise<Question> {
  const result = await sql`
   SELECT 
      questions.id, questions.user_id, questions.category_id, questions.title,
      questions.content, questions.answer_count, questions.is_closed,
      questions.deleted_at, questions.created_at, questions.updated_at,
      users.full_name AS user_name, categories.name AS category_name
    FROM questions
    JOIN users ON questions.user_id = users.id
    JOIN categories ON questions.category_id = categories.id
    WHERE questions.id = ${id}
  `
  return result[0] as Question
}

// CREATE QUESTIONS
// Define validation schema using Zod
const CreateQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),
  content: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      return val.replace(/\r\n/g, '\n');
    },
    z
      .string()
      .min(10, "Content must be at least 10 characters")
      .max(3000, "Content must be under 3000 characters")
  ),
  category_id: z
    .coerce
    .number()
    .int()
    .min(1, "Please select a category"),
  user_id: z.coerce.number().int(), // or from session later
})

// Server Action
export async function createQuestionAction(formData: FormData) {
  // Validate input
  const validatedFields = CreateQuestionSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category_id: formData.get("category_id"),
    user_id: formData.get("user_id"),
  })

  // Return validation errors if invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to create question.",
    }
  }
  const { title, content, category_id, user_id } = validatedFields.data

  // Timestamp
  const createdAt = new Date().toLocaleString()

  try {
    // Insert question into DB
    await sql`
      INSERT INTO questions (
        user_id, category_id, title, content, answer_count,
        is_closed, created_at, updated_at, deleted_at
      ) VALUES (
        ${user_id}, ${category_id}, ${title}, ${content}, 0, 
        false, ${createdAt}, ${createdAt}, NULL
      )
    `
  } catch (error) {
    console.error("Error creating question:", error)
    return {
      message: "Database error. Failed to create question.",
    }
  }

  return {
    message: "Question created successfully",
    errors: {},
    success: true,
  }
}

// UPDATE QUESTIONS
const UpdateQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),
  content: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      return val.replace(/\r\n/g, '\n');
    },
    z
      .string()
      .min(10, "Content must be at least 10 characters")
      .max(3000, "Content must be under 3000 characters")
  ),
  category_id: z.coerce.number().int(),
  id: z.coerce.number().int(),
})
export async function updateQuestionAction(formData: FormData) {
  // Validate form data
  const validatedFields = UpdateQuestionSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category_id: formData.get("category_id"),
    id: formData.get("id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid or missing fields. Failed to update question.",
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
    console.error("Error updating question:", error)
    return {
      message: "Database error. Failed to update question.",
    }
  }

  return {
    message: "Question updated successfully",
    errors: {},
    success: true,
  }
}

// DELETE QUESTIONS
export async function deleteQuestionAction(id: string) {
  const deletedAt = new Date().toLocaleString()

  try {
    await sql`
      UPDATE questions
      SET
        deleted_at = ${deletedAt}
      WHERE id = ${id}
    `
  } catch (error) {
    console.error("Error deleting question:", error)
    return {
      message: "Database error. Failed to delete question.",
    }
  }

  return {
    message: "Question deleted successfully",
    errors: {},
    success: true,
  }
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
    console.error("Error closing question:", error)
    return {
      message: "Database error. Failed to close question.",
    }
  }

  return {
    message: "Question closed successfully",
    errors: {},
    success: true,
  }
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
    console.error("Error opening question:", error)
    return {
      message: "Database error. Failed to open question.",
    }
  }

  return {
    message: "Question opened successfully",
    errors: {},
    success: true,
  }
}

// GET CATEGORIES
export type Category = {
  id: number
  name: string
}
export async function getActiveCategoriesAction(): Promise<Category[]> {
  const result = await sql`
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
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
        name: row.parent_name + " - " + row.category_name,
      }
    } else {
      return {
        id: row.category_id,
        name: row.category_name,
      }
    }
  })

  return categories as Category[]
}

const QUESTIONS_PER_PAGE = 10
// FETCH QUESTIONS PAGES
export async function fetchQuestionPagesAction(
  query: string,
  category: string,
  status: string
) {
  try {
    let sqlQuery = sql`
      WHERE ( users.full_name ILIKE ${"%" + query + "%"} OR
       users.email ILIKE ${"%" + query + "%"} OR
       questions.title ILIKE ${"%" + query + "%"} OR
       questions.content ILIKE ${"%" + query + "%"})
    `

    // Add optional filters dynamically
    if (category !== "any") {
      sqlQuery = sql`
      JOIN categories ON questions.category_id = categories.id
      ${sqlQuery} 
      AND categories.id = ${category}
      `
    }

    if (status !== "any") {
      let isClosed
      if (status === "closed") {
        isClosed = true
      } else if (status === "open") {
        isClosed = false
      }
      sqlQuery = sql`${sqlQuery} AND questions.is_closed = ${isClosed}`
    }

    // Final query
    const data = await sql`
      SELECT COUNT(*) AS count
      FROM questions
      JOIN users ON questions.user_id = users.id
      ${sqlQuery};
    `

    const totalPages = Math.ceil(Number(data[0].count) / QUESTIONS_PER_PAGE)
    return totalPages
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch total number of invoices.")
  }
}

// FETCH FILTERED QUESTIONS
export async function fetchFilteredQuestionsAction(
  query: string,
  category: string,
  status: string,
  sort: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * QUESTIONS_PER_PAGE

  try {
    let sqlQuery = sql`
      WHERE ( users.full_name ILIKE ${'%' + query + '%'} OR
       users.email ILIKE ${'%' + query + '%'} OR
       questions.title ILIKE ${'%' + query + '%'} OR
       questions.content ILIKE ${'%' + query + '%'})
      AND questions.deleted_at IS NULL
    `;

    // Add optional filters dynamically
    if (category !== "any") {
      sqlQuery = sql`
      ${sqlQuery} 
      AND categories.id = ${category}
      `
    }

    if (status !== "any") {
      let isClosed
      if (status === "closed") {
        isClosed = true
      } else if (status === "open") {
        isClosed = false
      }
      sqlQuery = sql`${sqlQuery} AND questions.is_closed = ${isClosed}`
    }

    if (sort !== "newest") {
      sqlQuery = sql`${sqlQuery} ORDER BY questions.answer_count DESC`
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
      LIMIT ${QUESTIONS_PER_PAGE} OFFSET ${offset};
    `) as Question[]

    return result
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch total number of invoices.")
  }
}

// ===================================== ANSWERS =====================================

// GET ANSWERS FOR A QUESTION
export async function getAnswersForQuestionAction(id: number): Promise<Answer[]> {

  const result = await sql`
    SELECT 
      answers.id, answers.question_id, answers.user_id, answers.content,
      answers.created_at, answers.updated_at,
      users.full_name AS user_name
    FROM answers
    JOIN users ON answers.user_id = users.id
    WHERE answers.question_id = ${id}
    ORDER BY answers.created_at ASC
  `

  return result as Answer[];
};

// CREATE ANSWER
const CreateAnswerSchema = z.object({
  content: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      return val.replace(/\r\n/g, '\n');
    },
    z
      .string()
      .min(15, "Content must be at least 15 characters")
      .max(600, "Content must be under 600 characters")
  ),
  user_id: z.coerce.number().int(), // or from session later
  question_id: z.coerce.number().int(),
})

export async function createAnswerAction(formData: FormData) {
  const validatedFields = CreateAnswerSchema.safeParse({
    content: formData.get("content"),
    user_id: formData.get("user_id"),
    question_id: formData.get("question_id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to create answer.",
    }
  }

  const { content, user_id, question_id } = validatedFields.data
  const createdAt = new Date().toLocaleString()

  try {
    // await sql`
    //   INSERT INTO answers (
    //     question_id, user_id, content, created_at, updated_at
    //   ) VALUES (
    //     ${question_id}, ${user_id}, ${content}, ${createdAt}, ${createdAt}
    //   )

    //   UPDATE questions
    //   SET answer_count = answer_count + 1
    //   WHERE id = ${question_id}
    // `
    await sql`
      WITH inserted_answer AS (
        INSERT INTO answers (
          question_id, user_id, content, created_at, updated_at
        ) VALUES (
          ${question_id}, ${user_id}, ${content}, ${createdAt}, ${createdAt}
        )
        RETURNING question_id
      )
      UPDATE questions
      SET answer_count = answer_count + 1
      WHERE id = (SELECT question_id FROM inserted_answer)
    `

  } catch (error) {
    console.error("Error creating answer:", error)
    return {
      message: "Database error. Failed to create answer.",
    }
  }

  return {
    message: "Answer created successfully",
    errors: {},
    success: true,
  }
}

// UPDATE ANSWER
const UpdateAnswerSchema = z.object({
  content: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      return val.replace(/\r\n/g, '\n');
    },
    z
      .string()
      .min(15, "Content must be at least 15 characters")
      .max(600, "Content must be under 600 characters")
  ),
  answer_id: z.coerce.number().int(),
})
export async function updateAnswerAction(formData: FormData) {
  // Validate form data
  const validatedFields = UpdateAnswerSchema.safeParse({
    content: formData.get("content"),
    answer_id: formData.get("answer_id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid or missing fields. Failed to update question.",
    }
  }
  const { content, answer_id } = validatedFields.data

  const updatedAt = new Date().toLocaleString()

  try {
    await sql`
      UPDATE answers
      SET
        content = ${content},
        updated_at = ${updatedAt}
      WHERE id = ${answer_id}
    `
  } catch (error) {
    console.error("Error updating answer:", error)
    return {
      message: "Database error. Failed to update answer.",
    }
  }

  return {
    message: "Answer updated successfully",
    errors: {},
    success: true,
  }
}

// DELETE ANSWER
export async function deleteAnswerAction(id: number) {
  try {
    await sql`
      WITH deleted_answer AS (
        DELETE FROM answers
        WHERE id = ${id}
        RETURNING question_id
      )
      UPDATE questions
      SET answer_count = answer_count - 1
      WHERE id = (SELECT question_id FROM deleted_answer)
    `
  } catch (error) {
    console.error("Error deleting question:", error)
    return {
      message: "Database error. Failed to delete question.",
    }
  }

  return {
    message: "Question deleted successfully",
    errors: {},
    success: true,
  }
};

// FETCH FILTERED ANSWERS
export async function fetchFilteredAnswersAction(currentPage: number, questionId: number) {
  const offset = (currentPage - 1) * 5;
  try {
    const data = await sql`
    SELECT
      a.id,
      a.question_id,
      a.user_id,
      a.content,
      a.created_at,
      a.updated_at,
      u.full_name AS user_name
    FROM answers a
    JOIN users u ON a.user_id = u.id
    WHERE a.question_id = ${questionId}
    ORDER BY a.created_at DESC
    LIMIT 5 OFFSET ${offset};
  `;
    return data as Answer[];
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch total number of invoices.")
  }
};