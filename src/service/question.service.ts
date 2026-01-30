"use server"

import { sql } from "@/lib/database"
import type {
  CreateAnswerDtoType,
  CreateQuestionDtoType,
  UpdateAnswerDtoType,
  UpdateQuestionDtoType,
} from "@/action/question/dto/question.dto"

export type ActionResult = {
  success?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
}

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
export async function createQuestionAction(
  input: CreateQuestionDtoType
): Promise<ActionResult> {
  const { title, content, category_id, user_id } = input

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
export async function updateQuestionAction(
  input: UpdateQuestionDtoType
): Promise<ActionResult> {
  const { title, content, category_id, id } = input

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
export async function deleteQuestionAction(id: string): Promise<ActionResult> {
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
export async function closeQuestionAction(id: string): Promise<ActionResult> {
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
export async function openQuestionAction(id: string): Promise<ActionResult> {
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

const DEFAULT_QUESTIONS_PER_PAGE = 10
// FETCH QUESTIONS PAGES
export async function fetchQuestionPagesAction(
  query: string,
  category: string,
  status: string,
  limit: number = DEFAULT_QUESTIONS_PER_PAGE
) {
  try {
    let sqlQuery = sql`
      WHERE ( users.full_name ILIKE ${"%" + query + "%"} OR
       users.email ILIKE ${"%" + query + "%"} OR
       questions.title ILIKE ${"%" + query + "%"} OR
       questions.content ILIKE ${"%" + query + "%"})
      AND questions.deleted_at IS NULL
    `

    // Add optional filters dynamically
    // Only filter by category if it's a valid numeric ID
    const categoryId = parseInt(category, 10)
    if (category !== "any" && !isNaN(categoryId)) {
      sqlQuery = sql`${sqlQuery} AND categories.id = ${categoryId}`
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
      JOIN categories ON questions.category_id = categories.id
      ${sqlQuery};
    `

    const totalItems = Number(data[0].count)
    const pageSize = Math.max(1, limit || DEFAULT_QUESTIONS_PER_PAGE)
    const totalPages = Math.ceil(totalItems / pageSize)
    return { totalItems, totalPages: Math.max(1, totalPages) }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch total number of questions.")
  }
}

// FETCH FILTERED QUESTIONS
export async function fetchFilteredQuestionsAction(
  query: string,
  category: string,
  status: string,
  sort: string,
  currentPage: number,
  limit: number = DEFAULT_QUESTIONS_PER_PAGE
): Promise<Question[]> {
  const pageSize = Math.max(1, limit || DEFAULT_QUESTIONS_PER_PAGE)
  const offset = (currentPage - 1) * pageSize

  try {
    let sqlQuery = sql`
      WHERE ( users.full_name ILIKE ${'%' + query + '%'} OR
       users.email ILIKE ${'%' + query + '%'} OR
       questions.title ILIKE ${'%' + query + '%'} OR
       questions.content ILIKE ${'%' + query + '%'})
      AND questions.deleted_at IS NULL
    `;

    // Add category filter if it's a valid numeric ID
    const categoryId = parseInt(category, 10)
    if (category !== "any" && !isNaN(categoryId)) {
      sqlQuery = sql`
        ${sqlQuery} 
        AND categories.id = ${categoryId}
      `
    }

    // Add status filter
    if (status !== "any") {
      const isClosed = status === "closed"
      sqlQuery = sql`${sqlQuery} AND questions.is_closed = ${isClosed}`
    }

    // Add sort order
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
      LIMIT ${pageSize} OFFSET ${offset};
    `) as Question[]

    return result
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch filtered questions.")
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

export async function getAnswerDetailsAction(id: number): Promise<Answer> {
  const result = await sql`
    SELECT 
      answers.id, answers.question_id, answers.user_id, answers.content,
      answers.created_at, answers.updated_at,
      users.full_name AS user_name
    FROM answers
    JOIN users ON answers.user_id = users.id
    WHERE answers.id = ${id}
  `
  return result[0] as Answer
}

// CREATE ANSWER
export async function createAnswerAction(
  input: CreateAnswerDtoType
): Promise<ActionResult> {
  const { content, user_id, question_id } = input
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
export async function updateAnswerAction(
  input: UpdateAnswerDtoType
): Promise<ActionResult> {
  const { content, answer_id } = input

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
export async function deleteAnswerAction(id: number): Promise<ActionResult> {
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
const DEFAULT_ANSWERS_PER_PAGE = 5

export async function fetchFilteredAnswersAction(
  currentPage: number,
  questionId: number,
  limit: number = DEFAULT_ANSWERS_PER_PAGE
) {
  const pageSize = Math.max(1, limit || DEFAULT_ANSWERS_PER_PAGE)
  const offset = (currentPage - 1) * pageSize
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
    LIMIT ${pageSize} OFFSET ${offset};
  `;
    return data as Answer[];
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch filtered answers.")
  }
};