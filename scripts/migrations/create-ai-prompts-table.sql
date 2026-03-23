-- PROMPT 1: Tạo bảng ai_prompts
-- Prompt for AI to generate SQL:
-- "Tạo table ai_prompts với columns: id (BIGSERIAL PRIMARY KEY), prompt_key (VARCHAR UNIQUE), title (VARCHAR), description (TEXT), content (TEXT), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP). Thêm index trên prompt_key và created_at"

CREATE TABLE IF NOT EXISTS ai_prompts (
  id BIGSERIAL PRIMARY KEY,
  prompt_key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_prompt_key ON ai_prompts(prompt_key);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_at ON ai_prompts(created_at);

-- PROMPT 2: Insert dữ liệu mặc định
-- Prompt for AI to generate SQL:
-- "Insert 2 prompts vào ai_prompts: (1) key='chat_assistant', title='AI ChatBox - Learning Assistant', description='Prompt giúp học sinh học tập',  content='[prompt content]'; (2) key='answer_explanation', title='AI Explanation - Quiz Answer', description='Prompt giải thích câu trả lời quiz', content='[prompt content]'"

INSERT INTO ai_prompts (prompt_key, title, description, content, created_at, updated_at) VALUES
('chat_assistant', 'AI ChatBox - Learning Assistant', 'Prompt giúp học sinh học tập từ nội dung khóa học', 'You are an expert learning coach for educational platform. Help students learn concepts, recommend courses, explain topics clearly, and encourage their learning journey.', NOW(), NOW()),
('answer_explanation', 'AI Explanation - Quiz Answer', 'Prompt giải thích chi tiết câu trả lời quiz', 'You are an expert tutor. Explain quiz answers by: 1) explaining the concept, 2) connecting to the correct answer, 3) addressing misconceptions, 4) providing examples, 5) giving study tips.', NOW(), NOW());
