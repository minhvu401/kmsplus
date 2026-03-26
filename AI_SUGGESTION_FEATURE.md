# AI Suggestion Feature Documentation

## Overview

Hệ thống AI Suggestion tự động phân tích câu hỏi trong Q&A để tìm ra các topic được nhắc đến nhiều nhất, sau đó gợi ý cho ADMIN tạo khóa học mới.

## Features

### 1. Automatic Topic Analysis

- **Phân tích trong các khoảng thời gian**: 7 ngày, 14 ngày, 30 ngày
- **Clustering tương tự**: Nhóm các câu hỏi có nội dung tương tự thành một topic
- **Keyword Extraction**: Trích xuất keywords từ tiêu đề và nội dung câu hỏi
- **Confidence Score**: Tính độ tin cậy của mỗi topic dựa trên tần suất xuất hiện

### 2. Smart Suggestion System

- ✅ Tự động tạo suggestion khi admin/director vào Dashboard Metrics
- ✅ Chỉ tạo suggestion mới nếu topic khác với suggestion cũ
- ✅ Lưu trạng thái suggestion (pending, approved, dismissed)
- ✅ Tracking admin đã phê duyệt suggestion

### 3. Admin Actions

- **Đồng ý (Approve)**: Tạo khóa học mới từ gợi ý
  - Chuyển hướng tới Course Management
  - Pre-fill topic name vào form tạo khóa học
  - Đánh dấu suggestion status = "approved"

- **Không Đồng Ý (Dismiss)**: Ẩn suggestion hiện tại
  - Ẩn buttons action
  - Đánh dấu suggestion status = "dismissed"
  - Chờ suggestion mới từ topic khác

## Architecture

```
┌─ Service Layer
│  └─ ai-suggestion.service.ts
│     ├── analyzeTopic(days)          // Phân tích topics
│     ├── getQuestionsInRange(days)   // Lấy Q&A trong khoảng thời gian
│     ├── clusterQuestions()          // Nhóm câu hỏi tương tự
│     ├── getTopTopic()               // Lấy topic được nhắc đến nhiều nhất
│     └── updateSuggestionStatus()    // Cập nhật trạng thái
│
├─ Server Actions
│  └─ ai-suggestion-action.ts
│     ├── analyzeQATopics()           // Phân tích từ client
│     ├── createAISuggestion()        // Tạo suggestion mới
│     ├── approveSuggestion()         // Phê duyệt
│     └── dismissSuggestion()         // Từ chối
│
├─ API Routes
│  └─ /api/ai-suggestion
│     ├── GET    // Lấy suggestion
│     ├── POST   // Tạo suggestion mới
│     └── PATCH  // Update status
│
├─ Components
│  ├─ AISuggestionPanel.tsx           // Main UI component
│  └─ hooks/useAutoAISuggestion.ts    // Auto-check hook
│
└─ Database
   └─ ai_suggestions table
      ├── id
      ├── topic
      ├── topic_count
      ├── date_range (7, 14, 30)
      ├── status (pending, approved, dismissed)
      ├── admin_id
      └── created_at, updated_at
```

## Integration Points

### 1. Dashboard Metrics (`/dashboard-metrics`)

- AISuggestionPanel được nhúng vào dashboard
- useAutoAISuggestion hook tự động kiểm tra khi admin access

### 2. Course Management (`/courses/management`)

- Nhận topic từ URL params: `?create=true&topic=<topic_name>`
- Pre-fill topic vào form tạo khóa học

### 3. Q&A System (`/questions`)

- Tất cả câu hỏi tự động được phân tích
- Không cần integration thêm

## Usage

### For Admins/Directors

1. **Access Dashboard Metrics**
   - Vào `/dashboard-metrics`
   - Hệ thống tự động kiểm tra và tạo suggestion nếu cần

2. **Review Suggestions**
   - Xem AI Suggestion Panel ở phía trên dashboard
   - Kiểm tra topic được nhắc đến nhiều nhất
   - Xem số lần được nhắc đến

3. **Manual Topic Analysis**
   - Click buttons 7, 14, 30 ngày
   - Click "Phân Tích" để xem toàn bộ topics
   - Sắp xếp theo tần suất xuất hiện

4. **Take Action**
   - **Đồng ý**: Tạo khóa học mới
     - Chuyển hướng tới Course Management
     - Topic tự động được điền
   - **Không**: Ẩn suggestion hiện tại
     - Với lần tiếp theo, nếu topic khác sẽ có gợi ý mới

### Database Setup

1. **Run Migration**

   ```bash
   # Execute SQL script
   psql -U <user> -d <database> -f scripts/migrations/create-ai-suggestions-table.sql
   ```

2. **Table Structure**
   ```sql
   CREATE TABLE ai_suggestions (
     id SERIAL PRIMARY KEY,
     topic VARCHAR(255) NOT NULL,
     topic_count INTEGER NOT NULL,
     date_range INTEGER NOT NULL DEFAULT 30,
     status VARCHAR(50) NOT NULL DEFAULT 'pending',
     admin_id INTEGER REFERENCES users(id),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

## Algorithm Details

### Topic Clustering

- **Method**: String Similarity + Keyword Matching
- **Similarity Threshold**: 60%
- **Algorithm**: Levenshtein Distance

### Example

```
Questions:
1. "Làm sao để xài con AI này" (topic: xài AI)
2. "Cách sử dụng AI" (topic: sử dụng AI)
3. "Tôi muốn sử dụng còn AI này thì làm sao để xài" (topic: xài AI)

After Clustering:
- Topic "xài AI": Count = 2 (questions 1, 3)
- Topic "sử dụng AI": Count = 1 (question 2)

Confidence Score:
- "xài AI": (2/3) * 100 = 66.67%
- "sử dụng AI": (1/3) * 100 = 33.33%

Result: "xài AI" được chọn làm top topic
```

## Key Files

| File                                                 | Purpose                                    |
| ---------------------------------------------------- | ------------------------------------------ |
| `src/service/ai-suggestion.service.ts`               | Core logic - phân tích, clustering, saving |
| `src/action/ai-suggestion-action.ts`                 | Server actions - gọi từ client             |
| `src/app/api/ai-suggestion/route.ts`                 | REST API endpoints                         |
| `src/components/AISuggestionPanel.tsx`               | Main UI component                          |
| `src/components/hooks/useAutoAISuggestion.ts`        | React hook auto-check                      |
| `src/app/(main)/dashboard-metrics/page.tsx`          | Dashboard integration                      |
| `scripts/migrations/create-ai-suggestions-table.sql` | Database migration                         |

## Future Enhancements

- [ ] Use NLP library (e.g., `natural`) cho keyword extraction tốt hơn
- [ ] Implement Email notification khi có suggestion mới
- [ ] Add analytics: topic trends over time
- [ ] Batch processing cho large datasets
- [ ] Multi-language support trong topic analysis
- [ ] Integration với Course Recommendation System
- [ ] Admin dapat custom similarity threshold
- [ ] Scheduled suggestion generation (cron job)

## Troubleshooting

### Issue: Suggestion không được tạo

**Solution**: Kiểm tra xem:

- Database table `ai_suggestions` đã tồn tại?
- User có role ADMIN hoặc DIRECTOR?
- Có ít nhất 1 question trong Q&A?

### Issue: Topic clustering không chính xác

**Solution**:

- Kiểm tra similarity threshold (hiện tại là 60%)
- Có thể tăng threshold nếu quá nhiều false positives
- Stop words list có đang filter đúng?

### Issue: Performance slow khi phân tích

**Solution**:

- Limit số questions được phân tích (hiện tại no limit)
- Có thể thêm pagination
- Sử dụng database index

## Support

Liên hệ team development cho hỗ trợ thêm!
