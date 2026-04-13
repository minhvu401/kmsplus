# AI Suggestion Feature - Setup Checklist

## ✅ Đã Tạo/Cập Nhật

### Service Layer

- [x] `src/service/ai-suggestion.service.ts` - Core logic
  - Topic analysis từ Q&A
  - Question clustering
  - String similarity calculation (Levenshtein distance)
  - Database operations (save, update, get suggestions)

### Server Actions

- [x] `src/action/ai-suggestion-action.ts` - Server-side functions
  - `analyzeQATopics(days)` - Phân tích topics
  - `createAISuggestion(days)` - Tạo suggestion mới
  - `approveSuggestion(id)` - Phê duyệt
  - `dismissSuggestion(id)` - Từ chối

### API Routes

- [x] `src/app/api/ai-suggestion/route.ts`
  - GET /api/ai-suggestion - Get latest suggestion
  - POST /api/ai-suggestion - Create new suggestion
  - PATCH /api/ai-suggestion - Update status

### Components

- [x] `src/components/AISuggestionPanel.tsx` - Main UI
  - Display suggestion with approve/dismiss buttons
  - Manual topic analysis with date range filter
  - Live topic list view

- [x] `src/components/hooks/useAutoAISuggestion.ts` - Auto-check hook
  - Auto-check khi admin access dashboard
  - 1 hour interval check

### Dashboard Integration

- [x] `src/app/(main)/dashboard-metrics/page.tsx`
  - Import AISuggestionPanel
  - Import useAutoAISuggestion hook
  - Display panel after header

### Database Migration

- [x] `scripts/migrations/create-ai-suggestions-table.sql`
  - Create ai_suggestions table
  - Create indexes
  - Auto-update trigger

### Documentation

- [x] `AI_SUGGESTION_FEATURE.md` - Full documentation

## 🔧 Cần Setup Trước Deploy

### 1. Database Setup

```bash
# 1.1 Connect to database
psql -U your_user -d your_database -h localhost

# 1.2 Run migration
\i scripts/migrations/create-ai-suggestions-table.sql

# 1.3 Verify table created
\dt ai_suggestions
```

### 2. Environment Check

- [ ] Check if `getSession()` function exists và works
- [ ] Verify `requireAuth()` function exists
- [ ] Verify database connection string configured

### 3. Dependencies Check

```bash
# Check if dayjs is installed
npm ls dayjs
# or
pnpm list dayjs

# If not, install:
npm install dayjs
# or
pnpm add dayjs
```

### 4. Route/Navigation Setup

Verify these routes exist:

- [ ] `/dashboard-metrics` - Dashboard Metrics page
- [ ] `/courses/management` - Course Management page
- [ ] `/questions` - Q&A Questions page

### 5. Authentication/Authorization

- [ ] Verify `Role.ADMIN` enum exists
- [ ] Verify `Role.DIRECTOR` enum exists
- [ ] Verify role-based access control working

## 🚀 Pre-Deployment Testing

### Unit Tests to Create (Optional but Recommended)

```typescript
// Test similarity function
describe("stringSimilarity", () => {
  it("should return 100 for identical strings")
  it("should return 0 for completely different strings")
  it("should handle Vietnamese text")
})

// Test clustering
describe("clusterQuestions", () => {
  it("should cluster similar questions")
  it("should handle empty list")
  it("should not over-cluster different topics")
})

// Test API
describe("POST /api/ai-suggestion", () => {
  it("should require admin role")
  it("should create suggestion with valid data")
  it("should prevent duplicate suggestions")
})
```

### Manual Testing Steps

1. **Dashboard Access**
   - [ ] Login as ADMIN
   - [ ] Navigate to `/dashboard-metrics`
   - [ ] Verify AISuggestionPanel appears
   - [ ] Check console for no errors

2. **Topic Analysis**
   - [ ] Ensure there are questions in Q&A
   - [ ] Click "7 ngày" button
   - [ ] Click "Phân Tích"
   - [ ] Verify topics list displays
   - [ ] Check topic count is accurate

3. **Approve Flow**
   - [ ] Click "Đồng ý" button (if suggestion exists)
   - [ ] Verify redirect to `/courses/management`
   - [ ] Check topic is pre-filled in form
   - [ ] Verify suggestion status changes to "approved"

4. **Dismiss Flow**
   - [ ] Click "Không" button
   - [ ] Verify buttons become hidden
   - [ ] Check alert message appears
   - [ ] Verify suggestion status changes to "dismissed"

5. **Database Check**
   - [ ] Query ai_suggestions table
   - [ ] Verify data is being saved correctly
   - [ ] Check timestamps are correct

## 📋 Optional Enhancements

For better production readiness, consider:

### 1. Error Handling

- [ ] Add try-catch in components
- [ ] Add error notifications to user
- [ ] Log errors to monitoring system

### 2. Performance

- [ ] Add pagination for large topic lists
- [ ] Add caching layer for frequently accessed data
- [ ] Optimize database queries with CTEs

### 3. UX Improvements

- [ ] Add loading states
- [ ] Add animations
- [ ] Add undo functionality
- [ ] Add suggestion history

### 4. Monitoring

- [ ] Track suggestion creation frequency
- [ ] Monitor approval vs dismiss ratio
- [ ] Track course creation from suggestions

## 🔍 Validation Checklist

Before go-live:

- [ ] All imported functions exist
- [ ] Database schema matches code expectations
- [ ] Auth/role system is working
- [ ] No console errors
- [ ] Mobile responsive (if needed)
- [ ] Accessibility standards met
- [ ] UI matches design specs
- [ ] All buttons functional
- [ ] Redirect flows working

## 📞 Support/Questions

If you encounter issues during setup:

1. Check `AI_SUGGESTION_FEATURE.md` for detailed documentation
2. Review error logs in browser console
3. Check database logs for SQL errors
4. Verify all required data exists (users, questions, etc)

## 🎯 Success Criteria

Feature is ready when:

- ✅ Dashboard loads without errors
- ✅ Suggestion can be created, approved, and dismissed
- ✅ Topic analysis works for 7, 14, 30 day periods
- ✅ Redirect to course management works with pre-filled data
- ✅ Admin can see suggestion history
- ✅ No console errors or warnings
