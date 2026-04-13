import { sql } from "@/lib/database"

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

// Tables to exclude from context (user management tables)
const EXCLUDED_TABLES = [
  "users",
  "roles",
  "permissions",
  "user_roles",
  "role_permissions",
]

/**
 * Get all database schema information (excluding sensitive tables)
 */
export async function getDatabaseSchema(): Promise<TableInfo[]> {
  try {
    // Get all tables in the current schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    const tableInfos: TableInfo[] = []

    for (const tableRow of tables) {
      const tableName = (tableRow as any).table_name

      // Skip excluded tables
      if (EXCLUDED_TABLES.includes(tableName)) {
        continue
      }

      // Get columns for this table
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `

      const columnInfos: ColumnInfo[] = columns.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        default: col.column_default,
      }))

      tableInfos.push({
        name: tableName,
        columns: columnInfos,
      })
    }

    return tableInfos
  } catch (error) {
    console.error("❌ Error getting database schema:", error)
    throw error
  }
}

/**
 * Format database schema as readable text for AI context
 */
export function formatSchemaAsText(tables: TableInfo[]): string {
  let text = "## Database Schema Information\n\n"

  for (const table of tables) {
    text += `### Table: ${table.name}\n`
    text += "Columns:\n"

    for (const column of table.columns) {
      const nullable = column.nullable ? "nullable" : "not null"
      const defaultVal = column.default ? ` (default: ${column.default})` : ""
      text += `  - ${column.name}: ${column.type} [${nullable}]${defaultVal}\n`
    }

    text += "\n"
  }

  return text
}

/**
 * Get a quick overview of the database
 */
export async function getDatabaseOverview(): Promise<string> {
  try {
    const schema = await getDatabaseSchema()
    return formatSchemaAsText(schema)
  } catch (error) {
    console.error("❌ Error getting database overview:", error)
    throw error
  }
}

/**
 * Get sample data from a table (for context about what data exists)
 * Note: This is not used in the current implementation
 */
export async function getTableSampleData(
  tableName: string,
  limit: number = 3
): Promise<any[]> {
  // Validate table name to prevent SQL injection
  if (EXCLUDED_TABLES.includes(tableName)) {
    throw new Error("Cannot access this table")
  }

  if (!tableName.match(/^[a-z_]+$/i)) {
    throw new Error("Invalid table name")
  }

  try {
    // Use template literal with parameterized table name
    // For actual usage, ensure proper parameterization
    ;`Note: getTableSampleData called for ${tableName}`
    return []
  } catch (error) {
    console.error(`Error getting sample data from ${tableName}:`, error)
    throw error
  }
}
