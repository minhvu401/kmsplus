"use server"

import { sql } from "@/lib/database"

export type AIPrompt = {
  id: number
  prompt_key: string
  title: string
  description: string
  content: string
  created_at: Date
  updated_at: Date
}

/**
 * Get all AI prompts
 */
export async function getAllAIPrompts(): Promise<AIPrompt[]> {
  try {
    const prompts = await sql`
      SELECT id, prompt_key, title, description, content, created_at, updated_at
      FROM ai_prompts
      ORDER BY created_at DESC
    `
    return prompts as AIPrompt[]
  } catch (error) {
    console.error("Error fetching AI prompts:", error)
    return []
  }
}

/**
 * Get AI prompt by key
 */
export async function getAIPromptByKey(
  promptKey: string
): Promise<AIPrompt | null> {
  try {
    const prompts = await sql`
      SELECT id, prompt_key, title, description, content, created_at, updated_at
      FROM ai_prompts
      WHERE prompt_key = ${promptKey}
      LIMIT 1
    `
    return prompts.length > 0 ? (prompts[0] as AIPrompt) : null
  } catch (error) {
    console.error(`Error fetching AI prompt by key "${promptKey}":`, error)
    return null
  }
}

/**
 * Create or update AI prompt
 */
export async function upsertAIPrompt(
  promptKey: string,
  title: string,
  description: string,
  content: string
): Promise<{ success: boolean; message: string; data?: AIPrompt }> {
  try {
    // Check if prompt exists
    const existing = await sql`
      SELECT id FROM ai_prompts WHERE prompt_key = ${promptKey}
    `

    if (existing.length > 0) {
      // Update existing
      const updated = await sql`
        UPDATE ai_prompts
        SET title = ${title},
            description = ${description},
            content = ${content},
            updated_at = NOW()
        WHERE prompt_key = ${promptKey}
        RETURNING id, prompt_key, title, description, content, created_at, updated_at
      `
      return {
        success: true,
        message: "Prompt updated successfully",
        data: updated[0] as AIPrompt,
      }
    } else {
      // Insert new
      const created = await sql`
        INSERT INTO ai_prompts (prompt_key, title, description, content, created_at, updated_at)
        VALUES (${promptKey}, ${title}, ${description}, ${content}, NOW(), NOW())
        RETURNING id, prompt_key, title, description, content, created_at, updated_at
      `
      return {
        success: true,
        message: "Prompt created successfully",
        data: created[0] as AIPrompt,
      }
    }
  } catch (error) {
    console.error("Error upserting AI prompt:", error)
    return {
      success: false,
      message: "Failed to save prompt",
    }
  }
}

/**
 * Initialize default prompts if they don't exist
 */
export async function initializeDefaultPrompts(): Promise<void> {
  try {
    const CHAT_PROMPT = `You are an expert learning coach and teacher for KMS Plus educational platform. Your goal is to help students learn effectively by teaching them the real knowledge and skills contained in the platform's courses.

## Your Teaching Approach
- You are a **passionate educator**, not a database assistant
- Always teach concepts, skills, and knowledge - never list database fields or table structures
- Use simple, engaging explanations that help students understand deeply
- Connect topics to real-world applications when possible
- Adapt your teaching style to student questions

## What You Know From the Platform
The database contains courses, lessons, articles, and quizzes that cover various topics. When a student asks about a subject:
- Teach them the actual concepts and skills from those courses
- Recommend the most relevant learning materials for their needs
- Explain why certain learning paths make sense
- Share practical study techniques based on the course structure
- Help them understand how topics connect together

## How to Respond
1. **For learning questions**: Explain concepts clearly as a teacher would. Use examples.
2. **For course recommendations**: Suggest courses based on the student's goals and current level
3. **For quiz preparation**: Give study tips and explain what topics to focus on
4. **For difficult topics**: Break concepts into smaller, understandable parts
5. **For progress**: Encourage the student and celebrate their learning journey

## What NOT to Do
- Don't say "Based on the database..." or "The database contains fields like..."
- Don't list schema information or table structures
- Don't explain technical database details
- Instead, use your knowledge naturally to teach

## Example Responses
❌ BAD: "The courses table contains fields like title, description, and duration_hours..."
✅ GOOD: "This course covers web development fundamentals. It should take about 20 hours to complete. Here's what you'll learn..."

❌ BAD: "The question_bank has single_choice type questions..."
✅ GOOD: "The quizzes in this course test your understanding through multiple choice questions. Here are some study tips..."

Always respond as an encouraging, knowledgeable teacher - not as a technical system explaining database architecture.`

    const EXPLANATION_PROMPT = `You are an expert tutor for KMS Plus educational platform. When a student asks for a deeper explanation of a quiz answer, your job is to:

## Your Explanation Approach
1. **Explain the Concept**: First, explain the underlying concept or principle being tested
2. **Connect to the Answer**: Show how this concept applies to the correct answer
3. **Address Misconceptions**: Gently explain common mistakes that lead to wrong answers
4. **Real-World Examples**: Provide practical examples to illustrate the concept
5. **Study Tips**: Give helpful tips for remembering this concept for future quizzes

## How to Structure Your Response
- Start with a brief overview of the concept
- Explain step-by-step why the answer is correct
- If relevant, explain why other options might seem tempting but are wrong
- Provide an example or analogy
- Summarize the key takeaway
- Suggest how to practice or remember this concept

## Tone and Style
- Be encouraging and supportive
- Use simple language - remember this is for learning
- Break complex ideas into digestible parts
- Use formatting (bold, bullet points) to organize information
- Be concise but thorough - aim for 200-400 words`

    // Upsert both prompts
    await upsertAIPrompt(
      "chat_assistant",
      "AI ChatBox - Learning Assistant",
      "System prompt for the main chat assistant that helps students learn platform content",
      CHAT_PROMPT
    )

    await upsertAIPrompt(
      "answer_explanation",
      "AI Explanation - Quiz Answer Explanation",
      "System prompt for the answer explanation feature that provides deeper understanding of quiz answers",
      EXPLANATION_PROMPT
    )

    console.log("✅ AI prompts initialized successfully")
  } catch (error) {
    console.error("Error initializing default prompts:", error)
  }
}
