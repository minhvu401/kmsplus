# Tính năng Giải Thích AI - Tóm tắt Triển khai

## Tổng quan

Tạo một tính năng giải thích được hỗ trợ bởi AI toàn diện cho các câu hỏi trong bài kiểm tra KMS Plus. Bây giờ học sinh có thể nhận được những giải thích sâu sắc hơn về câu trả lời của bài kiểm tra bằng cách sử dụng Gemini AI.

## Các tệp được tạo

### 1. Thành phần AIExplanationButton

**Tệp:** `src/components/ui/quizzes/AIExplanationButton.tsx`

Một thành phần client React có:

- Hiển thị nút có biểu tượng bóng đèn để yêu cầu giải thích AI
- Hiển thị trạng thái đang tải trong khi tạo giải thích
- Hiển thị giải thích đầy đủ trong hộp thoại hình ảnh
- Hiển thị giải thích được định dạng markdown với kiểu dáng tốt
- Xử lý các trạng thái lỗi một cách thanh lịch

Tính năng:

- Gọi hoạt động máy chủ `getQuestionExplanation`
- Hiển thị giải thích với hỗ trợ markdown
- Hiển thị văn bản câu hỏi trong hộp thoại để có ngữ cảnh
- Hỗ trợ trích dẫn khối, khối mã, danh sách và định dạng văn bản

## Các tệp được sửa đổi

### 1. Cải tiến Dịch vụ Gemini

**Tệp:** `src/service/gemini.service.ts`

**Hàm được thêm:** `generateAIExplanation(input: ExplanationInput)`

Các tham số đầu vào:

- `questionText`: Câu hỏi trong bài kiểm tra
- `explanation`: Giải thích ban đầu từ tài liệu khóa học
- `correctAnswer`: Câu trả lời đúng
- `questionType`: "single_choice" hoặc "multiple_choice"
- `options`: Các tùy chọn có sẵn
- `userAnswer`: Học sinh đã trả lời gì
- `category`: Chủ đề/danh mục của câu hỏi

Tính năng:

- Sử dụng mô hình `gemini-2.5-flash` để phản hồi nhanh
- Bao gồm lời nhắc hệ thống chuyên biệt cho dạy học
- Cung cấp những giải thích toàn diện bao gồm:
  - Giải thích khái niệm cốt lõi
  - Tại sao câu trả lời đúng
  - Những hiểu lầm phổ biến
  - Các ví dụ trong thế giới thực
  - Mẹo học tập
- Xử lý lỗi cho các lỗi vượt quá hạn ngạch (429)
- Giải thích 200-400 từ

### 2. Hành động Bài kiểm tra

**Tệp:** `src/action/quiz/quizActions.ts`

**Hàm được thêm:** `getQuestionExplanation(input: unknown)`

Xác thực và xử lý các yêu cầu giải thích:

- Xác thực tải trọng với attemptId và questionId
- Xác thực người dùng
- Xác minh quyền sở hữu nỗ lực và hoàn thành (chỉ được gửi)
- Truy xuất chi tiết câu hỏi từ bảng `question_bank`
- Lấy câu trả lời của người dùng từ `attempt_answers`
- Phân tích cú pháp các tùy chọn và câu trả lời đúng
- Lấy tên danh mục cho ngữ cảnh
- Gọi `generateAIExplanation` với tất cả dữ liệu
- Trả về giải thích hoặc thông báo lỗi

Kiểm tra bảo mật:

- Người dùng phải sở hữu nỗ lực kiểm tra bài kiểm tra
- Nỗ lực kiểm tra bài kiểm tra phải có trạng thái "đã gửi"
- Chỉ cho phép truy xuất giải thích sau khi hoàn thành bài kiểm tra

### 3. Thành phần Kết quả Bài kiểm tra

**Tệp:** `src/components/ui/quizzes/quiz-result.tsx`

Thay đổi:

- Thêm nhập cho `AIExplanationButton`
- Sửa đổi `QuestionCard` để chấp nhận prop `attemptId`
- Chuyển `attemptId` khi hiển thị câu hỏi
- Thêm `AIExplanationButton` trong Phần Giải thích
- Nút được đặt vào bên cạnh "Phản hồi từ Giảng viên"

### 4. Dịch vụ Bài kiểm tra

**Tệp:** `src/service/quiz.service.ts`

Thay đổi:

- Thêm trường `id?: number` vào loại `AttemptResult`
- Sửa đổi `getAttemptResultAction` để trả về `attemptId`

## Tham chiếu Lược đồ Cơ sở dữ liệu

Sử dụng các trường bảng `question_bank`:

- `id` - Khóa chính câu hỏi
- `question_text` - Nội dung câu hỏi
- `explanation` - Giải thích tài liệu khóa học (được sử dụng như nền tảng)
- `type` - Loại câu hỏi (single_choice/multiple_choice)
- `options` - Các tùy chọn trả lời có sẵn (JSONB)
- `correct_answer` - Câu trả lời chính xác (JSONB)
- `category_id` - Danh mục khóa học để có ngữ cảnh

Sử dụng các trường bảng `attempt_answers`:

- `attempt_id` - Liên kết đến nỗ lực kiểm tra
- `question_id` - Câu hỏi cụ thể
- `selected_answer` - Học sinh đã chọn gì

## Luồng Trải nghiệm Người dùng

### Trước khi Thực hiện Bài kiểm tra

- Người dùng thực hiện bài kiểm tra bình thường
- Trả lời các câu hỏi như bình thường

### Sau khi Hoàn thành Bài kiểm tra

- Trang kết quả bài kiểm tra hiển thị tóm tắt với thống kê
- Trong chế độ xem chi tiết, mỗi thẻ câu hỏi hiển thị:
  - Văn bản câu hỏi
  - Câu trả lời của học sinh
  - Câu trả lời đúng
  - Phản hồi từ giảng viên
  - **MỚI:** Nút "Nhận Giải thích AI"

### Sử dụng Giải thích AI

1. Nhấp vào nút "Nhận Giải thích AI"
2. Nút hiển thị vòng quay tải với văn bản "Đang tạo..."
3. Hộp thoại mở với giải thích được tạo bởi AI
4. Giải thích bao gồm:
   - Tham chiếu câu hỏi ban đầu
   - Giải thích được làm sâu hơn
   - Phân tích khái niệm
   - Tại sao câu trả lời đúng
   - Những sai lầm phổ biến
   - Mẹo học tập
5. Người dùng có thể đóng hộp thoại và tiếp tục xem lại

## Các phụ thuộc được thêm

- `react-markdown` v10.1.0 - Để hiển thị giải thích markdown

## Tích hợp API

Sử dụng thiết lập Gemini API hiện có:

- Mô hình: `gemini-2.5-flash` (nhanh, hiệu quả)
- Lời nhắc hệ thống được điều chỉnh cho dạy học giáo dục
- Suy thoái duyền hòa khi vượt quá giới hạn hạn ngạch

## Cân nhắc về Hiệu suất

- Tạo hình không đồng bộ - không chặn giao diện người dùng
- Dư hình dựa trên phương thức cho UX tốt hơn
- Hiển thị markdown với kiểu dáng được tối ưu hóa
- Trạng thái tải cho phản hồi của người dùng

## Xử lý Lỗi

- Xác thực xác thực người dùng
- Xác minh quyền sở hữu nỗ lực
- Kiểm tra trạng thái hoàn thành bài kiểm tra
- Xử lý lỗi vượt quá hạn ngạch (429)
- Trả về thông báo lỗi thân thiện cho người dùng

## Tính năng Bảo mật

- Chỉ người dùng được xác thực mới có thể yêu cầu giải thích
- Người dùng chỉ có thể xem giải thích cho các nỗ lực của riêng họ
- Chỉ sau khi gửi bài kiểm tra để ngăn chặn gian lận
- Xác thực tất cả các đầu vào phía máy chủ
