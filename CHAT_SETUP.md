# Chat AI Setup Guide

## 🎯 Overview

Chatbot được custom riêng cho KMS Plus project với các tính năng:

- ✅ Hỏi đáp chỉ về KMS Plus project
- ✅ Truy cập thông tin database schema (trừ user tables)
- ✅ Lưu conversation history
- ✅ Cache database schema trong Redis
- ✅ Context-aware responses dựa trên project structure

### Database Tables Accessible

Chatbot có thể discusses:

- `conversations`, `messages` - Chat system
- `courses`, `lessons`, `enrollments` - Course management
- `quizzes`, `quiz_questions`, `quiz_attempts` - Assessment
- `articles`, `comments` - Content
- `categories`, `departments` - Organization
- `questions`, `question_banks` - Question management
- `progress` - User progress

### Tables NOT Accessible

Để bảo vệ dữ liệu người dùng:

- `users`, `roles`, `permissions`, `user_roles`, `role_permissions`

## Environment Variables

Thêm các biến sau vào file `.env.local`:

```env
# Database
DATABASE_URL=your_database_url_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here_min_32_chars

# Gemini API Key
GEMINI_API_KEY=AIzaSyAbrq8PlGReEukhWVrJ7qiE_E7Qd6XPYZ8

# Redis (Optional - để lưu cache)
REDIS_URL=redis://localhost:6379
# hoặc với cloud Redis:
# REDIS_URL=redis://username:password@host:port
```

## Installation

1. **Install dependencies:**

```bash
pnpm install
```

2. **Setup Database Schema:**

```bash
# Gọi endpoint setup để tạo tables
curl -X POST http://localhost:3000/api/setup/chat-schema \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Flow của Chat

```
┌────────────────────────────────────────────────────────────┐
│                         Frontend (UI)                       │
│                    - Nhập message "quiz này làm sao?"       │
│                    - Hiển thị conversation history          │
└────────────┬────────────────────────────────────────────────┘
             │ POST /api/chat/generate
             │ { conversationId, message }
             ▼
┌────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│   1. Check userId <-> conversationID (xác thực user)        │
│   2. Lấy conversation history từ DB                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────┬──────────────────────┐
             ▼                     ▼                      ▼
        Database            Redis Cache          Message Validation
        (PostgreSQL)        (Conversation          (Input/Output)
                            history cache)
             │
             └─────────────────────┬──────────────────────┐
                                   ▼
                    ┌────────────────────────────────┐
                    │   Gemini AI Service            │
                    │  - Lấy prompt từ history       │
                    │  - Generate response           │
                    │  - Return JSON response        │
                    └────────────┬───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────┐
                    │   Save to Database & Redis     │
                    │  - Save user + AI messages     │
                    │  - Cache updated history       │
                    └────────────┬───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────┐
                    │    Return Response to FE       │
                    │  - User message                │
                    │  - Assistant message           │
                    │  - Conversation metadata       │
                    └────────────────────────────────┘
```

## API Endpoints

### 1. Generate Chat Response

```
POST /api/chat/generate
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "conversationId": 1,  // Optional - nếu không có sẽ tạo mới
  "message": "quiz này làm sao?"
}

Response:
{
  "success": true,
  "conversation": {
    "id": 1,
    "title": "...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "userMessage": {
    "id": 1,
    "role": "user",
    "content": "quiz này làm sao?",
    "createdAt": "..."
  },
  "assistantMessage": {
    "id": 2,
    "role": "assistant",
    "content": "AI response here",
    "createdAt": "..."
  }
}
```

### 2. Get Conversation History

```
GET /api/chat/{conversationId}
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "title": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "...",
      "createdAt": "..."
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "...",
      "createdAt": "..."
    }
  ]
}
```

### 3. List User Conversations

```
GET /api/chat?limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "isArchived": false
    }
  ]
}
```

### 4. Setup Database Schema

```
POST /api/setup/chat-schema
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Chat schema setup completed successfully"
}
```

## Database Schema

### conversations table

```sql
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE
);
```

### messages table

```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Trigger

- **update_conversations_timestamp**: Tự động cập nhật `updated_at` của conversation khi có message mới

## Redis Cache Keys

```
conversation:{conversationId}
  - Lưu toàn bộ conversation history
  - TTL: 24 hours
  - Format: JSON serialized

kms_db_schema
  - Cache database schema information
  - TTL: 24 hours
  - Tránh query schema mỗi lần user hỏi
```

## Features

### Core Features

✅ **Multiple Conversations** - Support nhiều conversation cho 1 user
✅ **Conversation History** - Lưu trữ toàn bộ message history
✅ **Redis Cache** - Cache conversation history để tăng performance
✅ **AI-Powered** - Sử dụng Gemini AI Pro để generate responses
✅ **Auto-archiving** - Support archive old conversations
✅ **Real-time Updates** - Frontend auto-update conversations list
✅ **Copy Messages** - Copy any message to clipboard
✅ **Responsive Design** - Mobile-friendly UI

### Project-Specific Features (NEW!)

🎯 **Project Context-Aware** - Chatbot chỉ trả lời về KMS Plus project
🎯 **Database Schema Access** - Tự động lấy thông tin db schema
🎯 **Schema Caching** - Cache schema trong 24h để tối ưu performance
🎯 **Secured Tables** - Không thể truy cập user/role tables
🎯 **System Prompt** - Custom system prompt cho project documentation
🎯 **Conversation Context** - Follow-up questions hiểu ngữ cảnh conversation

## Example Questions

Các câu hỏi mà user có thể hỏi chatbot:

### About Database Structure

```
- "Những table nào có trong database?"
- "Bảng courses có những column nào?"
- "Relationship giữa courses và enrollments là gì?"
- "Cấu trúc của quiz table như thế nào?"
- "Message table lưu những thông tin gì?"
```

### About Project Features

```
- "KMS Plus dùng để làm gì?"
- "Có những feature nào trong project?"
- "Quiz system hoạt động thế nào?"
- "Làm sao để track user progress?"
- "Conversation history được lưu ở đâu?"
```

### Follow-up Questions

```
User: "Giải thích về lessons table"
Chatbot: [Giải thích lessons table]
User: "Và nó liên quan đến courses như thế nào?"
Chatbot: [Hiểu context và giải thích relationship]
```

### Questions Chatbot Will Decline

```
⛔ "Mật khẩu của user X là gì?" → Không access bảng users
⛔ "Tức là nội dung không liên quan tới project này" → Chỉ trả lời về KMS Plus
⛔ "Giải thích machine learning" → Ngoài scope project
```

## Troubleshooting

### "GEMINI_API_KEY is required"

- Kiểm tra xem file `.env.local` có biến `GEMINI_API_KEY` không
- Đảm bảo API key là hợp lệ

### Redis Connection Error

- Kiểm tra xem Redis server có chạy không
- Default: `redis://localhost:6379`
- Hoặc cấu hình `REDIS_URL` để chỉ đến Redis cloud

### "Conversation not found"

- Kiểm tra xem conversationId có tồn tại không
- Đảm bảo user có quyền truy cập conversation

## Performance Tips

1. **Redis Cache** - Mỗi conversation được cache 24 giờ
2. **Index Optimization** - Các indexes đã được tạo cho user_id, created_at
3. **Pagination** - List conversations hỗ trợ limit/offset

## Future Enhancements

- File upload support
- Conversation search
- Export conversations to PDF
- Custom system prompts
- Temperature/model selection
- Rate limiting per user
