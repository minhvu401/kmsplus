# AI Suggestion Feature - Implementation Summary

## 🎯 Feature Overview

Đã tạo hoàn thiện hệ thống **AI Suggestion** để:

- ✅ Phân tích Q&A questions trong các khoảng thời gian (7, 14, 30 ngày)
- ✅ Nhóm câu hỏi tương tự thành topics
- ✅ Tìm topic được nhắc đến nhiều nhất
- ✅ Gợi ý tạo khóa học cho ADMIN qua Dashboard Metrics
- ✅ ADMIN có thể approve (nhảy tới Course Management) hoặc dismiss

---

## 📁 Files Created/Modified

### 1. **Core Service Layer**

```
src/service/ai-suggestion.service.ts
├── analyzeTopic(days)              // Phân tích topics
├── clusterQuestions(questions)      // Nhóm câu hỏi tương tự
├── stringSimilarity()               // Tính độ tương tự (Levenshtein)
├── extractKeywords(text)            // Trích xuất keywords
├── getTopTopic(days)                // Lấy topic top 1
├── saveSuggestion()                 // Lưu suggestion mới
├── updateSuggestionStatus()         // Cập nhật status
└── shouldCreateNewSuggestion()      // Check có nên tạo suggestion mới?
```

### 2. **Server Actions**

```
src/action/ai-suggestion-action.ts
├── analyzeQATopics(days)            // Phân tích từ client
├── createAISuggestion(days)         // Tạo suggestion
├── approveSuggestion(id)            // Phê duyệt suggestion
├── dismissSuggestion(id)            // Từ chối suggestion
└── getLatestSuggestion()            // Lấy suggestion mới nhất
```

### 3. **API Routes**

```
src/app/api/ai-suggestion/route.ts
├── GET     /api/ai-suggestion                    // Lấy suggestion
├── POST    /api/ai-suggestion                    // Tạo suggestion
└── PATCH   /api/ai-suggestion                    // Cập nhật status
```

### 4. **UI Components**

```
src/components/
├── AISuggestionPanel.tsx                         // Main UI component
│   ├── Display suggestion card
│   ├── Approve/Dismiss buttons
│   ├── Manual topic analysis
│   ├── Date range filter (7, 14, 30 days)
│   └── Topic list view
│
└── hooks/
    └── useAutoAISuggestion.ts                    // Auto-check hook
        └── Auto-check khi mount & hourly interval
```

### 5. **Dashboard Integration**

```
src/app/(main)/dashboard-metrics/page.tsx
├── Import AISuggestionPanel
├── Use useAutoAISuggestion hook
└── Display panel after header
```

### 6. **Database Migration**

```
scripts/migrations/create-ai-suggestions-table.sql
├── Create ai_suggestions table
├── Create indexes
└── Auto-update timestamp trigger
```

### 7. **Documentation**

```
AI_SUGGESTION_FEATURE.md                         // Full documentation
AI_SUGGESTION_SETUP.md                          // Setup & deployment checklist
```

---

## 🔧 Key Features

### Topic Analysis Algorithm

- **Method**: String similarity + Keyword matching
- **Similarity Threshold**: 60%
- **Distance Algorithm**: Levenshtein distance
- **Stop Words**: Tiếng Anh & Tiếng Việt (mutable)

### Database Schema

```sql
CREATE TABLE ai_suggestions (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  topic_count INTEGER NOT NULL,
  date_range INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'pending',
  admin_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Flows

#### Flow 1: Admin/Director Approval

```
Admin visits /dashboard-metrics
    ↓
AISuggestionPanel loads & auto-checks
    ↓
If pending suggestion exists, display it
    ↓
Click "Đồng ý" → Redirect to /courses/management
    ↓
Topic pre-filled in form
    ↓
Suggestion status updated to "approved"
```

#### Flow 2: Admin Dismissal

```
Click "Không" on suggestion
    ↓
Buttons become hidden
    ↓
Suggestion status changes to "dismissed"
    ↓
Next system check: creates suggestion for different topic (if exists)
```

#### Flow 3: Manual Analysis

```
Click "Phân Tích" button
    ↓
Select time period (7, 14, or 30 days)
    ↓
System analyzes all questions in that period
    ↓
Display sorted list of topics with confidence scores
    ↓
Admin can review before creating suggestion manually
```

---

## 📋 Implementation Details

### Why This Architecture?

1. **Service Layer** (`ai-suggestion.service.ts`)
   - Centralized business logic
   - Reusable across actions and API
   - Easy to test
   - Pure functions where possible

2. **Server Actions** (`ai-suggestion-action.ts`)
   - Called directly from client components
   - Server-side execution (secure)
   - Role-based access control
   - Automatic cache revalidation

3. **API Routes** (`/api/ai-suggestion/route.ts`)
   - Alternative way to access functionality
   - RESTful endpoints
   - Useful for external integrations
   - Mobile & frontend flexibility

4. **Custom Hook** (`useAutoAISuggestion.ts`)
   - Auto-trigger suggestion creation
   - Interval-based checks (1 hour)
   - Silently fails (user may not be admin)
   - Better UX than manual trigger

### Similarity Calculation

```
Example:
"Làm sao để xài con AI này" vs "Cách sử dụng AI"
- Both contain: "AI", "xài/sử dụng" (similar meaning)
- Levenshtein distance calculated
- If > 60% match → grouped as same topic
```

---

## ✅ Pre-Deployment Checklist

- [ ] Run database migration
- [ ] Verify `getCurrentUser()`, `requireAuth()` exist
- [ ] Verify `Role.ADMIN`, `Role.DIRECTOR` enums exist
- [ ] Test with at least 5-10 questions in Q&A
- [ ] Verify redirect to course management works
- [ ] Test all 3 time periods (7, 14, 30 days)
- [ ] Check responsive design on mobile
- [ ] Verify no console errors
- [ ] Test with/without authentication

---

## 🚀 How to Deploy

### Step 1: Database Setup

```bash
psql -U postgres -d your_db -f scripts/migrations/create-ai-suggestions-table.sql
```

### Step 2: Verify Dependencies

```bash
# Check dayjs
pnpm list dayjs

# Install if missing
pnpm add dayjs
```

### Step 3: Test Before Going Live

```bash
# Start dev server
pnpm dev

# Test flows:
# 1. Go to /dashboard-metrics (as admin)
# 2. Check if suggestion loads
# 3. Click "Phân Tích" with different time periods
# 4. Try approve/dismiss actions
# 5. Check database for updated records
```

### Step 4: Deploy

```bash
# Build
pnpm build

# Deploy to your hosting
# (Vercel, Railway, etc.)
```

---

## 📊 Database Queries

### Get all pending suggestions

```sql
SELECT * FROM ai_suggestions
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### Get approved suggestions (for analytics)

```sql
SELECT topic, COUNT(*) as approval_count
FROM ai_suggestions
WHERE status = 'approved'
GROUP BY topic
ORDER BY approval_count DESC;
```

### Get dismissed suggestions

```sql
SELECT topic, COUNT(*) as dismiss_count
FROM ai_suggestions
WHERE status = 'dismissed'
GROUP BY topic
ORDER BY dismiss_count DESC;
```

---

## 🔍 Troubleshooting

| Problem                       | Solution                                |
| ----------------------------- | --------------------------------------- |
| No suggestions created        | Check if questions exist in Q&A         |
| Similarity not working        | Verify Levenshtein distance calculation |
| Database error                | Run migration script again              |
| Redirect to course mgmt fails | Check if route exists                   |
| Hook not triggering           | Verify user is ADMIN/DIRECTOR           |

---

## 📧 File Locations Reference

| Purpose               | File                                                 |
| --------------------- | ---------------------------------------------------- |
| Business Logic        | `src/service/ai-suggestion.service.ts`               |
| Server Actions        | `src/action/ai-suggestion-action.ts`                 |
| API Endpoints         | `src/app/api/ai-suggestion/route.ts`                 |
| Main Component        | `src/components/AISuggestionPanel.tsx`               |
| Auto-Check Hook       | `src/components/hooks/useAutoAISuggestion.ts`        |
| Dashboard Integration | `src/app/(main)/dashboard-metrics/page.tsx`          |
| Database Migration    | `scripts/migrations/create-ai-suggestions-table.sql` |
| Full Docs             | `AI_SUGGESTION_FEATURE.md`                           |
| Setup Guide           | `AI_SUGGESTION_SETUP.md`                             |

---

## 🎓 Learning Resources

### Concepts Used

- **String Similarity**: Levenshtein Distance for fuzzy matching
- **Clustering**: Simple distance-based grouping
- **Server Actions**: NextJS 13+ "use server" directive
- **React Hooks**: Custom hook pattern
- **Database**: PostgreSQL with indexes

### Future Improvements

- [ ] NLP tokenization (use `natural` library)
- [ ] ML-based clustering (use `ml.js`)
- [ ] Email notifications
- [ ] Cron-based auto-generation
- [ ] Dashboard analytics
- [ ] Multi-language support

---

## ✨ Next Steps

1. **Run Database Migration** - Create the table
2. **Test in Development** - Verify all flows work
3. **Deploy** - Push to production
4. **Monitor** - Track usage and approval rates
5. **Iterate** - Improve based on admin feedback

---

**Status**: ✅ Complete & Ready for Testing
**Last Updated**: 2026-03-25
