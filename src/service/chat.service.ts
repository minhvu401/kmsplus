import { sql } from "@/lib/database"

export interface Conversation {
  id: number
  user_id: number
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: "user" | "assistant"
  content: string
  created_at: string
  updated_at: string
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: number,
  title?: string
): Promise<Conversation> {
  try {
    const result = await sql`
      INSERT INTO conversations (user_id, title)
      VALUES (${userId}, ${title || null})
      RETURNING *
    `
    return result[0] as Conversation
  } catch (error) {
    console.error("❌ Error creating conversation:", error)
    throw error
  }
}

/**
 * Get conversation by ID
 */
export async function getConversation(
  conversationId: number,
  userId: number
): Promise<Conversation | null> {
  try {
    const result = await sql`
      SELECT * FROM conversations
      WHERE id = ${conversationId} AND user_id = ${userId}
    `
    return result.length > 0 ? (result[0] as Conversation) : null
  } catch (error) {
    console.error("❌ Error getting conversation:", error)
    throw error
  }
}

/**
 * Get all conversations for a user
 */
export async function getConversationsByUserId(
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<Conversation[]> {
  try {
    const result = await sql`
      SELECT * FROM conversations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result as Conversation[]
  } catch (error) {
    console.error("❌ Error getting conversations:", error)
    throw error
  }
}

/**
 * Add message to conversation
 */
export async function addMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  try {
    const result = await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversationId}, ${role}, ${content})
      RETURNING *
    `
    return result[0] as Message
  } catch (error) {
    console.error("❌ Error adding message:", error)
    throw error
  }
}

/**
 * Get messages in a conversation
 */
export async function getMessagesByConversationId(
  conversationId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  try {
    const result = await sql`
      SELECT * FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result as Message[]
  } catch (error) {
    console.error("❌ Error getting messages:", error)
    throw error
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: number,
  userId: number,
  title: string
): Promise<Conversation> {
  try {
    const result = await sql`
      UPDATE conversations
      SET title = ${title}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId} AND user_id = ${userId}
      RETURNING *
    `
    return result[0] as Conversation
  } catch (error) {
    console.error("❌ Error updating conversation title:", error)
    throw error
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: number
): Promise<void> {
  try {
    // Delete all messages in the conversation first (due to foreign key constraint)
    await sql`
      DELETE FROM messages
      WHERE conversation_id = ${conversationId}
    `

    // Then delete the conversation
    await sql`
      DELETE FROM conversations
      WHERE id = ${conversationId}
    `
  } catch (error) {
    console.error("❌ Error deleting conversation:", error)
    throw error
  }
}
