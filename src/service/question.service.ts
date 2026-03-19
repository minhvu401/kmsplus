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
  parent_id: number | null
  content: string
  created_at: Date
  updated_at: Date
  user_name: string
};

// TYPE FOR 'TOP SHARER' RESPONSE
export type TopSharer = {
  id: number
  name: string
  score: number
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
      answers.id, answers.question_id, answers.user_id, answers.parent_id,
      answers.content, answers.created_at, answers.updated_at,
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
      answers.id, answers.question_id, answers.user_id, answers.parent_id,
      answers.content, answers.created_at, answers.updated_at,
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
  const { content, user_id, question_id, parent_id } = input
  const createdAt = new Date().toLocaleString()

  try {
    await sql`
      WITH inserted_answer AS (
        INSERT INTO answers (
          question_id, user_id, parent_id, content, created_at, updated_at
        ) VALUES (
          ${question_id}, ${user_id}, ${parent_id ?? null}, ${content}, ${createdAt}, ${createdAt}
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

// Type for nested reply structure (recursive)
type NestedReply = Answer & { replies: NestedReply[], reply_count?: number };

// Type for answers with nested replies (supports 4 levels inline)
export type AnswerWithReplies = Answer & {
  replies: NestedReply[]
  reply_count?: number // Total count of all nested replies
  has_deep_replies?: boolean // True if there are replies beyond depth 4
}

// FETCH ANSWER PAGES (only counts top-level answers)
export async function fetchAnswerPagesAction(
  questionId: number,
  limit: number = DEFAULT_ANSWERS_PER_PAGE
) {
  try {
    const data = await sql`
      SELECT COUNT(*) AS count
      FROM answers
      WHERE question_id = ${questionId} AND parent_id IS NULL
    `
    const totalItems = Number(data[0].count)
    const pageSize = Math.max(1, limit || DEFAULT_ANSWERS_PER_PAGE)
    const totalPages = Math.ceil(totalItems / pageSize)
    return { totalItems, totalPages: Math.max(1, totalPages) }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch total number of answers.")
  }
}

export async function fetchFilteredAnswersAction(
  currentPage: number,
  questionId: number,
  limit: number = DEFAULT_ANSWERS_PER_PAGE
): Promise<AnswerWithReplies[]> {
  const pageSize = Math.max(1, limit || DEFAULT_ANSWERS_PER_PAGE)
  const offset = (currentPage - 1) * pageSize
  try {
    // Fetch top-level answers (parent_id IS NULL) with pagination
    const topLevelAnswers = await sql`
      SELECT
        a.id,
        a.question_id,
        a.user_id,
        a.parent_id,
        a.content,
        a.created_at,
        a.updated_at,
        u.full_name AS user_name
      FROM answers a
      JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ${questionId} AND a.parent_id IS NULL
      ORDER BY a.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    ` as Answer[];

    if (topLevelAnswers.length === 0) {
      return [];
    }

    const topLevelIds = topLevelAnswers.map(a => a.id);

    // Fetch all replies up to 4 levels deep using recursive CTE
    const allReplies = await sql`
      WITH RECURSIVE reply_tree AS (
        SELECT 
          a.id, a.question_id, a.user_id, a.parent_id, a.content,
          a.created_at, a.updated_at, u.full_name AS user_name,
          1 as depth
        FROM answers a
        JOIN users u ON a.user_id = u.id
        WHERE a.parent_id = ANY(${topLevelIds})
        
        UNION ALL
        
        SELECT 
          a.id, a.question_id, a.user_id, a.parent_id, a.content,
          a.created_at, a.updated_at, u.full_name AS user_name,
          rt.depth + 1
        FROM answers a
        JOIN users u ON a.user_id = u.id
        JOIN reply_tree rt ON a.parent_id = rt.id
        WHERE rt.depth < 4
      )
      SELECT * FROM reply_tree
      ORDER BY created_at ASC;
    ` as (Answer & { depth: number })[];

    // Get IDs of level 4 replies to check for deeper replies
    const level4Ids = allReplies.filter(a => a.depth === 4).map(a => a.id);
    
    // Count deeper replies (level 5+) for each top-level answer
    let hasDeepReplies: Map<number, boolean> = new Map();
    if (level4Ids.length > 0) {
      // Check if any level 4 replies have children
      const deeperExists = await sql`
        SELECT DISTINCT parent_id
        FROM answers
        WHERE parent_id = ANY(${level4Ids})
      `;
      
      if (deeperExists.length > 0) {
        // Find which top-level answers have deep replies by tracing back
        const level4WithChildren = new Set(deeperExists.map((r: any) => r.parent_id));
        
        // For each top-level answer, check if any of its descendants at level 4 have children
        for (const topAnswer of topLevelAnswers) {
          const hasDeep = allReplies.some(reply => {
            if (reply.depth !== 4) return false;
            if (!level4WithChildren.has(reply.id)) return false;
            // Check if this reply is a descendant of topAnswer
            let current = reply;
            while (current.depth > 1) {
              const parent = allReplies.find(r => r.id === current.parent_id);
              if (!parent) break;
              current = parent;
            }
            return current.parent_id === topAnswer.id;
          });
          hasDeepReplies.set(topAnswer.id, hasDeep);
        }
      }
    }

    // Build nested structure for each top-level answer
    type NestedReply = Answer & { replies: NestedReply[], reply_count?: number };
    
    const buildNestedReplies = (parentId: number): NestedReply[] => {
      return allReplies
        .filter(a => a.parent_id === parentId)
        .map(a => ({
          ...a,
          replies: buildNestedReplies(a.id),
          reply_count: 0
        }));
    };

    // Calculate total reply count recursively
    const countReplies = (replies: NestedReply[]): number => {
      return replies.reduce((sum, r) => sum + 1 + countReplies(r.replies), 0);
    };

    const answersWithReplies: AnswerWithReplies[] = topLevelAnswers.map(answer => {
      const nestedReplies = buildNestedReplies(answer.id);
      const totalCount = countReplies(nestedReplies);
      const hasDeeper = hasDeepReplies.get(answer.id) || false;
      
      return {
        ...answer,
        replies: nestedReplies as any,
        reply_count: totalCount,
        has_deep_replies: hasDeeper
      };
    });

    return answersWithReplies;
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch filtered answers.")
  }
}

// Fetch full discussion thread starting from top-level ancestor
export async function fetchFullDiscussionThreadAction(answerId: number): Promise<AnswerWithReplies> {
  try {
    // First, find the top-level ancestor (where parent_id IS NULL)
    const ancestorResult = await sql`
      WITH RECURSIVE ancestor_tree AS (
        SELECT id, parent_id, 0 as depth
        FROM answers
        WHERE id = ${answerId}
        
        UNION ALL
        
        SELECT a.id, a.parent_id, at.depth + 1
        FROM answers a
        JOIN ancestor_tree at ON a.id = at.parent_id
        WHERE at.depth < 50
      )
      SELECT id FROM ancestor_tree
      WHERE parent_id IS NULL
      LIMIT 1;
    `;

    if (ancestorResult.length === 0) {
      throw new Error("Top-level answer not found");
    }

    const topLevelId = ancestorResult[0].id;

    // Fetch the root answer
    const rootAnswer = await sql`
      SELECT
        a.id,
        a.question_id,
        a.user_id,
        a.parent_id,
        a.content,
        a.created_at,
        a.updated_at,
        u.full_name AS user_name
      FROM answers a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ${topLevelId}
    ` as Answer[];

    if (rootAnswer.length === 0) {
      throw new Error("Answer not found");
    }

    // Fetch all descendants using recursive CTE
    const allDescendants = await sql`
      WITH RECURSIVE reply_tree AS (
        SELECT 
          a.id, a.question_id, a.user_id, a.parent_id, a.content,
          a.created_at, a.updated_at, u.full_name AS user_name,
          1 as depth
        FROM answers a
        JOIN users u ON a.user_id = u.id
        WHERE a.parent_id = ${topLevelId}
        
        UNION ALL
        
        SELECT 
          a.id, a.question_id, a.user_id, a.parent_id, a.content,
          a.created_at, a.updated_at, u.full_name AS user_name,
          rt.depth + 1
        FROM answers a
        JOIN users u ON a.user_id = u.id
        JOIN reply_tree rt ON a.parent_id = rt.id
        WHERE rt.depth < 50
      )
      SELECT * FROM reply_tree
      ORDER BY created_at ASC;
    ` as (Answer & { depth: number })[];

    // Build nested structure recursively
    type LocalNestedReply = Answer & { replies: LocalNestedReply[], reply_count?: number };
    
    const buildNestedReplies = (parentId: number): LocalNestedReply[] => {
      return allDescendants
        .filter(a => a.parent_id === parentId)
        .map(a => ({
          ...a,
          replies: buildNestedReplies(a.id),
          reply_count: 0
        }));
    };

    return {
      ...rootAnswer[0],
      replies: buildNestedReplies(topLevelId),
      reply_count: allDescendants.length
    };
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch full discussion thread.")
  }
}

// GET TOP KNOWLEDGE SHARERS
export async function getTopKnowledgeSharers(limit: number = 5): Promise<TopSharer[]> {
  try {
    const result = await sql`
      SELECT 
        users.id, 
        users.full_name AS name, 
        COUNT(answers.id) AS score
      FROM users
      LEFT JOIN answers ON users.id = answers.user_id
      GROUP BY users.id, users.full_name
      ORDER BY score DESC
      LIMIT ${limit}
    `
    return result as TopSharer[]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch top knowledge sharers.")
  }
}