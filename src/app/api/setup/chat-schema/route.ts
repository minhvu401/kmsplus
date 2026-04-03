import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/requirePermission"
import { Permission } from "@/enum/permission.enum"
import { sql } from "@/lib/database"

export async function POST(request: Request) {
  try {
    // Require MANAGE_SYSTEM permission
    await requirePermission(Permission.MANAGE_SYSTEM)

    // Create conversations table
    const createConversationsTable = await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE
      );
      
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
    `

    // Create messages table
    const createMessagesTable = await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `

    // Create trigger to auto-update conversations.updated_at
    const createTrigger = await sql`
      CREATE OR REPLACE FUNCTION update_conversations_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_conversations_timestamp ON messages;
      
      CREATE TRIGGER trigger_update_conversations_timestamp
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_conversations_timestamp();
    `

    return NextResponse.json({
      success: true,
      message: "Chat schema setup completed successfully",
    })
  } catch (error: any) {
    console.error("❌ Setup error:", error)
    // Handle authorization errors
    if (
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("Missing permission")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to setup chat schema",
      },
      { status: 500 }
    )
  }
}
