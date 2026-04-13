import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL)

async function setupChatSchema() {
  try {
    // Create conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at)
    `("✅ Conversations table created/verified")

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)
    `("✅ Messages table created/verified")

    // Create function for trigger
    await sql`
      CREATE OR REPLACE FUNCTION update_conversations_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

    // Drop existing trigger if exists
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_conversations_timestamp ON messages
    `

    // Create trigger
    await sql`
      CREATE TRIGGER trigger_update_conversations_timestamp
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_conversations_timestamp()
    `("✅ Trigger for auto-update created/verified")(
      "\n✅ Chat schema setup completed successfully!"
    )

    process.exit(0)
  } catch (error) {
    console.error("❌ Setup error:", error.message)
    process.exit(1)
  }
}

setupChatSchema()
