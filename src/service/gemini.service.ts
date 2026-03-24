import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "../lib/config"
import { getAIPromptByKey } from "./aiPrompt.service"

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Cache for prompts to avoid repeated database queries
let promptCache: Record<string, string> = {}
let cacheTime = 0
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

/**
 * Get system prompt from database or cache
 */
async function getSystemPrompt(promptKey: string): Promise<string> {
  // Check if cache is still valid
  const now = Date.now()
  if (cacheTime > 0 && now - cacheTime < CACHE_DURATION && promptCache[promptKey]) {
    return promptCache[promptKey]
  }

  try {
    const prompt = await getAIPromptByKey(promptKey)
    if (prompt) {
      promptCache[promptKey] = prompt.content
      cacheTime = now
      return prompt.content
    }
  } catch (error) {
    console.error(`Error fetching prompt "${promptKey}" from database:`, error)
  }

  // Return fallback prompt if database fetch fails
  return getFallbackPrompt(promptKey)
}

/**
 * Get fallback prompts if database is unavailable
 */
function getFallbackPrompt(promptKey: string): string {
  if (promptKey === "chat_assistant") {
    return `You are an expert learning coach and teacher for KMS Plus educational platform. Your goal is to help students learn effectively by teaching them the real knowledge and skills contained in the platform's courses.

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
  } else if (promptKey === "answer_explanation") {
    return `You are an expert tutor for KMS Plus educational platform. When a student asks for a deeper explanation of a quiz answer, your job is to:

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
  }

  return ""
}

export async function generateAIResponse(
  prompt: string,
  dbContext: string = ""
): Promise<string> {
  try {
    // Get system prompt from database or cache
    const SYSTEM_PROMPT = await getSystemPrompt("chat_assistant")

    // Use gemini-2.5-flash (faster, more efficient model)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Combine system prompt with database context and user prompt
    const fullPrompt = dbContext
      ? `${SYSTEM_PROMPT}\n\n## Current Database Schema:\n${dbContext}\n\n## User Question:\n${prompt}`
      : `${SYSTEM_PROMPT}\n\n## User Question:\n${prompt}`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return text
  } catch (error: any) {
    console.error("❌ Error generating AI response:", error)

    // Check if it's a quota exceeded error (429)
    if (error?.status === 429) {
      console.warn(
        "⚠️ Gemini API quota exceeded. Please upgrade your API key or wait."
      )
      // Return a helpful message instead of throwing
      return "I apologize, but I've temporarily reached my API quota limit. Please try again in a few moments, or consider upgrading your API key for continued service."
    }

    throw new Error("Failed to generate AI response")
  }
}

// ============================================
// AI EXPLANATION FUNCTION
// ============================================

interface ExplanationInput {
  questionText: string
  explanation: string
  correctAnswer: string
  questionType: "single_choice" | "multiple_choice"
  options?: string[]
  userAnswer?: string
  category?: string
}

export async function generateAIExplanation(
  input: ExplanationInput
): Promise<string> {
  try {
    // Get system prompt from database or cache
    const EXPLANATION_SYSTEM_PROMPT = await getSystemPrompt("answer_explanation")

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Build the explanation prompt
    let userPrompt = `I need a deeper explanation for this quiz question:

## Question
${input.questionText}

## Question Type
${input.questionType}

## Correct Answer
${input.correctAnswer}`

    if (input.options && input.options.length > 0) {
      userPrompt += `\n\n## Available Options\n${input.options.map((opt, idx) => `${idx + 1}. ${opt}`).join("\n")}`
    }

    if (input.userAnswer) {
      userPrompt += `\n\n## Student's Answer\n${input.userAnswer}`
    }

    if (input.category) {
      userPrompt += `\n\n## Topic/Category\n${input.category}`
    }

    userPrompt += `\n\n## Foundation Explanation from Course\n${input.explanation}`

    userPrompt += `\n\nPlease provide a comprehensive explanation that helps me understand this answer better.`

    const fullPrompt = `${EXPLANATION_SYSTEM_PROMPT}\n\n${userPrompt}`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return text
  } catch (error: any) {
    console.error("❌ Error generating AI explanation:", error)

    if (error?.status === 429) {
      console.warn(
        "⚠️ Gemini API quota exceeded. Please upgrade your API key or wait."
      )
      return "I apologize, but I've temporarily reached my API quota limit. Please try again in a few moments."
    }

    throw new Error("Failed to generate AI explanation")
  }
}
