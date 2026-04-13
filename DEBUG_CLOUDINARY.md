# 🐛 Debug Cloudinary Upload Issue

## Checklist để kiểm tra

### 1. Kiểm tra Environment Variables
Mở file `.env.local` và đảm bảo có đủ 3 biến:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Cách lấy:**
1. Đăng nhập https://cloudinary.com/console
2. Vào Settings → Credentials
3. Copy Cloud Name, API Key, API Secret

### 2. Restart Development Server
Sau khi thêm/sửa `.env.local`:
```bash
# Stop server (Ctrl+C) rồi chạy lại
pnpm dev
```

### 3. Test Upload Flow
1. Mở trang Article Management hoặc Articles
2. Click "Create Article" / "Tạo Bài Viết Mới"
3. Mở **Browser Console** (F12 → Console tab)
4. Click "Click to Upload Thumbnail"
5. Chọn 1 ảnh (JPG, PNG, < 5MB)
6. Xem logs trong console:
   - `Starting thumbnail upload...` - File được chọn
   - `Upload successful:` - Upload thành công
   - Nếu có error → xem chi tiết lỗi

### 4. Các lỗi thường gặp

#### ❌ "Unauthorized" (401)
**Nguyên nhân:** Chưa login hoặc session expired
**Giải pháp:** Login lại vào hệ thống

#### ❌ "Cloudinary configuration missing"
**Nguyên nhân:** Thiếu environment variables
**Giải pháp:** 
1. Tạo file `.env.local`
2. Thêm CLOUDINARY credentials
3. Restart dev server

#### ❌ "Upload failed: 400 Bad Request"
**Nguyên nhân:** Cloudinary credentials sai
**Giải pháp:** Kiểm tra lại Cloud Name, API Key, API Secret

#### ❌ "Upload failed: 500 Internal Server Error"
**Nguyên nhân:** File quá lớn hoặc format không hỗ trợ
**Giải pháp:** 
- Chỉ upload ảnh JPG, PNG, WebP
- File size < 10MB

### 5. Xem Network Request
1. Mở Browser DevTools (F12)
2. Tab **Network**
3. Filter: "cloudinary"
4. Upload ảnh
5. Click vào request `/api/cloudinary/upload`
6. Xem **Response** tab để thấy error chi tiết

### 6. Test thủ công API
```bash
# Trong terminal
curl -X POST http://localhost:3000/api/cloudinary/upload \
  -H "Cookie: your-session-cookie" \
  -F "file=@path/to/image.jpg" \
  -F "folder=article-thumbnails"
```

## ✅ Upload thành công khi:
1. Console log: `Upload successful: { url: ..., public_id: ... }`
2. Preview ảnh hiển thị trong modal
3. Submit article → ảnh được lưu vào database
4. Vào Cloudinary Dashboard → Media Library → thấy ảnh trong folder `article-thumbnails`

## 🔍 Debug Tips
- Mở console trước khi test
- Đọc kỹ error message
- Check Network tab để xem request/response
- Verify Cloudinary credentials
- Đảm bảo đã restart dev server sau khi sửa .env
