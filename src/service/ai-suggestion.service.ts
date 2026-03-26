import { sql } from "@/lib/database"

export interface Question {
  id: number
  title: string
  content: string
  created_at: Date
  user_id: number
  user_name: string
}

export interface TopicAnalysis {
  topic: string
  count: number
  questions: Question[]
  confidence: number
}

export interface AISuggestion {
  id: number
  topic: string
  topic_count: number
  date_range: number // 7, 14, or 30
  suggested_at: Date
  status: "pending" | "approved" | "dismissed"
  admin_id?: number
  created_at: Date
  updated_at: Date
}

/**
 * Get questions from Q&A within a specific date range
 */
async function getQuestionsInRange(days: number): Promise<Question[]> {
  const result = await sql`
    SELECT 
      q.id,
      q.title,
      q.content,
      q.created_at,
      q.user_id,
      u.name AS user_name
    FROM questions q
    JOIN users u ON q.user_id = u.id
    WHERE q.deleted_at IS NULL
      AND q.created_at >= CURRENT_DATE - INTERVAL '${days} days'
    ORDER BY q.created_at DESC
  `
  return result as Question[]
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "không",
    "có",
    "là",
    "được",
    "cái",
    "nào",
    "nào",
    "thì",
    "và",
    "hoặc",
    "nhưng",
    "để",
    "từ",
    "vào",
    "về",
    "một",
    "cách",
    "như",
    "thế",
    "này",
    "làm",
    "sao",
    "hãy",
    "tôi",
    "bạn",
    "anh",
    "chị",
    "em",
    "chúng",
    "ta",
    "tớ",
    "tôi",
    "ông",
    "bà",
    "cô",
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
}

/**
 * Calculate similarity between two strings (simple approach)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  const editDistance = levenshteinDistance(longer, shorter)
  return ((longer.length - editDistance) / longer.length) * 100
}

/**
 * Levenshtein distance for string comparison
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }
  return dp[m][n]
}

/**
 * Cluster similar questions based on title and content
 */
function clusterQuestions(questions: Question[]): Map<string, Question[]> {
  const clusters = new Map<string, Question[]>()
  const processed = new Set<number>()

  for (const q of questions) {
    if (processed.has(q.id)) continue

    const topicKeywords = extractKeywords(q.title + " " + q.content).slice(0, 3)
    const topicLabel = topicKeywords.join(" ") || q.title.slice(0, 30)

    const cluster = [q]
    processed.add(q.id)

    // Find similar questions
    for (const other of questions) {
      if (processed.has(other.id)) continue

      const similarity = stringSimilarity(
        q.title.toLowerCase(),
        other.title.toLowerCase()
      )

      // If similarity > 60%, add to same cluster
      if (similarity > 60) {
        cluster.push(other)
        processed.add(other.id)
      }
    }

    if (!clusters.has(topicLabel)) {
      clusters.set(topicLabel, cluster)
    } else {
      clusters.get(topicLabel)!.push(...cluster)
    }
  }

  return clusters
}

/**
 * Analyze questions and find top topics
 */
export async function analyzeTopic(
  days: number = 30
): Promise<TopicAnalysis[]> {
  const questions = await getQuestionsInRange(days)

  if (questions.length === 0) {
    return []
  }

  // Cluster similar questions
  const clusters = clusterQuestions(questions)

  // Convert to TopicAnalysis format and sort by frequency
  const topics: TopicAnalysis[] = Array.from(clusters.entries())
    .map(([topic, questionList]) => ({
      topic,
      count: questionList.length,
      questions: questionList.slice(0, 5), // Keep only first 5 questions per topic
      confidence: Math.min(100, (questionList.length / questions.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  return topics
}

/**
 * Get the most discussed topic
 */
export async function getTopTopic(
  days: number = 30
): Promise<TopicAnalysis | null> {
  const topics = await analyzeTopic(days)
  return topics.length > 0 ? topics[0] : null
}

/**
 * Get existing suggestion
 */
export async function getLatestSuggestion(): Promise<AISuggestion | null> {
  try {
    const result = await sql`
      SELECT *
      FROM ai_suggestions
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `
    return (result[0] as AISuggestion) || null
  } catch (error) {
    console.error("Error getting latest suggestion:", error)
    return null
  }
}

/**
 * Save new suggestion
 */
export async function saveSuggestion(
  topic: string,
  topicCount: number,
  dateRange: number
): Promise<AISuggestion> {
  try {
    const result = await sql`
      INSERT INTO ai_suggestions (topic, topic_count, date_range, status, created_at, updated_at)
      VALUES (${topic}, ${topicCount}, ${dateRange}, 'pending', NOW(), NOW())
      RETURNING *
    `
    return result[0] as AISuggestion
  } catch (error) {
    console.error("Error saving suggestion:", error)
    throw error
  }
}

/**
 * Update suggestion status
 */
export async function updateSuggestionStatus(
  suggestionId: number,
  status: "approved" | "dismissed",
  adminId?: number
): Promise<AISuggestion> {
  try {
    const result = await sql`
      UPDATE ai_suggestions
      SET status = ${status},
          admin_id = ${adminId || null},
          updated_at = NOW()
      WHERE id = ${suggestionId}
      RETURNING *
    `
    return result[0] as AISuggestion
  } catch (error) {
    console.error("Error updating suggestion status:", error)
    throw error
  }
}

/**
 * Check if new suggestion should be created
 * Only create if no pending suggestion exists and new top topic is different
 */
export async function shouldCreateNewSuggestion(
  days: number = 30
): Promise<boolean> {
  const existing = await getLatestSuggestion()
  if (!existing) return true

  const newTopic = await getTopTopic(days)
  return newTopic?.topic !== existing.topic
}
