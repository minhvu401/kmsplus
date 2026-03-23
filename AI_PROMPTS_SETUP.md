# AI Prompts Management System - Setup Guide

## Overview

Hệ thống quản lý AI prompts cho phép admin chỉnh sửa system prompts của các tính năng AI (ChatBox, AI Explanation) trực tiếp thông qua UI mà không cần chỉnh sửa code.

## Features

✅ **Database Storage**: Prompts được lưu trong database ai_prompts  
✅ **Admin Interface**: Chỉnh sửa prompts trong System Settings page  
✅ **Caching**: Prompts được cache trong 1 giờ để tối ưu performance  
✅ **Role-Based Access**: Chỉ admin có MANAGE_SYSTEM permission mới có thể chỉnh sửa  
✅ **Versioning**: Mỗi lần update được lưu với timestamp updated_at

## Setup Steps

### 1. Create Database Table

Chạy SQL migration để tạo bảng ai_prompts:

```sql
-- Copy nội dung từ scripts/migrations/create-ai-prompts-table.sql
-- Hoặc chạy trực tiếp:

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
```

### 2. Initialize Default Prompts

Gọi API endpoint để khởi tạo prompts mặc định:

**Option A: Từ Admin UI**

1. Đăng nhập với tài khoản Admin
2. Vào System Settings
3. Tìm phần "AI Prompts Management"
4. Prompts sẽ được tải (nếu chưa có sẽ hiển thị "No prompts found")

**Option B: Từ API**

```bash
curl -X POST http://localhost:3000/api/setup/ai-prompts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Option C: Programmatically**

```typescript
import { initializeDefaultPrompts } from "@/service/aiPrompt.service"

await initializeDefaultPrompts()
```

### 3. Grant MANAGE_SYSTEM Permission to Admin Role

Cần thêm permission `MANAGE_SYSTEM` (ID: 337) vào Admin role:

```sql
-- Thêm permission vào admin role
INSERT INTO role_permissions (role_id, permission_id)
VALUES (
  (SELECT id FROM roles WHERE name = 'Admin'),
  337
);
```

## File Structure

```
src/
├── service/
│   └── aiPrompt.service.ts          # CRUD operations for AI prompts
│
├── app/api/
│   ├── prompts/route.ts             # GET/POST endpoints for prompts
│   └── setup/ai-prompts/route.ts    # Setup endpoint to initialize prompts
│
├── components/
│   └── AIPromptsSettings.tsx         # UI component for editing prompts
│
├── app/(main)/settings/
│   └── page-content.tsx             # Settings page (updated with AIPromptsSettings)
│
├── service/
│   └── gemini.service.ts            # Updated to fetch prompts from DB
│
└── enum/
    └── permission.enum.ts           # Added MANAGE_SYSTEM permission

scripts/
└── migrations/
    └── create-ai-prompts-table.sql  # Database migration file
```

## How It Works

### 1. Prompts Retrieval Flow

```
generateAIResponse() or generateAIExplanation()
    ↓
getSystemPrompt(promptKey)
    ↓
Check cache → If cached and valid, return cached prompt
    ↓
Query database: SELECT content FROM ai_prompts WHERE prompt_key = ?
    ↓
Cache the result for 1 hour
    ↓
Use in AI request
```

### 2. Prompts Update Flow

```
Admin visits System Settings → AI Prompts Management
    ↓
Load all prompts via GET /api/prompts
    ↓
Admin edits a prompt
    ↓
Submit form → POST /api/prompts
    ↓
Database is updated (INSERT or UPDATE)
    ↓
Cache is invalidated on next request
    ↓
New prompt is used immediately
```

## Available Prompts

### 1. Chat Assistant (`chat_assistant`)

- **Title**: AI ChatBox - Learning Assistant
- **Description**: System prompt for the main chat assistant that helps students learn platform content
- **Key**: `chat_assistant`
- **Used in**: `generateAIResponse()` function

### 2. Answer Explanation (`answer_explanation`)

- **Title**: AI Explanation - Quiz Answer Explanation
- **Description**: System prompt for the answer explanation feature that provides deeper understanding of quiz answers
- **Key**: `answer_explanation`
- **Used in**: `generateAIExplanation()` function

## Admin Panel Access

After setup, admins can manage prompts by:

1. Login with admin account
2. Navigate to **Settings** (cog icon) in sidebar
3. Scroll to **"AI Prompts Management"** section
4. Click **"Edit"** button on any prompt
5. Modify title, description, or content
6. Click **"Save"** to update

## Caching Strategy

- **Duration**: 1 hour (3600000 milliseconds)
- **When cached**: After first fetch from database
- **When invalidated**: After 1 hour expires
- **Fallback**: If DB unavailable, uses hardcoded fallback prompts

This ensures:

- Minimal database queries
- Fast prompt retrieval for AI responses
- Admin changes take effect within 1 hour max

## Database Schema

```sql
┌─────────────────────┐
│    ai_prompts       │
├─────────────────────┤
│ id (PK)             │
│ prompt_key (UNIQUE) │
│ title               │
│ description         │
│ content (TEXT)      │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## API Endpoints

### GET /api/prompts

Retrieve all AI prompts

- **Auth**: Required (MANAGE_SYSTEM permission)
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "prompt_key": "chat_assistant",
      "title": "AI ChatBox - Learning Assistant",
      "description": "...",
      "content": "...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/prompts

Create or update an AI prompt

- **Auth**: Required (MANAGE_SYSTEM permission)
- **Body**:

```json
{
  "promptKey": "chat_assistant",
  "title": "New Title",
  "description": "New description",
  "content": "New prompt content..."
}
```

- **Response**: Same as GET

### POST /api/setup/ai-prompts

Initialize default prompts (one-time setup)

- **Auth**: Required (MANAGE_SYSTEM permission)
- **Response**:

```json
{
  "success": true,
  "message": "AI prompts initialized successfully"
}
```

## Troubleshooting

### Prompts not loading in Settings

- Check if `ai_prompts` table exists in database
- Verify admin has `MANAGE_SYSTEM` permission
- Check browser console for API errors

### Prompts not being used by AI

- Wait 1 hour for cache to expire, or restart server
- Check if prompt_key matches exactly (case-sensitive)
- Verify `getAIPromptByKey()` is being called

### API returns 403 Forbidden

- User doesn't have `MANAGE_SYSTEM` permission
- Add permission to admin role in role_permissions table

## Security Notes

- Only users with `MANAGE_SYSTEM` permission can view/edit prompts
- Prompts are stored as plain text in database
- Sensitive information should not be included in prompts
- API is server-side protected with token verification

## Future Enhancements

Potential improvements:

- [ ] Prompt versioning / history
- [ ] Prompt templates / snippets library
- [ ] A/B testing different prompts
- [ ] Prompt performance metrics
- [ ] Automatic prompt suggestions
- [ ] Multi-language prompt variants
